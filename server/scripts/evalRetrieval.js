/**
 * evalRetrieval.js
 *
 * Offline retrieval quality check against your live Atlas Vector Search index.
 * For every question in eval/eval-set.json, embeds the question, runs the
 * same similaritySearch() used by the chat pipeline, and checks whether the
 * expected document shows up in the top-k results.
 *
 * Reports:
 *   - hit-rate@k        — % of questions whose expected document appears in top-k
 *   - avg top score     — mean of the best chunk's similarity score per question
 *   - confidence dist.  — how many questions would land in each confidence bucket
 *
 * Usage:
 *   cp eval/eval-set.example.json eval/eval-set.json   # then fill in real Qs
 *   npm run eval
 *   npm run eval -- --k=8                              # override top-k
 */

import dotenv from 'dotenv';
dotenv.config();

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import mongoose from 'mongoose';
import { GoogleGenerativeAIEmbeddings } from '@langchain/google-genai';
import connectDB from '../db/index.js';
import { similaritySearch } from '../services/vectorService.js';
import { scoreToConfidence } from '../services/chatService.js';
import { config } from '../config/serverConfig.js';
import logger from '../utils/logger.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname  = path.dirname(__filename);
const CTX = 'eval';

// ── CLI args ─────────────────────────────────────────────────────────────────
const kArg = process.argv.find((a) => a.startsWith('--k='));
const topK = kArg ? Number(kArg.split('=')[1]) : config.topK;

// ── Load eval set ────────────────────────────────────────────────────────────
const loadEvalSet = () => {
  const custom  = path.join(__dirname, '..', 'eval', 'eval-set.json');
  const example = path.join(__dirname, '..', 'eval', 'eval-set.example.json');
  const filePath = fs.existsSync(custom) ? custom : example;

  if (!fs.existsSync(custom)) {
    logger.warn(CTX, 'eval/eval-set.json not found — running against the bundled example set instead. Copy eval-set.example.json to eval-set.json with real questions for a meaningful report.');
  }

  const raw = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
  return raw.cases || [];
};

const normalise = (s) => (s || '').toLowerCase().trim();

const run = async () => {
  const cases = loadEvalSet();
  if (!cases.length) {
    logger.error(CTX, 'No eval cases found — nothing to run.');
    process.exit(1);
  }

  await connectDB();

  const embedder = new GoogleGenerativeAIEmbeddings({
    apiKey: process.env.GEMINI_API_KEY,
    model:  config.embeddingModel,
  });

  const results = [];

  for (const [i, testCase] of cases.entries()) {
    const { question, expectedDocument } = testCase;
    process.stdout.write(`[${i + 1}/${cases.length}] ${question.slice(0, 70)}... `);

    try {
      const queryVector = await embedder.embedQuery(question);
      const chunks = await similaritySearch(queryVector, { k: topK });

      const topScore  = chunks[0]?.score ?? 0;
      const confidence = scoreToConfidence(topScore);

      const rank = chunks.findIndex(
        (c) => normalise(c.metadata?.title) === normalise(expectedDocument)
      );
      const hit = rank !== -1;

      results.push({ question, expectedDocument, hit, rank: hit ? rank + 1 : null, topScore, confidence });
      console.log(hit ? `HIT  (rank ${rank + 1}, score ${topScore.toFixed(3)})` : `MISS (top result: ${chunks[0]?.metadata?.title ?? 'none'})`);
    } catch (err) {
      logger.error(CTX, 'Case failed', { question, error: err.message });
      results.push({ question, expectedDocument, hit: false, rank: null, topScore: 0, confidence: 'low', error: err.message });
      console.log('ERROR');
    }
  }

  // ── Report ───────────────────────────────────────────────────────────────
  const total   = results.length;
  const hits    = results.filter((r) => r.hit).length;
  const hitRate = ((hits / total) * 100).toFixed(1);
  const avgScore = (results.reduce((s, r) => s + r.topScore, 0) / total).toFixed(4);

  const confidenceDist = results.reduce((acc, r) => {
    acc[r.confidence] = (acc[r.confidence] || 0) + 1;
    return acc;
  }, { high: 0, medium: 0, low: 0 });

  console.log('\n──────────────────────────────────────────────');
  console.log(`Retrieval eval — k=${topK}, ${total} questions`);
  console.log('──────────────────────────────────────────────');
  console.log(`Hit-rate@${topK}:     ${hits}/${total} (${hitRate}%)`);
  console.log(`Avg top score:     ${avgScore}`);
  console.log(`Confidence dist.:  high=${confidenceDist.high}  medium=${confidenceDist.medium}  low=${confidenceDist.low}`);

  const misses = results.filter((r) => !r.hit);
  if (misses.length) {
    console.log('\nMisses:');
    misses.forEach((m) => console.log(`  - "${m.question}" (expected: ${m.expectedDocument})${m.error ? ` — error: ${m.error}` : ''}`));
  }
  console.log('');

  await mongoose.disconnect();
  process.exit(hits === total ? 0 : 1);
};

run().catch((err) => {
  logger.error(CTX, 'Eval run failed', { error: err.message });
  process.exit(1);
});
