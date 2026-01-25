import mongoose from 'mongoose';

/**
 * GeneratedContent schema - AI-generated study materials
 * Stores metadata about generated videos, summaries, quizzes, etc.
 * _id generated automatically by MongoDB
 */
const generatedContentSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: 'User',
      index: true,
    },
    topicId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: 'Topic',
      index: true,
    },
    type: {
      type: String,
      required: true,
      enum: ['video', 'summary', 'quiz', 'flashcards', 'study-guide'],
    },
    title: {
      type: String,
      default: '',
      trim: true,
    },
    status: {
      type: String,
      enum: ['pending', 'generating', 'completed', 'failed'],
      default: 'pending',
    },
    // Path to generated content in R2 or other storage
    contentPath: String,
    // Storage provider (for future use)
    storageProvider: {
      type: String,
      default: 'r2',
    },
    createdAt: {
      type: Date,
      default: Date.now,
      index: true,
    },
  },
  { collection: 'generatedContent', timestamps: false }
);

export const GeneratedContent =
  mongoose.models.GeneratedContent || mongoose.model('GeneratedContent', generatedContentSchema);
