import { body } from 'express-validator';
import { DOCUMENT_CATEGORIES } from '../models/Document.js';

export const uploadDocumentRules = [
  body('title')
    .trim()
    .notEmpty().withMessage('Document title is required.')
    .isLength({ max: 200 }).withMessage('Title must be 200 characters or fewer.'),

  body('category')
    .trim()
    .notEmpty().withMessage('Category is required.')
    .isIn(DOCUMENT_CATEGORIES).withMessage(`Category must be one of: ${DOCUMENT_CATEGORIES.join(', ')}.`),

  body('description')
    .optional()
    .trim()
    .isLength({ max: 1000 }).withMessage('Description must be 1000 characters or fewer.'),
];

export const updateDocumentRules = [
  body('title')
    .optional()
    .trim()
    .isLength({ min: 1, max: 200 }).withMessage('Title must be 1–200 characters.'),

  body('category')
    .optional()
    .trim()
    .isIn(DOCUMENT_CATEGORIES).withMessage(`Category must be one of: ${DOCUMENT_CATEGORIES.join(', ')}.`),

  body('description')
    .optional()
    .trim()
    .isLength({ max: 1000 }).withMessage('Description must be 1000 characters or fewer.'),

  // Admins can archive a ready document but cannot set it back to processing/failed
  body('status')
    .optional()
    .isIn(['ready', 'archived']).withMessage('Status can only be set to ready or archived.'),
];
