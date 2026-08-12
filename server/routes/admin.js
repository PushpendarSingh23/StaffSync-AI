import express from 'express';
import authenticate from '../middleware/authenticate.js';
import authorize from '../middleware/authorize.js';
import { Conversation } from '../models/Conversation.js';
import { Feedback } from '../models/Feedback.js';
import { Document } from '../models/Document.js';
import { DocumentChunk } from '../models/DocumentChunk.js';
import { Employees } from '../models/Employees.js';
import { User } from '../models/User.js';
import { size as cacheSize } from '../services/answerCache.js';

const router = express.Router();

// ── GET /api/v1/admin/analytics ───────────────────────────────────────────────
router.get('/analytics', authenticate, authorize('admin'), async (req, res, next) => {
  try {
    const now = new Date();
    const thirtyDaysAgo = new Date(now);
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const [
      totalConversations, totalUsers, totalDocuments, totalChunks,
      confidenceDist, feedbackCounts, topCategories, topDocuments,
      dailyUsage, recentUploads, recentConversations, recentFeedback,
    ] = await Promise.all([
      Conversation.countDocuments(),
      User.countDocuments(),
      Document.countDocuments({ status: 'ready' }),
      DocumentChunk.countDocuments(),

      Conversation.aggregate([{ $group: { _id: '$confidence', count: { $sum: 1 } } }]),
      Feedback.aggregate([{ $group: { _id: '$rating', count: { $sum: 1 } } }]),

      Conversation.aggregate([
        { $unwind: '$retrievedSources' },
        { $group: { _id: '$retrievedSources.category', count: { $sum: 1 } } },
        { $sort: { count: -1 } }, { $limit: 10 },
        { $project: { category: '$_id', count: 1, _id: 0 } },
      ]),

      Conversation.aggregate([
        { $unwind: '$retrievedSources' },
        { $group: { _id: '$retrievedSources.document', count: { $sum: 1 } } },
        { $sort: { count: -1 } }, { $limit: 10 },
        { $project: { document: '$_id', count: 1, _id: 0 } },
      ]),

      Conversation.aggregate([
        { $match: { createdAt: { $gte: thirtyDaysAgo } } },
        { $group: { _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } }, count: { $sum: 1 } } },
        { $sort: { _id: 1 } },
        { $project: { date: '$_id', count: 1, _id: 0 } },
      ]),

      // Recent activity feeds
      Document.find({}).populate('uploadedBy', 'fullName').sort({ createdAt: -1 }).limit(5)
        .select('title category status createdAt uploadedBy'),
      Conversation.find({}).populate('userId', 'fullName').sort({ createdAt: -1 }).limit(5)
        .select('question confidence createdAt userId'),
      Feedback.find({}).populate('userId', 'fullName').sort({ createdAt: -1 }).limit(5)
        .select('rating comment createdAt userId conversationId'),
    ]);

    // Confidence weighted average
    const WEIGHT = { high: 1.0, medium: 0.7, low: 0.4 };
    const totalW = confidenceDist.reduce((s, d) => s + (WEIGHT[d._id] ?? 0.4) * d.count, 0);
    const totalC = confidenceDist.reduce((s, d) => s + d.count, 0);
    const avgConfidenceScore = totalC > 0 ? Number((totalW / totalC).toFixed(2)) : 0;

    const helpfulCount    = feedbackCounts.find((f) => f._id === 'helpful')?.count    ?? 0;
    const notHelpfulCount = feedbackCounts.find((f) => f._id === 'not_helpful')?.count ?? 0;
    const totalFeedback   = helpfulCount + notHelpfulCount;
    const helpfulPct    = totalFeedback > 0 ? Math.round((helpfulCount    / totalFeedback) * 100) : 0;
    const notHelpfulPct = totalFeedback > 0 ? Math.round((notHelpfulCount / totalFeedback) * 100) : 0;

    // Fill daily usage gaps
    const dailyMap = new Map(dailyUsage.map((d) => [d.date, d.count]));
    const filledDailyUsage = [];
    for (let i = 29; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(d.getDate() - i);
      const key = d.toISOString().split('T')[0];
      filledDailyUsage.push({ date: key, count: dailyMap.get(key) ?? 0 });
    }

    res.json({
      success: true,
      data: {
        summary: {
          totalConversations, totalUsers, totalDocuments, totalChunks,
          avgConfidenceScore, totalFeedback, helpfulPct, notHelpfulPct,
          cacheSize: cacheSize(),
        },
        confidenceDistribution: confidenceDist.map((d) => ({ confidence: d._id, count: d.count })),
        topCategories,
        topDocuments,
        dailyUsage: filledDailyUsage,
        feedbackBreakdown: [
          { label: 'Helpful',     value: helpfulCount,    pct: helpfulPct },
          { label: 'Not Helpful', value: notHelpfulCount, pct: notHelpfulPct },
        ],
        recentActivity: { recentUploads, recentConversations, recentFeedback },
      },
    });
  } catch (err) {
    next(err);
  }
});

export { router as adminRouter };
