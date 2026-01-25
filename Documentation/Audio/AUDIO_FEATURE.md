# Audio Feature Setup Guide

## Overview
The audio feature allows users to listen to study materials using ElevenLabs text-to-speech API.

## Prerequisites

### 1. ElevenLabs Account
1. Sign up at [ElevenLabs](https://elevenlabs.io/)
2. Get your API key from the dashboard
3. Choose a voice ID (or use the default voice)

## Installation

### 1. Environment Variables
Add these to your `.env.local` file:

```bash
ELEVEN_API_KEY=your_api_key_here
ELEVEN_VOICE_ID=your_voice_id_here
```

To find your voice ID:
- Go to ElevenLabs dashboard → Voices
- Click on a voice → Copy the Voice ID

### 2. Restart Development Server
```bash
npm run dev
```

## Usage

### In the Results Page
1. Navigate to any study deck
2. Look for the **speaker icon** button on the right side (above the up/down arrows)
3. Click to play audio for the current card
4. The button will show:
   - 🔊 **Speaker icon**: Ready to play
   - **Spinner**: Loading audio
   - ⏸️ **Pause icon** (green): Currently playing
5. Audio automatically stops when changing cards

## Features

- ✅ Text-to-speech for all material types (flashcards, concepts, multiple choice, etc.)
- ✅ Smart text extraction (questions + explanations for multiple choice)
- ✅ Automatic cleanup when switching cards
- ✅ Loading and playing states
- ✅ Error handling with user feedback

## API Endpoint

**POST** `/api/generate-audio`

**Request Body:**
```json
{
  "text": "Your study material content here"
}
```

**Response:**
- Content-Type: `audio/mpeg`
- Binary audio data (MP3)

## Troubleshooting

### "Failed to generate audio"
- Check that `ELEVEN_API_KEY` and `ELEVEN_VOICE_ID` are set in `.env.local`
- Verify you have credits in your ElevenLabs account
- Check the console for detailed error messages

### Audio not playing
- Ensure your browser allows audio playback
- Check browser console for errors
- Verify the text content is not empty

### API Errors
Check server logs for:
- Missing environment variables
- ElevenLabs API errors
- Network connectivity issues

## Cost Considerations

ElevenLabs charges per character:
- Free tier: ~10,000 characters/month
- Paid tiers: Various options available

Monitor usage in your ElevenLabs dashboard.

## Alternative: Browser TTS (Free)

If you want a free alternative, you can modify `ttsClient.js` to use the browser's built-in speech synthesis API instead of ElevenLabs. This requires client-side changes and won't sound as natural.
