const ELEVEN_API_KEY = process.env.ELEVEN_API_KEY;
const ELEVEN_VOICE_ID = process.env.ELEVEN_VOICE_ID;

export async function textToSpeech(text) {
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
    let errorMessage = '';
    try {
      const errorData = await response.json();
      // Handle different error response formats from ElevenLabs
      if (errorData.detail) {
        errorMessage = typeof errorData.detail === 'string' ? errorData.detail : JSON.stringify(errorData.detail);
      } else if (errorData.error) {
        errorMessage = typeof errorData.error === 'string' ? errorData.error : JSON.stringify(errorData.error);
      } else {
        errorMessage = JSON.stringify(errorData);
      }
    } catch {
      errorMessage = await response.text();
    }
    console.error(`❌ ElevenLabs error (${response.status}):`, errorMessage);
    throw new Error(`ElevenLabs TTS error: ${response.status} - ${errorMessage}`);
  }

  const audioBuffer = Buffer.from(await response.arrayBuffer());
  return audioBuffer;
}