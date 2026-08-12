/**
 * vectorService.js
 *
 * Low-level layer for all DocumentChunk interactions:
 *  - insertChunks  — bulk-insert an array of prepared chunk documents
 *  - deleteChunks  — remove all chunks for a given documentId
 *  - similaritySearch — Atlas Vector Search query (ready for Phase 5 chat)
 */

import mongoose from 'mongoose';
import { DocumentChunk } from '../models/DocumentChunk.js';

// ── Insert ─────────────────────────────────────────────────────────────────────

/**
 * Bulk-insert chunks into MongoDB.
 * Uses insertMany with ordered:false so partial failures don't abort the batch.
 *
 * @param {Array<Object>} chunks  — fully-formed DocumentChunk documents
 * @returns {Promise<number>}      number of inserted documents
 */
export const insertChunks = async (chunks) => {
  if (!chunks.length) return 0;
  const result = await DocumentChunk.insertMany(chunks, { ordered: false });
  return result.length;
};

// ── Delete ─────────────────────────────────────────────────────────────────────

/**
 * Delete every chunk belonging to a document.
 *
 * @param {string|ObjectId} documentId
 * @returns {Promise<number>} number of deleted documents
 */
export const deleteChunks = async (documentId) => {
  const result = await DocumentChunk.deleteMany({ documentId });
  return result.deletedCount;
};

// ── Similarity Search ──────────────────────────────────────────────────────────

/**
 * Run an Atlas Vector Search query against the DocumentChunk collection.
 * Returns the top-k most similar chunks to the provided query embedding.
 *
 * IMPORTANT: This requires an Atlas Vector Search index named by
 * process.env.MONGODB_VECTOR_INDEX on the `embedding` field.
 * See the README / Phase 4 docs for the index configuration JSON.
 *
 * @param {number[]} queryEmbedding   — embedding vector for the user's query
 * @param {object}  [options]
 * @param {number}  [options.k=5]          — number of results to return
 * @param {string}  [options.category]     — optional category filter
 * @param {number}  [options.numCandidates=150] — Atlas search candidate pool size
 * @returns {Promise<Array>}
 */
export const similaritySearch = async (queryEmbedding, options = {}) => {
  const {
    k = 5,
    category,
    numCandidates = 150,
  } = options;

  const indexName = process.env.MONGODB_VECTOR_INDEX || 'document_vector_index';

  // Build the $vectorSearch stage
  const vectorStage = {
    $vectorSearch: {
      index: indexName,
      path: 'embedding',
      queryVector: queryEmbedding,
      numCandidates,
      limit: k,
      // Optional pre-filter by category (requires a filter index field in Atlas)
      ...(category ? { filter: { 'metadata.category': category } } : {}),
    },
  };

  const pipeline = [
    vectorStage,
    {
      $project: {
        _id: 1,
        text: 1,
        documentId: 1,
        metadata: 1,
        score: { $meta: 'vectorSearchScore' },
        embedding: 0, // never return the raw vector to callers
      },
    },
  ];

  return DocumentChunk.aggregate(pipeline);
};

// ── Chunk count helper ─────────────────────────────────────────────────────────

/**
 * Count how many chunks exist for a given document.
 * @param {string|ObjectId} documentId
 */
export const countChunks = async (documentId) =>
  DocumentChunk.countDocuments({ documentId });
