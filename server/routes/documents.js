import express from 'express';
import { Document } from '../models/Document.js';
import authenticate from '../middleware/authenticate.js';
import authorize from '../middleware/authorize.js';
import upload from '../middleware/upload.js';
import { uploadDocumentRules, updateDocumentRules } from '../middleware/documentValidators.js';
import validate from '../middleware/validate.js';
import { indexDocument } from '../services/documentProcessor.js';
import { deleteChunks, countChunks } from '../services/vectorService.js';
import { invalidate as invalidateCache } from '../services/answerCache.js';
import { getObjectStream, deleteObject } from '../services/s3Storage.js';
import { config } from '../config/serverConfig.js';
import logger from '../utils/logger.js';
import escapeRegex from '../utils/escapeRegex.js';

const CTX = 'documents';

const router = express.Router();

// doc.filePath now holds the S3 object key (e.g. "hr-documents/<uuid>.pdf"),
// not a local disk path — kept the same field name to avoid a data migration.
const removeFromS3 = (key) =>
  deleteObject(key, { onError: (err) => logger.warn(CTX, `Could not delete S3 object: ${key}`, { error: err.message }) });

// ── GET /api/v1/documents?page=1&limit=20&q=&category=&status= ────────────────
router.get('/', authenticate, async (req, res, next) => {
  try {
    const isAdmin = req.user.role === 'admin';
    const page    = Math.max(1, parseInt(req.query.page,  10) || config.defaultPage);
    const limit   = Math.min(config.maxPageSize,
                             Math.max(1, parseInt(req.query.limit, 10) || config.defaultPageSize));
    const skip    = (page - 1) * limit;
    const q       = (req.query.q || '').trim();
    const cat     = req.query.category || '';
    const status  = req.query.status   || '';

    // Build filter
    const filter = isAdmin ? {} : { status: 'ready' };
    if (cat)    filter.category = cat;
    if (status && isAdmin) filter.status = status;
    if (q) {
      const rx = new RegExp(escapeRegex(q), 'i');
      filter.$or = [{ title: rx }, { description: rx }, { originalFilename: rx }];
    }

    const projection = isAdmin ? {} : { filePath: 0, filename: 0 };

    const [docs, total] = await Promise.all([
      Document.find(filter, projection)
        .populate('uploadedBy', 'fullName email')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      Document.countDocuments(filter),
    ]);

    const data = await Promise.all(
      docs.map(async (doc) => {
        const obj = doc.toObject();
        // Use the stored chunkCount — avoids N+1 countDocuments queries.
        // countChunks is only called as a fallback for legacy docs that have chunkCount = 0
        // AND status = 'ready' (meaning they were indexed before chunkCount was tracked).
        if (isAdmin && doc.status === 'ready' && !doc.chunkCount) {
          obj.chunkCount = await countChunks(doc._id);
        }
        return obj;
      })
    );

    res.json({
      success: true,
      data,
      pagination: { total, page, limit, pages: Math.ceil(total / limit) },
    });
  } catch (err) {
    next(err);
  }
});

// ── GET /api/v1/documents/:id ─────────────────────────────────────────────────
router.get('/:id', authenticate, async (req, res, next) => {
  try {
    const isAdmin    = req.user.role === 'admin';
    const projection = isAdmin ? {} : { filePath: 0, filename: 0 };
    const doc        = await Document.findById(req.params.id, projection)
      .populate('uploadedBy', 'fullName email');

    if (!doc) return res.status(404).json({ success: false, message: 'Document not found.' });
    if (!isAdmin && doc.status !== 'ready')
      return res.status(404).json({ success: false, message: 'Document not found.' });

    const obj = doc.toObject();
    if (isAdmin && doc.status === 'ready' && !doc.chunkCount) {
      obj.chunkCount = await countChunks(doc._id);
    }
    res.json({ success: true, data: obj });
  } catch (err) {
    next(err);
  }
});

