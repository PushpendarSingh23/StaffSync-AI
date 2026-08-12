import multer from 'multer';
import logger from '../utils/logger.js';

const errorHandler = (err, req, res, next) => {
  const ctx = `${req.method} ${req.originalUrl}`;
  const requestId = req.id;

  if (err instanceof multer.MulterError) {
    const msg = err.code === 'LIMIT_FILE_SIZE'
      ? 'File is too large. Maximum allowed size is 20 MB.' : err.message;
    logger.warn('errorHandler', msg, { ctx, requestId });
    return res.status(400).json({ success: false, message: msg, requestId });
  }

  if (err.message === 'Only PDF files are accepted.') {
    return res.status(400).json({ success: false, message: err.message });
  }

  if (err.name === 'ValidationError') {
    const messages = Object.values(err.errors).map((e) => e.message);
    logger.warn('errorHandler', 'Validation error', { ctx, messages, requestId });
    return res.status(400).json({ success: false, message: messages.join(', '), requestId });
  }

  if (err.name === 'CastError' && err.kind === 'ObjectId') {
    return res.status(400).json({ success: false, message: 'Invalid ID format.' });
  }

  if (err.code === 11000) {
    const field = Object.keys(err.keyValue || {})[0] || 'field';
    return res.status(409).json({ success: false, message: `${field} already exists.` });
  }

  const status = err.status || err.statusCode || 500;
  logger.error('errorHandler', err.message, { ctx, status, requestId, stack: err.stack?.split('\n')[1]?.trim() });

  res.status(status).json({
    success: false,
    message: status === 500 ? 'An unexpected error occurred. Please try again.' : err.message,
    requestId,
  });
};

export default errorHandler;
