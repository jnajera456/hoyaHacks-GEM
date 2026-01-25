import mongoose from 'mongoose';

const deckSchema = new mongoose.Schema(
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
    title: {
      type: String,
      required: true,
    },
    description: {
      type: String,
      default: '',
    },
    subject: {
      type: String,
      default: '',
    },
    tags: {
      type: [String],
      default: [],
    },
    content: {
      flashcards: {
        type: [
          {
            id: String,
            question: String,
            answer: String,
            difficulty: String,
          },
        ],
        default: [],
      },
    },
    stats: {
      timesStudied: {
        type: Number,
        default: 0,
      },
      averageScore: {
        type: Number,
        default: 0,
      },
      lastScore: {
        type: Number,
        default: 0,
      },
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
    lastStudied: {
      type: Date,
      default: null,
    },
    updatedAt: {
      type: Date,
      default: Date.now,
    },
  },
  { collection: 'decks' }
);

export const Deck = mongoose.models.Deck || mongoose.model('Deck', deckSchema);
