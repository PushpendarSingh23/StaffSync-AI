import express from 'express';
import { Employees } from '../models/Employees.js';
import { updateEmployeeRules } from '../middleware/employeeValidators.js';
import validate from '../middleware/validate.js';
import authenticate from '../middleware/authenticate.js';
import authorize from '../middleware/authorize.js';

const router = express.Router();

// PUT /api/v1/employees/:id  — admin only
router.put('/:id', authenticate, authorize('admin'), updateEmployeeRules, validate, async (req, res, next) => {
  try {
    const employee = await Employees.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );
    if (!employee) {
      return res.status(404).json({ success: false, message: 'Employee not found.' });
    }
    res.json({ success: true, data: employee });
  } catch (error) {
    next(error);
  }
});

export { router as updateEmployee };
