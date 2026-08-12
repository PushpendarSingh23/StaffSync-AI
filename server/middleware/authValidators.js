import { body } from 'express-validator';

export const registerRules = [
  body('fullName')
    .trim()
    .notEmpty().withMessage('Full name is required.')
    .isLength({ max: 100 }).withMessage('Full name must be 100 characters or fewer.'),

  body('email')
    .trim()
    .notEmpty().withMessage('Email is required.')
    .isEmail().withMessage('Must be a valid email address.')
    .normalizeEmail(),

  body('password')
    .notEmpty().withMessage('Password is required.')
    .isLength({ min: 8 }).withMessage('Password must be at least 8 characters.')
    .matches(/[A-Z]/).withMessage('Password must contain at least one uppercase letter.')
    .matches(/[0-9]/).withMessage('Password must contain at least one number.'),

  body('role')
    .optional()
    .isIn(['admin', 'employee']).withMessage('Role must be admin or employee.'),
];

export const loginRules = [
  body('email')
    .trim()
    .notEmpty().withMessage('Email is required.')
    .isEmail().withMessage('Must be a valid email address.')
    .normalizeEmail(),

  body('password')
    .notEmpty().withMessage('Password is required.'),
];
