import mongoose from 'mongoose';

/**
 * UploadedFile schema - user-uploaded learning materials
 * Stores metadata about files (PDF, video, image, etc.)
 * Actual file content stored in cloud storage, path reference here
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
    filename: {
      type: String,
      required: true,
    },
    originalName: {
      type: String,
      required: true,
    },
    fileType: {
      type: String,
      required: true,
      enum: ['pdf', 'txt', 'video', 'image', 'document', 'other'],
    },
    mimeType: {
      type: String,
      default: 'application/octet-stream',
    },
    // Storage location (e.g., cloud storage path, URL)
    storagePath: {
      type: String,
      required: true,
    },
    // File size in bytes
    size: {
      type: Number,
      required: true,
    },
    // Optional metadata extracted from file
    metadata: {
      pageCount: Number,         // For PDFs
      duration: Number,          // For videos (seconds)
      width: Number,             // For images/videos
      height: Number,            // For images/videos
      textExtract: String,       // First N chars of text content
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
  { collection: 'uploadedFiles', timestamps: true }
);

export const UploadedFile =
  mongoose.models.UploadedFile || mongoose.model('UploadedFile', uploadedFileSchema);
