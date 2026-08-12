import express from 'express';
import { Employees } from '../models/Employees.js';
import authenticate from '../middleware/authenticate.js';
import authorize from '../middleware/authorize.js';
import { config } from '../config/serverConfig.js';

const router = express.Router();

// GET /api/v1/employees?page=1&limit=20  — admin only
router.get('/', authenticate, authorize('admin'), async (req, res, next) => {
  try {
    const page  = Math.max(1, parseInt(req.query.page, 10)  || config.defaultPage);
    const limit = Math.min(config.maxPageSize,
                           Math.max(1, parseInt(req.query.limit, 10) || config.defaultPageSize));
    const skip  = (page - 1) * limit;

    const [employees, total] = await Promise.all([
      Employees.find().sort({ createdAt: -1 }).skip(skip).limit(limit),
      Employees.countDocuments(),
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

export { router as getEmployees };
