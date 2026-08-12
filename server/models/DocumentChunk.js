import mongoose, { Schema } from 'mongoose';

/**
 * DocumentChunk
 * One Mongo document per text chunk produced during PDF indexing.
 * The `embedding` array holds the raw float vector from Gemini
 * and is used by MongoDB Atlas Vector Search.
 */
const DocumentChunkSchema = new Schema(
  {
    // Parent document reference — used to delete all chunks when a doc is removed
    documentId: {
      type: Schema.Types.ObjectId,
      ref: 'Document',
      required: true,
      index: true,
    },

    // The actual text content of this chunk
    text: {
      type: String,
      required: true,
    },

    // Raw embedding vector from Gemini (768 dimensions for embedding-001)
    embedding: {
      type: [Number],
      required: true,
    },

    // Denormalised metadata — stored here so Atlas Vector Search can filter
    // without an extra lookup on every query
    metadata: {
      title: { type: String, required: true },
      category: { type: String, required: true },
      pageNumber: { type: Number, default: 0 },
      chunkIndex: { type: Number, required: true },
      uploadedBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
      uploadDate: { type: Date, required: true },
    },
  },
  {
    // No timestamps needed — createdAt would just mirror metadata.uploadDate
    timestamps: false,
  }
);

export const DocumentChunk = mongoose.model('DocumentChunk', DocumentChunkSchema);
