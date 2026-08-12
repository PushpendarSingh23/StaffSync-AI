import mongoose, { Schema } from 'mongoose';

/**
 * Feedback
 * One rating per (conversationId, userId) pair.
 * A sparse unique index prevents double-voting.
 */
const FeedbackSchema = new Schema(
  {
    conversationId: {
      type: Schema.Types.ObjectId,
      ref: 'Conversation',
      required: true,
    },
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    rating: {
      type: String,
      enum: { values: ['helpful', 'not_helpful'], message: 'Rating must be helpful or not_helpful.' },
      required: true,
    },
    // Optional free-text comment (max 500 chars)
    comment: {
      type: String,
      trim: true,
      maxlength: [500, 'Comment must be 500 characters or fewer.'],
      default: '',
    },
  },
  { timestamps: true }
);

// Each user can only vote once per conversation
FeedbackSchema.index({ conversationId: 1, userId: 1 }, { unique: true });

export const Feedback = mongoose.model('Feedback', FeedbackSchema);
