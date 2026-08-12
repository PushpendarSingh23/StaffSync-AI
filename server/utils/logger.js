/**
 * logger.js
 * Thin structured logger.
 * Development: coloured, human-readable output.
 * Production:  JSON lines — compatible with Render/Railway log drains.
 */

import crypto from 'crypto';
import { recordRequest } from './metrics.js';

const IS_PROD = process.env.NODE_ENV === 'production';

const LEVELS = { error: 0, warn: 1, info: 2, debug: 3 };
const COLORS = { error: '\x1b[31m', warn: '\x1b[33m', info: '\x1b[36m', debug: '\x1b[90m', reset: '\x1b[0m' };

const log = (level, context, message, meta = {}) => {
  const ts = new Date().toISOString();

  if (IS_PROD) {
    process.stdout.write(
      JSON.stringify({ ts, level, context, message, ...meta }) + '\n'
    );
  } else {
    const color  = COLORS[level] ?? '';
    const prefix = `${COLORS.reset}[${ts.slice(11, 23)}] ${color}${level.toUpperCase().padEnd(5)}${COLORS.reset} [${context}]`;
    const metaStr = Object.keys(meta).length ? ` ${JSON.stringify(meta)}` : '';
    console.log(`${prefix} ${message}${metaStr}`);
  }
};

const logger = {
  error: (ctx, msg, meta) => log('error', ctx, msg, meta),
  warn:  (ctx, msg, meta) => log('warn',  ctx, msg, meta),
  info:  (ctx, msg, meta) => log('info',  ctx, msg, meta),
  debug: (ctx, msg, meta) => log('debug', ctx, msg, meta),
};

export default logger;

// ── Request ID + response-time middleware ─────────────────────────────────────

/**
 * Generates a short request id. Not a full UUID — 12 hex chars is plenty of
 * entropy for correlating log lines within a single process's uptime, and
 * keeps log lines shorter than a full crypto.randomUUID().
 */
export const generateRequestId = () => crypto.randomBytes(6).toString('hex');

/**
 * requestLogger
 * Express middleware — assigns req.id, logs one structured line per request
 * once the response has finished, including method, path, status, and
 * duration in ms. Mount this before any routes so req.id is available
 * everywhere downstream (error handler, route handlers, etc).
 *
 * Also feeds every completed request into metrics.recordRequest() so the
 * /health endpoint can report request counts without a separate middleware.
 */
export const requestLogger = (req, res, next) => {
  req.id = generateRequestId();
  const startedAt = process.hrtime.bigint();

  res.on('finish', () => {
    const durationMs = Number(process.hrtime.bigint() - startedAt) / 1e6;
    const meta = {
      requestId: req.id,
      method: req.method,
      path: req.originalUrl,
      status: res.statusCode,
      durationMs: Number(durationMs.toFixed(2)),
    };

    recordRequest(meta);

    const level = res.statusCode >= 500 ? 'error' : res.statusCode >= 400 ? 'warn' : 'info';
    log(level, 'http', `${req.method} ${req.originalUrl} ${res.statusCode}`, meta);
  });

  next();
};
