import mongoose from 'mongoose';

const userSchema = new mongoose.Schema(
  {
    id: {
      type: String,
      required: true,
      unique: true,
    },
    name: {
      type: String,
      required: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
    },
    passwordHash: {
      type: String,
      default: null, // null if using OAuth
    },
    avatarColor: {
      type: String,
      default: '#7C3AED',
    },
    isGuest: {
      type: Boolean,
      default: false,
    },
    preferences: {
      theme: {
        type: String,
        enum: ['light', 'dark', 'auto'],
        default: 'light',
      },
      notifications: {
        type: Boolean,
        default: true,
      },
      dailyReminder: {
        type: Boolean,
        default: true,
      },
      studyGoal: {
        type: Number,
        default: 30, // minutes per day
      },
      language: {
        type: String,
        default: 'en',
      },
    },
    studyStats: {
      totalStudyTime: {
        type: Number,
        default: 0, // in minutes
      },
      daysStudied: {
        type: Number,
        default: 0,
      },
      longestStreak: {
        type: Number,
        default: 0,
      },
      averageScore: {
        type: Number,
        default: 0,
      },
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
    updatedAt: {
      type: Date,
      default: Date.now,
    },
  },
  { collection: 'users' }
);

export const User = mongoose.models.User || mongoose.model('User', userSchema);
