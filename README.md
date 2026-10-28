# ReelStudy

<img src="web/public/brand/open-reel-mark.svg" alt="ReelStudy Open Reel logo" width="96">

## How It Works

1. Sign up and log in
2. Upload a TXT or PDF with your study content
3. Gemini AI generates flashcards, quizzes, and matching games
4. Study interactively with audio pronunciation

## What You Need

- Node.js 18+
- MongoDB connection string (free at [mongodb.com](https://mongodb.com))
- API keys from:
  - [Google AI Studio](https://aistudio.google.com) for Gemini
  - [ElevenLabs](https://elevenlabs.io) for audio

## Getting Started

```bash
cd web
npm install
cp .env.example .env.local
```

Fill in your API keys in `.env.local`, then:

```bash
npm run dev
```

Go to `http://localhost:3000` and start studying!

## Tech Stack

- Next.js and React
- MongoDB
- Gemini AI (Google)
- ElevenLabs for audio
- Tailwind CSS

See [web/README.md](./web/README.md) for more details on setup and architecture.

Brand assets and usage rules are documented in [BRAND.md](./BRAND.md).
