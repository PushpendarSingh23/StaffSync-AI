/**
 * metrics.js
 *
 * Simple in-process counters for the /health endpoint. Deliberately not a
 * full metrics library (no Prometheus client, no persistence) — this is
 * basic observability for a single-instance deployment, not a
 * production-grade metrics pipeline.
 *
 * Everything here resets on process restart, which is fine: it's meant to
 * answer "is this instance healthy and roughly how busy is it right now",
 * not to be a system of record.
 *
 * NOTE: does not import logger.js — logger.js imports this module (to
 * record every request as it logs it), so keeping this dependency-free
 * avoids a circular import between the two.
 */

let requestCount = 0;
const statusCounts = {}; // e.g. { '200': 42, '404': 3 }

// Simple running average for RAG pipeline latency (chatService.answerQuestion,
// non-cache-hit path only — cache hits are ~instant and would just dilute
// the number this is meant to convey: "how slow is a real RAG round-trip").
let ragLatencyCount = 0;
let ragLatencyTotalMs = 0;

/** Called from logger.js's requestLogger middleware once a response finishes. */
export const recordRequest = ({ status } = {}) => {
  requestCount += 1;
  if (status != null) {
    const key = String(status);
    statusCounts[key] = (statusCounts[key] || 0) + 1;
  }
};

/** Called from chatService.js after a full (non-cached) RAG pipeline run. */
export const recordRagLatency = (durationMs) => {
  ragLatencyCount += 1;
  ragLatencyTotalMs += durationMs;
};

/** Snapshot of everything tracked so far, for the /health endpoint. */
export const getMetrics = () => ({
  requestsServed: requestCount,
  requestsByStatus: { ...statusCounts },
  avgRagLatencyMs: ragLatencyCount
    ? Number((ragLatencyTotalMs / ragLatencyCount).toFixed(1))
    : null,
  ragRequestsServed: ragLatencyCount,
});

/** Test-only helper — resets all counters. Not used in production code paths. */
export const _resetForTests = () => {
  requestCount = 0;
  ragLatencyCount = 0;
  ragLatencyTotalMs = 0;
  Object.keys(statusCounts).forEach((k) => delete statusCounts[k]);
};
