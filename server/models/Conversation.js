import mongoose, { Schema } from 'mongoose';

/**
 * Conversation
 * One document per AI answer — persisted immediately after every successful
 * chat response so nothing is lost even if the browser tab closes.
 */
const ConversationSchema = new Schema(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    // Client-generated id for one chat window/tab — groups turns into a
    // multi-turn thread. Optional: older/legacy conversations may not have one.
    sessionId: {
      type: String,
      index: true,
    },
    question: {
      type: String,
      required: true,
      trim: true,
      maxlength: 1000,
    },
    answer: {
      type: String,
      required: true,
    },
    // Denormalised sources array returned by chatService
    retrievedSources: [
      {
        document:   { type: String },
        category:   { type: String },
        chunkIndex: { type: Number },
        score:      { type: Number },
      },
    ],
    confidence: {
      type: String,
      enum: ['high', 'medium', 'low'],
      required: true,
    },
  },
  { timestamps: true }
);

// Index for history listing — userId + newest first
ConversationSchema.index({ userId: 1, createdAt: -1 });

// Index for loading a session's recent turns (multi-turn memory)
ConversationSchema.index({ sessionId: 1, createdAt: -1 });

export const Conversation = mongoose.model('Conversation', ConversationSchema);
