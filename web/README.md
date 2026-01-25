# GEM Web App

## Quick Setup

```bash
npm install
cp .env.example .env.local
```

Add your API keys to `.env.local`. You'll need:
- MongoDB connection string
- ElevenLabs API key

Then start the dev server:

```bash
npm run dev
```

Visit `http://localhost:3000`

## What We Support

**File uploads:** PDF and TXT files only

## How the App Works

1. **User signs up** - Creates account with email/password
2. **Uploads a file** - TXT or PDF with study terms
3. **AI processes it** - Gemini AI generates flashcards and quizzes
4. **User studies** - Flashcards, matching games, audio pronunciation
5. **Tracks progress** - Saves decks to account

## API Endpoints

- `/api/auth/` - Login/signup
- `/api/decks/` - Create and manage study decks
- `/api/generate/` - AI content generation
- `/api/generate-audio/` - Text-to-speech

## Environment Variables

See `.env.example` for all required keys.

## Running in Production

```bash
npm run build
npm start
```

## Troubleshooting

**Can't connect to MongoDB?**
- Check your connection string in `.env.local`
- Make sure your IP is whitelisted in MongoDB Atlas

**Build errors?**
```bash
rm -rf .next node_modules
npm install
npm run build
```

## Questions?

Check the root [README.md](../README.md) for project overview.

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
