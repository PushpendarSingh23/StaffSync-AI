import express from 'express';
import { Employees } from '../models/Employees.js';
import { createEmployeeRules } from '../middleware/employeeValidators.js';
import validate from '../middleware/validate.js';
import authenticate from '../middleware/authenticate.js';
import authorize from '../middleware/authorize.js';

const router = express.Router();

// POST /api/v1/employees  — admin only
router.post('/', authenticate, authorize('admin'), createEmployeeRules, validate, async (req, res, next) => {
  try {
    const employee = new Employees(req.body);
    await employee.save();
    res.status(201).json({ success: true, data: employee });
  } catch (error) {
    next(error);
  }
});

export { router as createEmployee };
