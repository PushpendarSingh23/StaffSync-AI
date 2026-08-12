/**
 * rerankService.js
 *
 * Live cross-encoder reranking stage for the RAG chat pipeline.
 *
 * Where it sits in the pipeline (see chatService.js):
 *   1. vectorService.similaritySearch() now returns a WIDER candidate pool
 *      (config.retrievalPoolSize, ~15-20) instead of just the final top-k.
 *   2. rerankChunks() below scores every (question, chunk.text) pair with a
 *      cross-encoder and re-sorts the candidates by that score.
 *   3. Only the top `topN` (config.topK, default 5) survive to become the
 *      context block promptBuilder sends to Gemini.
 *
 * Model: cross-encoder/ms-marco-MiniLM-L-6-v2, via its Transformers.js ONNX
 * port (Xenova/ms-marco-MiniLM-L-6-v2), so it runs in-process in Node with
 * no Python, no extra service, and no
 * per-request network call (the ~35MB quantized model is downloaded once
 * and cached on disk, then reused for every request).
 *
 * Failure handling: model load or inference errors are logged and this
 * module falls back to returning the first `topN` candidates in their
 * original vector-search order. A rerank hiccup degrades the pipeline back
 * to today's behavior — it never breaks the chat request.
 */

import { AutoTokenizer, AutoModelForSequenceClassification } from '@huggingface/transformers';
import { config } from '../config/serverConfig.js';
import logger from '../utils/logger.js';

const CTX = 'rerankService';

// ── Model loading (singleton — loaded once, reused for every request) ──────

let loadPromise = null;

/**
 * Lazily load the cross-encoder tokenizer + model. Cached after the first
 * call so subsequent chat requests just reuse the in-memory instance
 * instead of re-downloading or re-initializing the ONNX session.
 */
const loadReranker = () => {
  if (!loadPromise) {
    loadPromise = (async () => {
      logger.info(CTX, 'Loading cross-encoder reranker', { model: config.rerankModel });
      const [tokenizer, model] = await Promise.all([
        AutoTokenizer.from_pretrained(config.rerankModel),
        AutoModelForSequenceClassification.from_pretrained(config.rerankModel),
      ]);
      logger.info(CTX, 'Cross-encoder reranker ready', { model: config.rerankModel });
      return { tokenizer, model };
    })().catch((err) => {
      // Reset so a later request can retry (e.g. transient network failure
      // on first download) instead of permanently caching a rejected promise.
      loadPromise = null;
      throw err;
    });
  }
  return loadPromise;
};

/**
 * Score every (question, passage) pair with the cross-encoder in a single
 * batched forward pass. Returns raw logits — higher means more relevant —
 * in the same order as `passages` (no sigmoid/softmax; the raw score is
 * used directly for ranking).
 *
 * @param {string} question
 * @param {string[]} passages
 * @returns {Promise<number[]>}
 */
const scorePairs = async (question, passages) => {
  const { tokenizer, model } = await loadReranker();

  const questions = passages.map(() => question);
  const inputs = tokenizer(questions, {
    text_pair: passages,
    padding: true,
    truncation: true,
  });

  const { logits } = await model(inputs);
  return Array.from(logits.data);
};

// ── Public API ───────────────────────────────────────────────────────────

/**
 * rerankChunks — rescore vector-search candidates with a cross-encoder and
 * keep only the best `topN`.
 *
 * @param {string} question   — the standalone question (post-condense) used for retrieval
 * @param {Array}  chunks     — candidates from vectorService.similaritySearch(), each
 *                               { text, metadata, score, ... }, already sorted by vector score
 * @param {number} [topN]     — how many reranked chunks to keep (default: config.topK)
 * @returns {Promise<Array>}  — up to `topN` chunks, reordered by cross-encoder score.
 *                              Each chunk keeps its original `score` (Atlas vector score,
 *                              used for confidence bucketing) and gains a `rerankScore`.
 */
export const rerankChunks = async (question, chunks, topN = config.topK) => {
  if (!chunks.length) return chunks;

  if (!config.rerankEnabled) {
    return chunks.slice(0, topN);
  }

  try {
    const scores = await scorePairs(question, chunks.map((c) => c.text));

    const scored = chunks.map((chunk, i) => ({ ...chunk, rerankScore: scores[i] }));
    scored.sort((a, b) => b.rerankScore - a.rerankScore);

    logger.debug(CTX, 'Reranked candidates', {
      candidates: chunks.length,
      kept: Math.min(topN, scored.length),
      topRerankScore: Number(scored[0]?.rerankScore.toFixed(3)),
    });

    return scored.slice(0, topN);
  } catch (err) {
    logger.error(CTX, 'Cross-encoder rerank failed — falling back to vector-search order', {
      error: err.message,
    });
    return chunks.slice(0, topN);
  }
};
