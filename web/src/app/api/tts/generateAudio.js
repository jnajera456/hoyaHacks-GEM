import "dotenv/config";
import { textToSpeech } from "./ttsClient.js";
import player from "play-sound";
import path from "path";

// Make sure output folder exists
const outputFile = path.join("output", "test.mp3");

async function main() {
  try {
    // Replace this with any text you want
    const text = "Hello! This is your AI speaking automatically from a pre-generated text.";

    // Generate audio
    await textToSpeech(text, outputFile);
    console.log("✅ Audio successfully generated at:", outputFile);

    // Play audio automatically
    player().play(outputFile, (err) => {
      if (err) console.error("❌ Audio playback error:", err);
      else console.log("▶ Playback finished.");
    });
  } catch (err) {
    console.error("❌ Failed to generate or play audio:", err);
  }
}

main();
