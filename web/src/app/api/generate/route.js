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

    const prompt = `Create study materials from this lecture content. Return ONLY valid JSON in this exact format:
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

    Content: ${text.substring(0, 1000)}`;

    console.log("🤖 Sending request to Gemini...");
    
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const geminiText = response.text();
    
    console.log("✅ Raw Gemini response received");

    // Try to extract JSON
    const jsonMatch = geminiText.match(/\{[\s\S]*\}/);
    let parsedData;
    
    if (jsonMatch) {
      try {
        parsedData = JSON.parse(jsonMatch[0]);
        console.log("✅ Successfully parsed JSON");
      } catch (parseError) {
        console.error("❌ JSON parse error:", parseError.message);
        parsedData = {
          materials: [
            {
              type: "summary",
              content: "Study materials generated from your text.",
              id: "fallback_1"
            }
          ]
        };
      }
    } else {
      parsedData = {
        materials: [
          {
            type: "summary",
            content: "No JSON found in response. Raw: " + geminiText.substring(0, 200),
            id: "fallback_2"
          }
        ]
      };
    }

    // Add IDs to materials
    const materialsWithIds = parsedData.materials.map((material, index) => ({
      ...material,
      id: `material_${Date.now()}_${index}`
    }));

    // Create a deck to save
    const deck = {
      id: `deck_${Date.now()}`,
      title: `Study Deck - ${new Date().toLocaleDateString()}`,
      materials: materialsWithIds,
      sourceText: text.substring(0, 200) + (text.length > 200 ? '...' : ''),
      generatedAt: new Date().toISOString(),
      rawGeminiResponse: geminiText // Save the raw response too
    };

    console.log(`🎉 Generated ${materialsWithIds.length} study materials`);
    
    // Save to localStorage via client-side (we'll return it and client saves)
    
    return NextResponse.json({
      success: true,
      materials: materialsWithIds,
      deck: deck, // Include the full deck
      message: "Study materials generated successfully!"
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

// GET method for testing
export async function GET() {
  return NextResponse.json({
    message: "StudyToks Generate API is running!",
    instructions: "Send a POST request with JSON body: { text: 'your lecture content here' }",
    status: "ready"
  });
}