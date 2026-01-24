import mongoose from 'mongoose';

/**
 * Topic schema - user-created study topics
 * Each user can create multiple topics
 * Topics organize uploaded files and generated content
 */
const topicSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: 'User',
      index: true,
    },
    title: {
      type: String,
      required: true,
    },
    description: {
      type: String,
      default: '',
    },
    createdAt: {
      type: Date,
      default: Date.now,
      index: true,
    },
  },
  { collection: 'topics', timestamps: false }
);

export const Topic = mongoose.models.Topic || mongoose.model('Topic', topicSchema);