// ── POST /api/v1/documents/upload — admin only ────────────────────────────────
router.post(
  '/upload',
  authenticate,
  authorize('admin'),
  (req, res, next) => { upload.single('file')(req, res, (err) => { if (err) return next(err); next(); }); },
  uploadDocumentRules,
  validate,
  async (req, res, next) => {
    if (!req.file) return res.status(400).json({ success: false, message: 'PDF file is required.' });

    // multer-s3 populates .key (S3 object key) and .location (public URL)
    // in place of the disk storage engine's .filename / .path.
    const s3Key = req.file.key;

    try {
      const doc = await Document.create({
        title:            req.body.title,
        category:         req.body.category,
        description:      req.body.description || '',
        filename:         s3Key.split('/').pop(),
        originalFilename: req.file.originalname,
        filePath:         s3Key,
        fileSize:         req.file.size,
        uploadedBy:       req.user._id,
        status:           'processing',
      });
      await doc.populate('uploadedBy', 'fullName email');
      logger.info(CTX, 'Document saved', { id: doc._id, title: doc.title });

      res.status(201).json({
        success: true,
        message: 'Document uploaded. Indexing started.',
        data: doc.toObject(),
      });

      indexDocument(doc).catch((err) =>
        logger.error(CTX, 'Background indexing error', { id: doc._id, error: err.message })
      );
    } catch (err) {
      await removeFromS3(s3Key);
      next(err);
    }
  }
);

// ── PUT /api/v1/documents/:id — admin only ────────────────────────────────────
router.put('/:id', authenticate, authorize('admin'), updateDocumentRules, validate, async (req, res, next) => {
  try {
    const { title, category, description, status } = req.body;
    const doc = await Document.findByIdAndUpdate(
      req.params.id,
      { title, category, description, status },
      { new: true, runValidators: true }
    ).populate('uploadedBy', 'fullName email');

    if (!doc) return res.status(404).json({ success: false, message: 'Document not found.' });

    const obj = doc.toObject();
    obj.chunkCount = doc.chunkCount ?? (await countChunks(doc._id));
    res.json({ success: true, message: 'Document updated.', data: obj });
  } catch (err) {
    next(err);
  }
});

// ── DELETE /api/v1/documents/:id — admin only ─────────────────────────────────
router.delete('/:id', authenticate, authorize('admin'), async (req, res, next) => {
  try {
    const doc = await Document.findByIdAndDelete(req.params.id);
    if (!doc) return res.status(404).json({ success: false, message: 'Document not found.' });

    await removeFromS3(doc.filePath);
    const deleted = await deleteChunks(doc._id);
    logger.info(CTX, 'Document deleted', { id: doc._id, chunks: deleted });

    // Knowledge base changed — invalidate AI answer cache
    await invalidateCache();

    res.json({ success: true, message: 'Document and all associated chunks deleted.' });
  } catch (err) {
    next(err);
  }
});

// ── GET /api/v1/documents/:id/download ───────────────────────────────────────
router.get('/:id/download', authenticate, async (req, res, next) => {
  try {
    const doc = await Document.findById(req.params.id);
    if (!doc) return res.status(404).json({ success: false, message: 'Document not found.' });

    const isAdmin = req.user.role === 'admin';
    if (!isAdmin && doc.status !== 'ready')
      return res.status(404).json({ success: false, message: 'Document not found.' });

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${encodeURIComponent(doc.originalFilename)}"`);

    try {
      const stream = await getObjectStream(doc.filePath);
      stream.pipe(res);
    } catch (err) {
      logger.warn(CTX, 'S3 object missing for download', { id: doc._id, key: doc.filePath });
      return res.status(404).json({ success: false, message: 'File not found in storage.' });
    }
  } catch (err) {
    next(err);
  }
});

// ── POST /api/v1/documents/:id/reindex — admin only ──────────────────────────
router.post('/:id/reindex', authenticate, authorize('admin'), async (req, res, next) => {
  try {
    const doc = await Document.findById(req.params.id);
    if (!doc) return res.status(404).json({ success: false, message: 'Document not found.' });
    if (doc.status === 'processing')
      return res.status(409).json({ success: false, message: 'Document is already being processed.' });

    await Document.findByIdAndUpdate(doc._id, { status: 'processing', processingError: null });
    logger.info(CTX, 'Re-indexing triggered', { id: doc._id, title: doc.title });

    res.json({ success: true, message: 'Re-indexing started.' });

    indexDocument({ ...doc.toObject(), _id: doc._id }).catch((err) =>
      logger.error(CTX, 'Re-index error', { id: doc._id, error: err.message })
    );
  } catch (err) {
    next(err);
  }
});

export { router as documentsRouter };
