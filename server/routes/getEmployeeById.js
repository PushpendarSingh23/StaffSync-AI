import express from 'express';
import { Employees } from '../models/Employees.js';
import authenticate from '../middleware/authenticate.js';
import authorize from '../middleware/authorize.js';

const router = express.Router();

// GET /api/v1/employees/:id
// Admin: any employee  |  Employee: only their own linked record
router.get('/:id', authenticate, async (req, res, next) => {
  try {
    const employee = await Employees.findById(req.params.id);
    if (!employee) {
      return res.status(404).json({ success: false, message: 'Employee not found.' });
    }

    // Employees may only access their own record
    if (
      req.user.role === 'employee' &&
      String(req.user.employeeId) !== String(employee._id)
    ) {
      return res.status(403).json({ success: false, message: 'Access denied.' });
    }

    res.json({ success: true, data: employee });
  } catch (error) {
    next(error);
  }
});

export { router as getEmployeeById };
