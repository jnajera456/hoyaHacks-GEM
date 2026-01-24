import fs from "fs";
import fetch from "node-fetch";

const ELEVEN_API_KEY = process.env.ELEVEN_API_KEY;
const ELEVEN_VOICE_ID = process.env.ELEVEN_VOICE_ID;

export async function textToSpeech(text, outputPath) {
  if (!ELEVEN_API_KEY) throw new Error("ELEVEN_API_KEY not set");
  if (!ELEVEN_VOICE_ID) throw new Error("ELEVEN_VOICE_ID not set");

  const response = await fetch(
    `https://api.elevenlabs.io/v1/text-to-speech/${ELEVEN_VOICE_ID}`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "xi-api-key": ELEVEN_API_KEY
      },
      body: JSON.stringify({
        text,
        voice_settings: {
          stability: 0.7,
          similarity_boost: 0.7
        }
      })
    }
  );

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`ElevenLabs TTS error: ${error}`);
  }

  const audioBuffer = Buffer.from(await response.arrayBuffer());
  fs.writeFileSync(outputPath, audioBuffer);
}
