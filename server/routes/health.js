/**
 * health.js
 *
 * GET /health — unauthenticated liveness/readiness probe plus a lightweight
 * metrics snapshot. Intended for load balancer health checks and quick
 * manual "is it up, and roughly how's it doing" checks — not a substitute
 * for real APM/metrics infrastructure.
 *
 * Reports:
 *   - status / uptime / timestamp     — basic liveness
 *   - db.state                        — current Mongoose connection state
 *   - requests                        — total served + breakdown by status
 *     (from utils/metrics.js, fed by utils/logger.js's requestLogger)
 *   - rag                             — avg latency of non-cached RAG runs
 *   - cache                           — hit/miss/hitRate/size (answerCache.js)
 */

import express from 'express';
import mongoose from 'mongoose';
import { getMetrics } from '../utils/metrics.js';
import { getStats as getCacheStats } from '../services/answerCache.js';

const router = express.Router();

// Mirrors mongoose.ConnectionStates without importing the enum directly,
// since it's not consistently exported across mongoose versions.
const CONNECTION_STATES = {
  0: 'disconnected',
  1: 'connected',
  2: 'connecting',
  3: 'disconnecting',
};

router.get('/', (req, res) => {
  const { requestsServed, requestsByStatus, avgRagLatencyMs, ragRequestsServed } = getMetrics();

  res.json({
    success: true,
    status: 'ok',
    uptimeSeconds: Math.round(process.uptime()),
    timestamp: new Date().toISOString(),
    db: {
      state: CONNECTION_STATES[mongoose.connection.readyState] || 'unknown',
    },
    requests: {
      total: requestsServed,
      byStatus: requestsByStatus,
    },
    rag: {
      avgLatencyMs: avgRagLatencyMs,
      requestsServed: ragRequestsServed,
    },
    cache: getCacheStats(),
  });
});

export { router as healthRouter };
