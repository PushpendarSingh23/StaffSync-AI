import mongoose, { Schema } from 'mongoose';

export const DOCUMENT_CATEGORIES = [
  'Leave Policy',
  'Work From Home',
  'Insurance',
  'Code of Conduct',
  'Appraisal',
  'Travel Policy',
  'Benefits',
  'IT Security',
  'Payroll',
  'Other',
];

// All possible document lifecycle states
export const DOCUMENT_STATUSES = ['processing', 'ready', 'failed', 'archived'];

const DocumentSchema = new Schema(
  {
    title: {
      type: String,
      required: [true, 'Document title is required.'],
      trim: true,
      maxlength: [200, 'Title must be 200 characters or fewer.'],
    },
    category: {
      type: String,
      required: [true, 'Category is required.'],
      enum: {
        values: DOCUMENT_CATEGORIES,
        message: `Category must be one of: ${DOCUMENT_CATEGORIES.join(', ')}.`,
      },
    },
    description: {
      type: String,
      trim: true,
      maxlength: [1000, 'Description must be 1000 characters or fewer.'],
      default: '',
    },
    // UUID-based name stored on disk — prevents collisions and path traversal
    filename: {
      type: String,
      required: true,
      unique: true,
    },
    // Original browser filename shown to users
    originalFilename: {
      type: String,
      required: true,
      trim: true,
    },
    // S3 object key, e.g. hr-documents/<uuid>.pdf (field name kept as
    // filePath to avoid a migration — this used to be a local disk path)
    filePath: {
      type: String,
      required: true,
    },
    // Bytes
    fileSize: {
      type: Number,
      required: true,
      min: [1, 'File size must be at least 1 byte.'],
    },
    uploadedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    // processing → ready | failed; admin can flip to archived
    status: {
      type: String,
      enum: {
        values: DOCUMENT_STATUSES,
        message: `Status must be one of: ${DOCUMENT_STATUSES.join(', ')}.`,
      },
      default: 'processing',
    },
    // Set when status === 'failed'
    processingError: {
      type: String,
      default: null,
    },
    // Total chunks produced during indexing — shown in the UI
    chunkCount: {
      type: Number,
      default: 0,
    },
  },
  { timestamps: true }
);

// Text index for full-text search on title, category and description
DocumentSchema.index({ title: 'text', description: 'text', category: 'text' });

export const Document = mongoose.model('Document', DocumentSchema);
