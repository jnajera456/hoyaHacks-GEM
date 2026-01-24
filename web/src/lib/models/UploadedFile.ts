import mongoose from 'mongoose';

/**
 * UploadedFile schema - user-uploaded learning materials
 * Stores metadata about files in Cloudflare R2
 * _id generated automatically by MongoDB
 */
const uploadedFileSchema = new mongoose.Schema(
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
    originalName: {
      type: String,
      required: true,
      trim: true,
    },
    filename: {
      type: String,
      required: true,
    },
    mimeType: {
      type: String,
      required: true,
    },
    size: {
      type: Number,
      required: true,
    },
    // Storage provider (always 'r2' for now)
    storageProvider: {
      type: String,
      default: 'r2',
      enum: ['r2'],
    },
    // R2 bucket name
    bucket: {
      type: String,
      required: true,
    },
    // R2 object key (path in bucket)
    key: {
      type: String,
      required: true,
    },
    // Full storage path (r2://bucket/key)
    storagePath: {
      type: String,
      required: true,
    },
    createdAt: {
      type: Date,
      default: Date.now,
      index: true,
    },
  },
  { collection: 'uploadedFiles', timestamps: false }
);

export const UploadedFile =
  mongoose.models.UploadedFile || mongoose.model('UploadedFile', uploadedFileSchema);
