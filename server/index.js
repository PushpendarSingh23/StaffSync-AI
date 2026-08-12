import dotenv from 'dotenv';
dotenv.config();

import express from 'express';
import cors from 'cors';
import connectDB from './db/index.js';
import errorHandler from './middleware/errorHandler.js';
import logger, { requestLogger } from './utils/logger.js';
import { config } from './config/serverConfig.js';
import { authLimiter, chatLimiter } from './middleware/rateLimiter.js';

import { authRouter }      from './routes/auth.js';
import { getEmployees }    from './routes/getEmployees.js';
import { createEmployee }  from './routes/createEmployee.js';
import { deleteEmployee }  from './routes/deleteEmployee.js';
import { getEmployeeById } from './routes/getEmployeeById.js';
import { searchEmployee }  from './routes/searchEmployee.js';
import { updateEmployee }  from './routes/updateEmployee.js';
import { documentsRouter } from './routes/documents.js';
import { chatRouter }      from './routes/chat.js';
import { adminRouter }     from './routes/admin.js';
import { healthRouter }    from './routes/health.js';

const app = express();

// ── CORS ──────────────────────────────────────────────────────────────────────
app.use(cors({
  origin: (origin, cb) => {
    if (!origin || config.allowedOrigins.includes(origin)) return cb(null, true);
    cb(new Error(`CORS: origin '${origin}' not allowed.`));
  },
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

app.use(express.json());

// ── Request logger ────────────────────────────────────────────────────────────
// Assigns req.id, logs one structured line per request (method/path/status/
// duration) on completion, and feeds utils/metrics.js for the /health route.
app.use(requestLogger);

// ── Health / observability ──────────────────────────────────────────────────
// Unauthenticated on purpose — load balancers and uptime checks need this to
// work without a token. Mounted before the versioned API routes below.
app.use('/health', healthRouter);

// ── Routes ────────────────────────────────────────────────────────────────────
// Auth — rate-limited
app.post('/api/v1/auth/login',    authLimiter);
app.post('/api/v1/auth/register', authLimiter);
app.use('/api/v1/auth', authRouter);

// Employees
app.use('/api/v1/employees', searchEmployee);
app.use('/api/v1/employees', getEmployees);
app.use('/api/v1/employees', getEmployeeById);
app.use('/api/v1/employees', createEmployee);
app.use('/api/v1/employees', updateEmployee);
app.use('/api/v1/employees', deleteEmployee);

// Documents
app.use('/api/v1/documents', documentsRouter);

// Chat — rate-limited on the question-asking POST route
app.post('/api/v1/chat', chatLimiter);
app.use('/api/v1/chat', chatRouter);

// Admin analytics
app.use('/api/v1/admin', adminRouter);

// ── 404 ───────────────────────────────────────────────────────────────────────
app.use((req, res) => {
  res.status(404).json({ success: false, message: 'Route not found.' });
});

// ── Error handler (must be last) ──────────────────────────────────────────────
app.use(errorHandler);

// ── Boot ──────────────────────────────────────────────────────────────────────
connectDB()
  .then(() => {
    app.listen(config.port, () =>
      logger.info('server', `Running on port ${config.port}`, { env: process.env.NODE_ENV || 'development' })
    );
  })
  .catch((err) => {
    logger.error('server', 'MongoDB connection failed', { error: err.message });
    process.exit(1);
  });
