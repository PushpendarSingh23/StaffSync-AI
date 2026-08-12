/**
 * serverConfig.js
 * Single place for all magic numbers and constants — no more scattered literals.
 */

export const config = {
  // Server
  port: Number(process.env.PORT) || 8000,

  // JWT
  jwtSecret:    process.env.JWT_SECRET || 'dev_secret_change_in_prod',
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '7d',

  // CORS
  allowedOrigins: (process.env.ALLOWED_ORIGINS || 'http://localhost:5173')
    .split(',').map((o) => o.trim()),

  // Database
  dbName: 'EMS',

  // Upload — HR documents now live in S3 (see config/s3.js), not on local
  // disk. Bucket/prefix are env-driven; only the size cap stays here.
  maxFileSizeMb: 20,

  // Pagination defaults
  defaultPage:     1,
  defaultPageSize: 20,
  maxPageSize:     100,

  // RAG
  embeddingModel:  'models/embedding-001',
  chatModel:       process.env.GEMINI_CHAT_MODEL || 'gemini-1.5-flash',
  chunkSize:       800,
  chunkOverlap:    150,
  topK:            5,
  embedBatchSize:  50,
  vectorIndex:     process.env.MONGODB_VECTOR_INDEX || 'document_vector_index',

  // OCR fallback — if pdf-parse (Node) extracts fewer than this many
  // characters, the PDF is treated as scanned/image-based and handed to
  // the Python OCR script instead (see utils/ocrService.js).
  ocrMinTextLength: Number(process.env.OCR_MIN_TEXT_LENGTH) || 20,
  pythonBin:        process.env.PYTHON_BIN || 'python3',

  // Rerank — cross-encoder stage between vector search and generation.
  // similaritySearch() now pulls a wider candidate pool (retrievalPoolSize)
  // instead of just `topK`; rerankService scores every candidate against
  // the question and only the best `topK` survive to the Gemini prompt.
  retrievalPoolSize: Number(process.env.RERANK_POOL_SIZE) || 20,
  rerankModel:        process.env.RERANK_MODEL || 'Xenova/ms-marco-MiniLM-L-6-v2',
  rerankEnabled:      process.env.RERANK_ENABLED !== 'false',

  // AI cache
  cacheTtlMs: 10 * 60 * 1000, // 10 minutes

  // Confidence thresholds
  highConfidence:   0.85,
  mediumConfidence: 0.70,

  // Conversation memory — number of prior turns threaded into each chat call
  memoryTurns: 6,
};
