import express from 'express';
import { body } from 'express-validator';
import authenticate from '../middleware/authenticate.js';
import validate from '../middleware/validate.js';
import { answerQuestion } from '../services/chatService.js';
import { Conversation } from '../models/Conversation.js';
import { Feedback } from '../models/Feedback.js';
import { config } from '../config/serverConfig.js';
import logger from '../utils/logger.js';
import escapeRegex from '../utils/escapeRegex.js';

const router = express.Router();
const CTX = 'chat';

const chatRules = [
  body('question').trim()
    .notEmpty().withMessage('Question is required.')
    .isLength({ min: 3, max: 1000 }).withMessage('Question must be 3–1000 characters.'),
  body('sessionId').optional().trim()
    .isLength({ max: 100 }).withMessage('Invalid sessionId.'),
];

const feedbackRules = [
  body('conversationId').notEmpty().isMongoId().withMessage('Invalid conversationId.'),
  body('rating').notEmpty().isIn(['helpful', 'not_helpful']).withMessage('Rating must be helpful or not_helpful.'),
  body('comment').optional().trim().isLength({ max: 500 }).withMessage('Comment must be 500 characters or fewer.'),
];

// ── POST /api/v1/chat ─────────────────────────────────────────────────────────
router.post('/', authenticate, chatRules, validate, async (req, res, next) => {
  try {
    const { question, sessionId } = req.body;
    logger.info(CTX, 'Question received', { userId: req.user._id, q: question.slice(0, 80) });

    const result = await answerQuestion(question, { sessionId });

    const conv = await Conversation.create({
      userId:           req.user._id,
      sessionId,
      question,
      answer:           result.answer,
      retrievedSources: result.sources,
      confidence:       result.confidence,
    }).catch((err) => {
      logger.error(CTX, 'Failed to persist conversation', { error: err.message });
      return null;
    });

    logger.info(CTX, 'Answered', { confidence: result.confidence, sources: result.sources.length, convId: conv?._id });

    res.json({ success: true, data: { ...result, conversationId: conv?._id ?? null } });
  } catch (err) {
    logger.error(CTX, 'Chat error', { error: err.message });
    next(err);
  }
});

// ── GET /api/v1/chat/history?page=1&limit=20&q= ───────────────────────────────
router.get('/history', authenticate, async (req, res, next) => {
  try {
    const isAdmin = req.user.role === 'admin';
    const page    = Math.max(1, parseInt(req.query.page,  10) || config.defaultPage);
    const limit   = Math.min(config.maxPageSize,
                             Math.max(1, parseInt(req.query.limit, 10) || config.defaultPageSize));
    const skip    = (page - 1) * limit;
    const q       = (req.query.q || '').trim();

    const filter = isAdmin ? {} : { userId: req.user._id };
    if (q) {
      const rx = new RegExp(escapeRegex(q), 'i');
      filter.$or = [{ question: rx }, { answer: rx }];
    }

    const [conversations, total] = await Promise.all([
      Conversation.find(filter)
        .populate('userId', 'fullName email role')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      Conversation.countDocuments(filter),
    ]);

    res.json({
      success: true,
      data: conversations,
      pagination: { total, page, limit, pages: Math.ceil(total / limit) },
    });
  } catch (err) {
    next(err);
  }
});

// ── GET /api/v1/chat/history/:id ──────────────────────────────────────────────
router.get('/history/:id', authenticate, async (req, res, next) => {
  try {
    const conv = await Conversation.findById(req.params.id).populate('userId', 'fullName email role');
    if (!conv) return res.status(404).json({ success: false, message: 'Conversation not found.' });

    const isOwner = String(conv.userId._id ?? conv.userId) === String(req.user._id);
    if (req.user.role !== 'admin' && !isOwner)
      return res.status(403).json({ success: false, message: 'Access denied.' });

    const feedback = await Feedback.findOne({ conversationId: conv._id, userId: req.user._id });
    res.json({ success: true, data: { ...conv.toObject(), feedback: feedback ?? null } });
  } catch (err) {
    next(err);
  }
});

// ── DELETE /api/v1/chat/history/:id ──────────────────────────────────────────
router.delete('/history/:id', authenticate, async (req, res, next) => {
  try {
    const conv = await Conversation.findById(req.params.id);
    if (!conv) return res.status(404).json({ success: false, message: 'Conversation not found.' });

    const isOwner = String(conv.userId) === String(req.user._id);
    if (req.user.role !== 'admin' && !isOwner)
      return res.status(403).json({ success: false, message: 'Access denied.' });

    await Conversation.findByIdAndDelete(req.params.id);
    await Feedback.deleteMany({ conversationId: req.params.id });
    res.json({ success: true, message: 'Conversation deleted.' });
  } catch (err) {
    next(err);
  }
});

// ── POST /api/v1/chat/feedback ────────────────────────────────────────────────
router.post('/feedback', authenticate, feedbackRules, validate, async (req, res, next) => {
  try {
    const { conversationId, rating, comment } = req.body;
    const conv = await Conversation.findById(conversationId);
    if (!conv) return res.status(404).json({ success: false, message: 'Conversation not found.' });

    const isOwner = String(conv.userId) === String(req.user._id);
    if (req.user.role !== 'admin' && !isOwner)
      return res.status(403).json({ success: false, message: 'Access denied.' });

    const feedback = await Feedback.findOneAndUpdate(
      { conversationId, userId: req.user._id },
      { rating, comment: comment || '' },
      { upsert: true, new: true, runValidators: true }
    );

    logger.info(CTX, 'Feedback saved', { conversationId, rating, userId: req.user._id });
    res.json({ success: true, message: 'Feedback saved.', data: feedback });
  } catch (err) {
    next(err);
  }
});

export { router as chatRouter };
