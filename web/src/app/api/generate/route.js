import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextResponse } from "next/server";

// Initialize Gemini
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash-lite" });

export async function POST(request) {
  try {
<<<<<<< HEAD
    const { text, fileContent, fileName, fileType, customTitle } = await request.json();
    
=======
    const { text, fileContent, fileName, fileType } = await request.json();

>>>>>>> f2fa7f122f4b3001483192cbbecee30edacfafa8
    // Validate input
    if (!text && !fileContent) {
      return NextResponse.json(
        {
          success: false,
          error: "Please provide text content or upload a file",
        },
        { status: 400 }
      );
    }

    const contentToProcess = fileContent || text;

    console.log("📝 Processing content:", {
      source: fileContent ? `File: ${fileName}` : "Text input",
      length: contentToProcess.length,
      preview: contentToProcess.substring(0, 200) + "...",
    });

<<<<<<< HEAD
    // Use custom title if provided
    const finalTitle = customTitle || 
      (fileName 
        ? `Study: ${fileName.replace('.pdf', '').replace('.txt', '')}`
        : `Study Deck`);
=======
    // Check if this is a PDF placeholder message
    const isPDFPlaceholder =
      contentToProcess.includes("PDF text extraction") ||
      contentToProcess.includes("Save as TXT file");
>>>>>>> f2fa7f122f4b3001483192cbbecee30edacfafa8

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
      jsonText = jsonText
        .replace(/```json\s*/g, "")
        .replace(/```\s*/g, "")
        .replace(/```javascript\s*/g, "");

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
          explanation: "Generated study content",
        },
        {
          type: "flashcard",
          content: "What was the main topic? Review key points",
          explanation: "Focus on understanding core concepts",
        },
      ];
    }

    // Ensure all materials have required fields
    const materialsWithIds = materials.map((material, index) => ({
      type: material.type || (index === 0 ? "summary" : "flashcard"),
      content: material.content || `Study point ${index + 1}`,
      explanation: material.explanation || "",
      id: `material_${Date.now()}_${index}`,
    }));

    // Generate image for this deck
    let deckImageUrl = null;
    try {
      console.log("🖼️ Generating image for deck...");
      
      // Generate an image based on the deck title/content
      const imagePrompt = finalTitle + " " + 
        (fileName ? fileName.replace(/\.[^/.]+$/, "") : "study notes") + 
        " educational illustration";
      
      console.log("Image prompt:", imagePrompt);
      
      // Call internal image generation API
      const imageResponse = await fetch('http://localhost:3000/api/generate-image', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          prompt: imagePrompt
        })
      });
      
      if (imageResponse.ok) {
        const imageData = await imageResponse.json();
        deckImageUrl = imageData.imageUrl;
        console.log("✅ Image generated:", deckImageUrl);
      } else {
        console.warn("⚠️ Image generation failed, using fallback");
        deckImageUrl = "https://images.pexels.com/photos/8932609/pexels-photo-8932609.jpeg";
      }
    } catch (imageError) {
      console.error("❌ Error generating image:", imageError);
      deckImageUrl = "https://images.pexels.com/photos/8932609/pexels-photo-8932609.jpeg";
    }

    // Create deck WITH BOTH coverImage AND imageUrl
    const deck = {
      id: `deck_${Date.now()}`,
<<<<<<< HEAD
      title: finalTitle,
=======
      title: fileName
        ? `Study: ${fileName.replace(".pdf", "").replace(".txt", "")}`
        : `Study Deck`,
>>>>>>> f2fa7f122f4b3001483192cbbecee30edacfafa8
      materials: materialsWithIds,
      coverImage: deckImageUrl, // ✅ Primary property
      imageUrl: deckImageUrl,   // ✅ Keep for backward compatibility
      sourceText: contentToProcess.substring(0, 300),
      sourceFile: fileName ? { name: fileName, type: fileType } : undefined,
      generatedAt: new Date().toISOString(),
      stats: {
        totalMaterials: materialsWithIds.length,
      },
    };

    console.log(`🎉 Created deck with ${materialsWithIds.length} materials`);

    return NextResponse.json({
      success: true,
      materials: materialsWithIds,
      deck: deck,
      message: "Study materials generated successfully!",
    });
  } catch (error) {
    console.error("❌ API Route Error:", error);

    return NextResponse.json(
      {
        success: false,
        error: error.message,
      },
      { status: 500 }
    );
  }
}
