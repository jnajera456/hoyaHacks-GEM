import mongoose from 'mongoose';

/**
 * GeneratedContent schema - AI-generated study materials
 * Stores metadata about AI-generated videos, flashcards, summaries, etc.
 * Actual content (video files, etc.) stored in cloud storage, metadata here
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
    // Type of content generated (video, summary, flashcards, quiz, etc.)
    contentType: {
      type: String,
      required: true,
      enum: ['short-form-video', 'summary', 'flashcards', 'quiz', 'study-guide', 'artifact'],
    },
    // Which AI model generated this
    aiModel: {
      type: String,
      required: true,
      enum: ['gemini', 'chatgpt', 'claude', 'other'],
    },
    // Storage path for generated content (cloud URL, S3 path, etc.)
    contentPath: String,
    // Status of generation
    status: {
      type: String,
      enum: ['pending', 'generating', 'completed', 'failed'],
      default: 'pending',
    },
    // Error message if generation failed
    errorMessage: String,
    // Metadata about generation
    generationMetadata: {
      prompt: String,           // Input prompt used
      parameters: {             // Model parameters (temperature, etc.)
        temperature: Number,
        maxTokens: Number,
        otherParams: Object,
      },
      executionTimeMs: Number,  // How long generation took
      tokensUsed: Number,       // For cost tracking
      modelVersion: String,     // Version of model used
    },
    // Metadata about content
    contentMetadata: {
      duration: Number,         // For videos (seconds)
      wordCount: Number,        // For text content
      itemCount: Number,        // For flashcards/quiz (number of items)
      sourceFileIds: [mongoose.Schema.Types.ObjectId], // Which uploaded files were used
    },
    // User feedback/ratings
    userFeedback: {
      rating: {
        type: Number,
        min: 1,
        max: 5,
      },
      notes: String,
    },
    createdAt: {
      type: Date,
      default: Date.now,
      index: true,
    },
    updatedAt: {
      type: Date,
      default: Date.now,
    },
  },
  { collection: 'generatedContent', timestamps: true }
);

export const GeneratedContent =
  mongoose.models.GeneratedContent || mongoose.model('GeneratedContent', generatedContentSchema);
