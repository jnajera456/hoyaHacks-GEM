import mongoose from 'mongoose';

/**
 * User schema - represents authenticated users
 * Single source of truth for user identity and metadata
 */
const userSchema = new mongoose.Schema(
  {
    _id: mongoose.Schema.Types.ObjectId, // MongoDB default
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      index: true,
    },
    name: {
      type: String,
      required: true,
    },
    // Simple auth: stored as plain text for hackathon demo
    // In production, this should be hashed with bcryptjs
    password: {
      type: String,
      required: true,
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
  { collection: 'users', timestamps: true }
);

export const User = mongoose.models.User || mongoose.model('User', userSchema);
