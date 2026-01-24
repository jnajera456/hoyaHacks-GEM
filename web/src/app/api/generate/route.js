import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextResponse } from "next/server";

// Initialize Gemini
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-3-flash-preview" });

export async function POST(request) {
  try {
    const { text, fileContent, fileName, fileType } = await request.json();
    
    // Validate input
    if (!text && !fileContent) {
      return NextResponse.json(
        { success: false, error: "Please provide text content or upload a file" },
        { status: 400 }
      );
    }

    const contentToProcess = fileContent || text;
    
    console.log("📝 Processing content:", {
      source: fileContent ? `File: ${fileName}` : "Text input",
      length: contentToProcess.length,
      preview: contentToProcess.substring(0, 200) + "..."
    });

    // Check if this is a PDF placeholder message
    const isPDFPlaceholder = contentToProcess.includes("PDF text extraction") || 
                            contentToProcess.includes("Save as TXT file");
    
    // SIMPLE PROMPT that works better
    const prompt = `Create study materials from this content. 
Return ONLY a valid JSON array with 3-5 items. Each item should have: type, content, and explanation.

Example format:
[
  {"type": "flashcard", "content": "Question? Answer", "explanation": "More details"},
  {"type": "summary", "content": "Brief summary here", "explanation": ""},
  {"type": "concept", "content": "Key concept", "explanation": "Why it matters"}
]

Content: ${contentToProcess.substring(0, 1500)}`;

    console.log("🤖 Sending request to Gemini...");
    
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const geminiText = response.text();
    
    console.log("✅ Raw response preview:", geminiText.substring(0, 200));

    // Try to extract JSON
    let materials = [];
    try {
      // Clean the response
      let jsonText = geminiText.trim();
      
      // Remove markdown code blocks
      jsonText = jsonText.replace(/```json\s*/g, '')
                         .replace(/```\s*/g, '')
                         .replace(/```javascript\s*/g, '');
      
      // Try to parse
      const parsed = JSON.parse(jsonText);
      materials = Array.isArray(parsed) ? parsed : [parsed];
      
      console.log("✅ Parsed", materials.length, "materials");
      
    } catch (parseError) {
      console.error("❌ JSON parse error:", parseError.message);
      
      // FALLBACK: Create materials manually
      materials = [
        {
          type: "summary",
          content: "Study materials from your upload",
          explanation: "Generated study content"
        },
        {
          type: "flashcard",
          content: "What was the main topic? Review key points",
          explanation: "Focus on understanding core concepts"
        }
      ];
    }

    // Ensure all materials have required fields
    const materialsWithIds = materials.map((material, index) => ({
      type: material.type || (index === 0 ? 'summary' : 'flashcard'),
      content: material.content || `Study point ${index + 1}`,
      explanation: material.explanation || '',
      id: `material_${Date.now()}_${index}`
    }));

    // Create deck
    const deck = {
      id: `deck_${Date.now()}`,
      title: fileName 
        ? `Study: ${fileName.replace('.pdf', '').replace('.txt', '')}`
        : `Study Deck`,
      materials: materialsWithIds,
      sourceText: contentToProcess.substring(0, 300),
      sourceFile: fileName ? { name: fileName, type: fileType } : undefined,
      generatedAt: new Date().toISOString(),
      stats: {
        totalMaterials: materialsWithIds.length
      }
    };

    console.log(`🎉 Created deck with ${materialsWithIds.length} materials`);
    
    return NextResponse.json({
      success: true,
      materials: materialsWithIds,
      deck: deck,
      message: "Study materials generated successfully!"
    });

  } catch (error) {
    console.error("❌ API Route Error:", error);
    
    return NextResponse.json(
      { 
        success: false, 
        error: error.message
      },
      { status: 500 }
    );
  }
}