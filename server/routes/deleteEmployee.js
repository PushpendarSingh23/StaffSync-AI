import express from 'express';
import { Employees } from '../models/Employees.js';
import authenticate from '../middleware/authenticate.js';
import authorize from '../middleware/authorize.js';

const router = express.Router();

// DELETE /api/v1/employees/:id  — admin only
router.delete('/:id', authenticate, authorize('admin'), async (req, res, next) => {
  try {
    const employee = await Employees.findByIdAndDelete(req.params.id);
    if (!employee) {
      return res.status(404).json({ success: false, message: 'Employee not found.' });
    }
    res.json({ success: true, message: 'Employee deleted successfully.' });
  } catch (error) {
    next(error);
  }
});

export { router as deleteEmployee };
