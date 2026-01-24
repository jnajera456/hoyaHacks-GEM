import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextResponse } from "next/server";

// Initialize Gemini
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-3-flash-preview" });

export async function POST(request) {
  try {
    const { text } = await request.json();
    
    if (!text || text.trim().length < 10) {
      return NextResponse.json(
        { success: false, error: "Please provide at least 10 characters of text" },
        { status: 400 }
      );
    }

    console.log("📝 Processing text:", text.substring(0, 100) + "...");

    // Simple test prompt first
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
      // Create fallback response
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
    
    return NextResponse.json({
      success: true,
      materials: materialsWithIds,
      rawResponse: geminiText.substring(0, 300) // Include for debugging
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
    instructions: "Send a POST request with JSON body: { text: 'your lecture content here' }",
    status: "ready"
  });
}