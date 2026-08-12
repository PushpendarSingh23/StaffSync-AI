import { validationResult } from 'express-validator';

/**
 * Runs after express-validator checks.
 * Collects all validation errors and returns a 422 with a readable message array.
 */
const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(422).json({
      success: false,
      message: 'Validation failed.',
      errors: errors.array().map((e) => ({ field: e.path, message: e.msg })),
    });
  }
  next();
};

export default validate;
