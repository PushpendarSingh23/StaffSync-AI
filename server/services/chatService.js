/**
 * chatService.js
 *
 * RAG chat pipeline behind the blocking JSON chat endpoint:
 *  1. Check cache — return immediately if hit
 *  2. Condense the question against recent session history (multi-turn memory)
 *  3. Embed the standalone question with Gemini embedding-001
 *  4. Atlas Vector Search → wider candidate pool (config.retrievalPoolSize)
 *  4b. Cross-encoder rerank (rerankService) → best config.topK chunks
 *  5. No chunks → return the "not found" message
 *  6. Build grounded prompt via promptBuilder, threading prior turns in
 *  7. Call Gemini chat model
 *  8. Cache and return the final result
 */

import { GoogleGenerativeAIEmbeddings, ChatGoogleGenerativeAI } from '@langchain/google-genai';
import { HumanMessage, SystemMessage, AIMessage } from '@langchain/core/messages';
import { similaritySearch } from './vectorService.js';
import { rerankChunks } from './rerankService.js';
import { SYSTEM_PROMPT, buildUserMessage, CONDENSE_SYSTEM_PROMPT, buildCondenseUserMessage } from './promptBuilder.js';
import { get as cacheGet, set as cacheSet } from './answerCache.js';
import { getRecentTurns } from './conversationMemory.js';
import { config } from '../config/serverConfig.js';
import logger from '../utils/logger.js';
import { recordRagLatency } from '../utils/metrics.js';

const CTX = 'chatService';

const NOT_FOUND_MESSAGE =
  "I couldn't find this information in the HR knowledge base.";

const makeEmbedder = () =>
  new GoogleGenerativeAIEmbeddings({
    apiKey: process.env.GEMINI_API_KEY,
    model:  config.embeddingModel,
  });

const makeChatLLM = (overrides = {}) =>
  new ChatGoogleGenerativeAI({
    apiKey:          process.env.GEMINI_API_KEY,
    model:           config.chatModel,
    temperature:     0,
    maxOutputTokens: 1024,
    ...overrides,
  });

/** Map a top vector-search score to a coarse confidence bucket. Exported for reuse in the retrieval eval script. */
export const scoreToConfidence = (topScore) => {
  if (topScore >= config.highConfidence)   return 'high';
  if (topScore >= config.mediumConfidence) return 'medium';
  return 'low';
};

/**
 * Rewrite a follow-up question into a standalone one using recent history.
 * No-op when there's no history to condense against, or if the condense
 * call itself fails — falls back to the raw question either way so a
 * hiccup here never blocks the pipeline.
 */
const condenseQuestion = async (question, history) => {
  if (!history.length) return question;

  try {
    const llm = makeChatLLM({ maxOutputTokens: 256 });
    const response = await llm.invoke([
      new SystemMessage(CONDENSE_SYSTEM_PROMPT),
      new HumanMessage(buildCondenseUserMessage(history, question)),
    ]);
    const standalone = (typeof response.content === 'string'
      ? response.content
      : String(response.content ?? '')).trim();
    return standalone || question;
  } catch (err) {
    logger.error(CTX, 'Condense step failed — using raw question', { error: err.message });
    return question;
  }
};

/**
 * Shared retrieval step: load session history, condense the question against
 * it, embed the standalone question, run vector search over a wider
 * candidate pool, then rerank with the cross-encoder down to the final
 * top-k that actually gets sent to Gemini.
 *
 * @returns {Promise<{ history: Array, standaloneQuestion: string, chunks: Array }>}
 */
