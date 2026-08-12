import { body } from 'express-validator';

/**
 * Shared validation rules for creating or updating an employee.
 * All fields required on create; all optional (but validated if present) on update.
 */
export const createEmployeeRules = [
  body('firstname')
    .trim()
    .notEmpty().withMessage('First name is required.')
    .isLength({ max: 50 }).withMessage('First name must be 50 characters or fewer.'),

  body('lastname')
    .trim()
    .notEmpty().withMessage('Last name is required.')
    .isLength({ max: 50 }).withMessage('Last name must be 50 characters or fewer.'),

  body('email')
    .trim()
    .notEmpty().withMessage('Email is required.')
    .isEmail().withMessage('Must be a valid email address.')
    .normalizeEmail(),

  body('phone')
    .trim()
    .notEmpty().withMessage('Phone number is required.')
    .matches(/^[0-9+\-\s()]{7,20}$/).withMessage('Must be a valid phone number.'),

  body('job')
    .trim()
    .notEmpty().withMessage('Job title is required.')
    .isLength({ max: 100 }).withMessage('Job title must be 100 characters or fewer.'),

  body('dateOfJoining')
    .notEmpty().withMessage('Date of joining is required.')
    .isISO8601().withMessage('Date of joining must be a valid date (YYYY-MM-DD).'),

  body('image')
    .trim()
    .notEmpty().withMessage('Image URL is required.')
    .isURL().withMessage('Image must be a valid URL.'),
];

export const updateEmployeeRules = [
  body('firstname')
    .optional()
    .trim()
    .isLength({ min: 1, max: 50 }).withMessage('First name must be 1–50 characters.'),

  body('lastname')
    .optional()
    .trim()
    .isLength({ min: 1, max: 50 }).withMessage('Last name must be 1–50 characters.'),

  body('email')
    .optional()
    .trim()
    .isEmail().withMessage('Must be a valid email address.')
    .normalizeEmail(),

  body('phone')
    .optional()
    .trim()
    .matches(/^[0-9+\-\s()]{7,20}$/).withMessage('Must be a valid phone number.'),

  body('job')
    .optional()
    .trim()
    .isLength({ min: 1, max: 100 }).withMessage('Job title must be 1–100 characters.'),

  body('dateOfJoining')
    .optional()
    .isISO8601().withMessage('Date of joining must be a valid date (YYYY-MM-DD).'),

  body('image')
    .optional()
    .trim()
    .isURL().withMessage('Image must be a valid URL.'),
];
