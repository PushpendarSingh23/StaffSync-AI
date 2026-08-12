import express from 'express';
import { Employees } from '../models/Employees.js';
import authenticate from '../middleware/authenticate.js';
import authorize from '../middleware/authorize.js';
import { config } from '../config/serverConfig.js';
import escapeRegex from '../utils/escapeRegex.js';

const router = express.Router();

// GET /api/v1/employees/search?q=<term>&page=1&limit=20  — admin only
router.get('/search', authenticate, authorize('admin'), async (req, res, next) => {
  try {
    const term  = (req.query.q || '').trim();
    const page  = Math.max(1, parseInt(req.query.page, 10)  || config.defaultPage);
    const limit = Math.min(config.maxPageSize,
                           Math.max(1, parseInt(req.query.limit, 10) || config.defaultPageSize));
    const skip  = (page - 1) * limit;

    const filter = term
      ? { $or: [{ firstname: new RegExp(escapeRegex(term), 'i') }, { lastname: new RegExp(escapeRegex(term), 'i') },
                { email: new RegExp(escapeRegex(term), 'i') },     { job: new RegExp(escapeRegex(term), 'i') }] }
      : {};

    const [employees, total] = await Promise.all([
      Employees.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit),
      Employees.countDocuments(filter),
    ]);

    res.json({
      success: true,
      data:   employees,
      pagination: { total, page, limit, pages: Math.ceil(total / limit) },
    });
  } catch (error) {
    next(error);
  }
});

export { router as searchEmployee };
