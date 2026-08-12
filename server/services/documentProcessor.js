/**
 * documentProcessor.js
 * Full RAG indexing pipeline: read PDF → parse → chunk → embed → store → mark ready.
 * Uses centralised config and structured logger.
 * Invalidates the answer cache after indexing so stale answers are not served.
 */

import pdfParse from 'pdf-parse/lib/pdf-parse.js';
import { RecursiveCharacterTextSplitter } from '@langchain/textsplitters';
import { GoogleGenerativeAIEmbeddings } from '@langchain/google-genai';
import { Document } from '../models/Document.js';
import { insertChunks, deleteChunks } from './vectorService.js';
import { invalidate as invalidateCache } from './answerCache.js';
import { getObjectBuffer } from './s3Storage.js';
import { config } from '../config/serverConfig.js';
import logger from '../utils/logger.js';
import { isTextInsufficient, ocrPdfBuffer } from '../utils/ocrService.js';

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

export const indexDocument = async (doc) => {
  const CTX = `indexer:${doc._id}`;
  logger.info(CTX, `Pipeline started — "${doc.title}"`);

  try {
    // ── 1. Read file ──────────────────────────────────────────────────────
    let fileBuffer;
    try {
      fileBuffer = await getObjectBuffer(doc.filePath);
    } catch (err) {
      throw new Error(`PDF file not found in S3 (key: ${doc.filePath}): ${err.message}`);
    }
    logger.info(CTX, 'PDF read from S3', { kb: (fileBuffer.length / 1024).toFixed(1) });

    // ── 2. Parse text ─────────────────────────────────────────────────────
    const parsed    = await pdfParse(fileBuffer);
    const pageCount = parsed.numpages || 1;
    let rawText      = parsed.text || '';
    let extractedVia = 'node';

    // Scanned/image-based PDFs have no embedded text layer, so pdf-parse
    // comes back empty (or near-empty). Fall back to Python OCR for just
    // that case — normal PDFs never touch this path.
    if (isTextInsufficient(rawText)) {
      logger.info(CTX, 'Node text extraction insufficient — running OCR fallback', {
        chars: rawText.trim().length,
      });
      rawText = await ocrPdfBuffer(fileBuffer);
      extractedVia = 'ocr';
    }

    if (!rawText.trim()) {
      throw new Error('PDF contains no extractable text, even after OCR.');
    }
    logger.info(CTX, 'PDF text extracted', { pages: pageCount, chars: rawText.length, via: extractedVia });

    // ── 3. Split ──────────────────────────────────────────────────────────
    const splitter = new RecursiveCharacterTextSplitter({
      chunkSize:    config.chunkSize,
      chunkOverlap: config.chunkOverlap,
    });
    const textChunks = await splitter.splitText(rawText);

    if (!textChunks.length) throw new Error('Text splitter produced zero chunks.');
    logger.info(CTX, 'Text split', { chunks: textChunks.length });

    // ── 4. Embed ──────────────────────────────────────────────────────────
    const embedder = new GoogleGenerativeAIEmbeddings({
      apiKey: process.env.GEMINI_API_KEY,
      model:  config.embeddingModel,
    });

    const embeddings = [];
    for (let i = 0; i < textChunks.length; i += config.embedBatchSize) {
      const batch     = textChunks.slice(i, i + config.embedBatchSize);
      const batchVecs = await embedder.embedDocuments(batch);
      embeddings.push(...batchVecs);
      logger.debug(CTX, 'Embeddings batch', {
        progress: `${Math.min(i + config.embedBatchSize, textChunks.length)}/${textChunks.length}`,
      });
      if (i + config.embedBatchSize < textChunks.length) await sleep(200);
    }
    logger.info(CTX, 'All embeddings generated', { count: embeddings.length });

    // ── 5. Build chunk documents ──────────────────────────────────────────
    const uploadDate = doc.createdAt ?? new Date();
    const chunkDocs  = textChunks.map((text, idx) => ({
      documentId: doc._id,
      text,
      embedding:  embeddings[idx],
      metadata: {
        title:      doc.title,
        category:   doc.category,
        pageNumber: 0,
        chunkIndex: idx,
        uploadedBy: doc.uploadedBy,
        uploadDate,
      },
    }));

    // ── 6. Delete stale ───────────────────────────────────────────────────
    const deleted = await deleteChunks(doc._id);
    if (deleted > 0) logger.info(CTX, 'Stale chunks removed', { deleted });

    // ── 7. Insert ─────────────────────────────────────────────────────────
    const inserted = await insertChunks(chunkDocs);
    logger.info(CTX, 'Chunks stored', { inserted });

    // ── 8. Mark ready + invalidate cache ─────────────────────────────────
    await Document.findByIdAndUpdate(doc._id, {
      status:          'ready',
      processingError: null,
      chunkCount:      inserted,
    });

    // Knowledge base changed — clear cached answers
    await invalidateCache();

    logger.info(CTX, 'Pipeline completed', { status: 'ready', chunks: inserted });

  } catch (err) {
    logger.error(`indexer:${doc._id}`, 'Pipeline FAILED', { error: err.message });

    await Document.findByIdAndUpdate(doc._id, {
      status:          'failed',
      processingError: err.message,
    }).catch((e) => logger.error(`indexer:${doc._id}`, 'Could not update failure status', { error: e.message }));
  }
};
