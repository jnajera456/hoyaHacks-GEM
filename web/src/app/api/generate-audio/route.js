import { NextResponse } from "next/server";
import { textToSpeech } from "../tts/ttsClient.js";

export async function POST(request) {
  try {
    const { text } = await request.json();

    if (!text || text.trim().length === 0) {
      return NextResponse.json(
        { success: false, error: "Text is required" },
        { status: 400 }
      );
    }

    console.log("🎙️ Generating audio for text:", text.substring(0, 100) + "...");

    const audioBuffer = await textToSpeech(text);

    // Return audio as binary response
    return new NextResponse(audioBuffer, {
      status: 200,
      headers: {
        "Content-Type": "audio/mpeg",
        "Content-Disposition": 'inline; filename="audio.mp3"',
      },
    });

  } catch (error) {
    console.error("❌ Audio generation error:", error);
    return NextResponse.json(
      {
        success: false,
        error: error.message,
      },
      { status: 500 }
    );
  }
}