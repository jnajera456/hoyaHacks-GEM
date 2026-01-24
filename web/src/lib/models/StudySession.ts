import mongoose from 'mongoose';

const studySessionSchema = new mongoose.Schema(
  {
    id: {
      type: String,
      required: true,
      unique: true,
    },
    userId: {
      type: String,
      required: true,
      index: true,
    },
    deckId: {
      type: String,
      required: true,
    },
    deckTitle: {
      type: String,
      required: true,
    },
    date: {
      type: Date,
      default: Date.now,
    },
    duration: {
      type: Number,
      required: true, // in minutes
    },
    score: {
      type: Number,
      required: true, // percentage 0-100
    },
    cardsStudied: {
      type: Number,
      required: true,
    },
    cardProgress: {
      type: [
        {
          cardId: String,
          correct: Boolean,
          timeSpent: Number, // in seconds
        },
      ],
      default: [],
    },
  },
  { collection: 'studySessions' }
);

export const StudySession =
  mongoose.models.StudySession || mongoose.model('StudySession', studySessionSchema);
