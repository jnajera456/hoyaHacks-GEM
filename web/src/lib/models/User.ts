import mongoose from 'mongoose';

/**
 * User schema - represents authenticated users with passwordHash (bcryptjs)
 * email is unique index for login; _id generated automatically by MongoDB
 */
const userSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      index: true,
      trim: true,
    },
    name: {
      type: String,
      default: '',
      trim: true,
    },
    // Password hashed with bcryptjs
    passwordHash: {
      type: String,
      required: true,
    },
    createdAt: {
      type: Date,
      default: Date.now,
      index: true,
    },
  },
  { collection: 'users', timestamps: false }
);

export const User = mongoose.models.User || mongoose.model('User', userSchema);
