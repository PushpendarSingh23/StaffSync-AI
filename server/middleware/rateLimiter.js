import rateLimit from 'express-rate-limit';

const json429 = (_req, res) =>
  res.status(429).json({ success: false, message: 'Too many requests. Please try again later.' });

/** Auth endpoints — 10 attempts per IP per 15 minutes */
export const authLimiter = rateLimit({
  windowMs:    15 * 60 * 1000,
  max:         10,
  standardHeaders: true,
  legacyHeaders:   false,
  handler: json429,
});

/** Chat endpoint — 30 questions per IP per minute (prevents Gemini quota abuse) */
export const chatLimiter = rateLimit({
  windowMs:    60 * 1000,
  max:         30,
  standardHeaders: true,
  legacyHeaders:   false,
  handler: json429,
});
