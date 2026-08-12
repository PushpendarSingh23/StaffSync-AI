/**
 * answerCache.js
 *
 * Simple in-process TTL cache for AI answers.
 *
 * Key = normalised question string (lowercase, collapsed whitespace).
 * TTL = config.cacheTtlMs (default 10 minutes).
 *
 * The cache is invalidated (fully cleared) when any document is deleted or
 * re-indexed, since the underlying knowledge base has changed.
 *
 * get/set/invalidate stay async so callers don't need to change if this is
 * ever swapped for a networked cache later — but today it's just a Map.
 */

import { config } from '../config/serverConfig.js';
import logger from '../utils/logger.js';

const CTX = 'cache';

// Map<normalizedKey, { value, expiresAt }>
const store = new Map();

// Lifetime hit/miss counters, exposed via getStats() for the /health endpoint.
let hits = 0;
let misses = 0;

/** Normalise a question for use as a cache key */
export const normaliseKey = (question) =>
  question.toLowerCase().replace(/\s+/g, ' ').trim();

/** Get a cached answer, or undefined if missing / expired */
export const get = async (question) => {
  const key = normaliseKey(question);
  const entry = store.get(key);
  if (!entry) {
    misses += 1;
    return undefined;
  }

  if (Date.now() > entry.expiresAt) {
    store.delete(key);
    misses += 1;
    logger.debug(CTX, 'Cache miss (expired)', { key: key.slice(0, 60) });
    return undefined;
  }

  hits += 1;
  logger.info(CTX, 'Cache hit', { key: key.slice(0, 60) });
  return entry.value;
};

/** Store an answer in the cache */
export const set = async (question, value) => {
  const key = normaliseKey(question);
  store.set(key, { value, expiresAt: Date.now() + config.cacheTtlMs });
  logger.debug(CTX, 'Cache set', { key: key.slice(0, 60), size: store.size });
};

/**
 * Invalidate the entire cache.
 * Call this after any document is deleted, updated, or re-indexed.
 */
export const invalidate = async () => {
  const prev = store.size;
  store.clear();
  logger.info(CTX, `Cache invalidated — cleared ${prev} entries`);
};

/** Current number of cached entries (for diagnostics) */
export const size = () => store.size;

/** Hit/miss/size snapshot for the /health endpoint. */
export const getStats = () => {
  const total = hits + misses;
  return {
    size: store.size,
    hits,
    misses,
    hitRate: total ? Number((hits / total).toFixed(3)) : null,
  };
};

/** Test-only helper — resets hit/miss counters (does not clear entries). */
export const _resetStatsForTests = () => {
  hits = 0;
  misses = 0;
};