const retrieve = async (question, sessionId) => {
  const history = await getRecentTurns(sessionId);
  const standaloneQuestion = await condenseQuestion(question, history);

  if (standaloneQuestion !== question) {
    logger.debug(CTX, 'Condensed follow-up question', { from: question.slice(0, 80), to: standaloneQuestion.slice(0, 80) });
  }

  const queryVector = await makeEmbedder().embedQuery(standaloneQuestion);

  // Pull a wider pool than we'll actually use (config.retrievalPoolSize,
  // ~15-20) — the cross-encoder rerank below needs real candidates to
  // choose among, not just the vector search's already-final top-k.
  const candidates = await similaritySearch(queryVector, { k: config.retrievalPoolSize });

  // Rescore those candidates against the question and keep only the best
  // config.topK using the production cross-encoder reranker.
  const chunks = await rerankChunks(standaloneQuestion, candidates, config.topK);

  return { history, standaloneQuestion, chunks };
};

const buildSources = (chunks) => {
  const seenTitles = new Set();
  return chunks
    .map((chunk) => ({
      document:   chunk.metadata.title,
      category:   chunk.metadata.category,
      chunkIndex: chunk.metadata.chunkIndex,
      score:      Number((chunk.score ?? 0).toFixed(4)),
      // Present only when the rerank stage actually ran (rerankService adds
      // this field); omitted rather than defaulted to 0 so it's clear when
      // a result reflects raw vector-search order (e.g. rerank disabled/failed).
      ...(chunk.rerankScore !== undefined ? { rerankScore: Number(chunk.rerankScore.toFixed(4)) } : {}),
    }))
    .filter((s) => {
      if (seenTitles.has(s.document)) return false;
      seenTitles.add(s.document);
      return true;
    });
};

/** Turn prior {question, answer} turns into alternating Human/AI messages for the LLM call. */
const historyToMessages = (history) =>
  history.flatMap((turn) => [new HumanMessage(turn.question), new AIMessage(turn.answer)]);

/**
 * answerQuestion — blocking RAG pipeline with cache + multi-turn memory.
 *
 * @param {string} question
 * @param {object} [opts]
 * @param {string} [opts.sessionId] — groups turns for condensing + context
 * @returns {Promise<{ answer, sources, confidence }>}
 */
export const answerQuestion = async (question, { sessionId } = {}) => {
  // ── 1. Cache check ────────────────────────────────────────────────────────
  const cached = await cacheGet(question);
  if (cached) return cached;

  logger.info(CTX, 'Cache miss — running RAG pipeline', { q: question.slice(0, 80) });
  const pipelineStartedAt = process.hrtime.bigint();

  // ── 2–4. Condense → embed → vector search ───────────────────────────────────
  const { history, standaloneQuestion, chunks } = await retrieve(question, sessionId);

  // ── 5. No results ─────────────────────────────────────────────────────────
  if (!chunks.length) {
    recordRagLatency(Number(process.hrtime.bigint() - pipelineStartedAt) / 1e6);
    // Don't cache empty results — the knowledge base may grow
    return { answer: NOT_FOUND_MESSAGE, sources: [], confidence: 'low' };
  }

  // ── 6. Build prompt ───────────────────────────────────────────────────────
  const userMessage = buildUserMessage(standaloneQuestion, chunks);

  // ── 7. Call Gemini ────────────────────────────────────────────────────────
  const llm = makeChatLLM();
  const response = await llm.invoke([
    new SystemMessage(SYSTEM_PROMPT),
    ...historyToMessages(history),
    new HumanMessage(userMessage),
  ]);

  const answer = typeof response.content === 'string'
    ? response.content.trim()
    : String(response.content).trim();

  // ── 8. Build + deduplicate sources, score confidence ─────────────────────
  const sources   = buildSources(chunks);
  const topScore  = chunks[0]?.score ?? 0;
  const confidence = scoreToConfidence(topScore);
  const result    = { answer, sources, confidence };

  // ── 9. Store in cache ─────────────────────────────────────────────────────
  await cacheSet(question, result);
  const latencyMs = Number(process.hrtime.bigint() - pipelineStartedAt) / 1e6;
  recordRagLatency(latencyMs);
  logger.info(CTX, 'Pipeline complete', { confidence, sources: sources.length, latencyMs: Number(latencyMs.toFixed(1)) });

  return result;
};
