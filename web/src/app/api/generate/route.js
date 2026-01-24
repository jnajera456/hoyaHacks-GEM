import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextResponse } from "next/server";
import { textToSpeech } from "@/lib/ttsClient"; // Adjust path as needed
import { createAudioScript } from "@/lib/audioUtils"; // Adjust path as needed

// Initialize Gemini
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-3-flash-preview" });

export async function POST(request) {
  try {
    const { text, generateAudio } = await request.json();
    
    if (!text || text.trim().length < 10) {
      return NextResponse.json(
        { success: false, error: "Please provide at least 10 characters of text" },
        { status: 400 }
      );
    }

    console.log("📝 Processing text:", text.substring(0, 100) + "...");

    // Generate study materials with Gemini
    const prompt = `Create 3 study items from this lecture content. Return ONLY valid JSON in this exact format:
    {
      "materials": [
        {
          "type": "flashcard",
          "content": "Question? Answer",
          "explanation": "Optional explanation",
          "tags": ["topic1", "topic2"]
        },
        {
          "type": "summary", 
          "content": "Brief summary here",
          "tags": ["key_concept"]
        },
        {
          "type": "concept",
          "content": "Key concept definition",
          "explanation": "Why this matters"
        }
      ]
    }

    Content: ${text.substring(0, 500)}`;

    console.log("🤖 Sending request to Gemini...");
    
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const geminiText = response.text();
    
    console.log("✅ Raw Gemini response received:");
    console.log("--- Response Start ---");
    console.log(geminiText);
    console.log("--- Response End ---");

    // Try to extract JSON
    const jsonMatch = geminiText.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      console.error("❌ No JSON found in response");
      return NextResponse.json({
        success: false,
        error: "No valid JSON in AI response",
        rawResponse: geminiText.substring(0, 200)
      });
    }

    const jsonString = jsonMatch[0];
    console.log("📊 Extracted JSON string:", jsonString.substring(0, 200) + "...");

    let parsedData;
    try {
      parsedData = JSON.parse(jsonString);
      console.log("✅ Successfully parsed JSON");
    } catch (parseError) {
      console.error("❌ JSON parse error:", parseError.message);
      parsedData = {
        materials: [
          {
            type: "summary",
            content: "Study materials generated from your text. Here's what to study: " + text.substring(0, 100),
            id: "fallback_1",
            tags: ["study", "notes"]
          }
        ]
      };
    }

    // Add IDs to materials
    const materialsWithIds = parsedData.materials.map((material, index) => ({
      ...material,
      id: `material_${Date.now()}_${index}`
    }));

    console.log(`🎉 Generated ${materialsWithIds.length} study materials`);
    
    // Generate audio if requested
    let audioBase64 = null;
    let audioScript = null;
    
    if (generateAudio) {
      try {
        console.log("🎙️ Generating audio from study materials...");
        
        // Create audio script from materials using helper function
        audioScript = createAudioScript(materialsWithIds);
        console.log("📝 Audio script:", audioScript.substring(0, 100) + "...");
        
        // Generate audio using TTS client
        const audioBuffer = await textToSpeech(audioScript);
        audioBase64 = audioBuffer.toString('base64');
        
        console.log("✅ Audio generated successfully");
      } catch (audioError) {
        console.error("❌ Audio generation error:", audioError.message);
        // Continue without audio
      }
    }
    
    return NextResponse.json({
      success: true,
      materials: materialsWithIds,
      audio: audioBase64 ? {
        base64: audioBase64,
        script: audioScript,
        mimeType: "audio/mpeg"
      } : null,
      rawResponse: geminiText.substring(0, 300)
    });

  } catch (error) {
    console.error("❌ API Route Error:", error);
    
    return NextResponse.json(
      { 
        success: false, 
        error: error.message,
        details: "Check if API key is valid and network is working"
      },
      { status: 500 }
    );
  }
}

// Optional: GET method for testing
export async function GET() {
  return NextResponse.json({
    message: "StudyToks Generate API is running!",
    instructions: "Send a POST request with JSON body: { text: 'your lecture content here', generateAudio: true }",
    status: "ready"
  });
}