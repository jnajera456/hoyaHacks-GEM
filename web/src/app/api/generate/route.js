import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import { GeneratedDeck } from "@/lib/models/GeneratedDeck";
import { getTokenFromRequest, verifyToken } from "@/lib/auth";
import { autoBootstrap } from "@/lib/autoBootstrap";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

export async function POST(request) {
  try {
    const token = getTokenFromRequest(request);
    const decoded = token ? verifyToken(token) : null;
    if (!decoded) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();
    await autoBootstrap();

    const { text, fileContent, fileName, fileType } = await request.json();

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

    console.log("📄 Processing content:", {
      source: fileContent ? `File: ${fileName}` : "Text input",
      length: contentToProcess.length,
    });

const prompt = `You are a Master Educational Architect. Your task is to deconstruct the provided content and rebuild it into a gamified study suite.

### GOAL
Produce 15-20 high-quality, engaging study units. 

### CONTENT TO PROCESS
${contentToProcess.substring(0, 3000)}

### FORMAT TYPES
1. MULTIPLE_CHOICE: { "id": string, "type": "multiple_choice", "question": string, "options": [4 strings], "correctIndex": number, "explanation": string }
2. FLASHCARD: { "id": string, "type": "flashcard", "content": "Question?Answer" }
3. CONCEPT: { "id": string, "type": "concept", "content": string, "explanation": string }
4. VISUAL_EXAMPLE: { "id": string, "type": "visual_example", "title": string, "content": string }
5. MATCH_GAME: { "id": string, "type": "match_game", "title": string, "pairs": [{"term": string, "definition": string}] }

### STRICT RULES
- **Tone**: Use high-energy, witty, and relatable humor. Use vivid real-world analogies (e.g., comparing a cell membrane to a club bouncer).
- **Variety**: You MUST use all 5 types. No single type should exceed 30% of the total output.
- **Accuracy**: Multiple choice distractors must be plausible, not obvious jokes.
- **Match Games**: Each match game must contain exactly 5 pairs.
- **JSON Integrity**: Use ONLY double quotes for keys and strings. If you use quotes inside a string, escape them with a backslash (\"). Do not include any text outside the JSON array.

### OUTPUT
Return ONLY a valid JSON array.`;

    console.log("🤖 Generating interactive content...");

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const geminiText = response.text();

    console.log("✅ Received response");

    let materials = [];
    try {
      let jsonText = geminiText.trim();
      
      jsonText = jsonText
        .replace(/```json\s*/g, "")
        .replace(/```javascript\s*/g, "")
        .replace(/```\s*/g, "")
        .trim();

      const parsed = JSON.parse(jsonText);
      materials = Array.isArray(parsed) ? parsed : [parsed];

      materials = materials.map((material, index) => {
        const baseId = `material_${Date.now()}_${index}`;
        
        // Validate each type
        if (material.type === 'multiple_choice') {
          return {
            type: 'multiple_choice',
            question: material.question || 'What is the main concept?',
            options: Array.isArray(material.options) && material.options.length === 4 
              ? material.options 
              : ['Option A', 'Option B', 'Option C', 'Option D'],
            correctIndex: typeof material.correctIndex === 'number' 
              ? material.correctIndex 
              : 0,
            explanation: material.explanation || 'Review the concept',
            id: material.id || baseId
          };
        }
        
        if (material.type === 'visual_example') {
          return {
            type: 'visual_example',
            title: material.title || 'Example',
            content: material.content || 'Consider this example...',
            id: material.id || baseId
          };
        }
        
        if (material.type === 'match_game') {
          return {
            type: 'match_game',
            title: material.title || 'Match the pairs!',
            pairs: Array.isArray(material.pairs) && material.pairs.length >= 4
              ? material.pairs.slice(0, 6)
              : [
                  {term: 'Term 1', definition: 'Definition 1'},
                  {term: 'Term 2', definition: 'Definition 2'},
                  {term: 'Term 3', definition: 'Definition 3'},
                  {term: 'Term 4', definition: 'Definition 4'}
                ],
            id: material.id || baseId
          };
        }
        
        if (material.type === 'flashcard') {
          let content = material.content || 'Question?Answer';
          if (!content.includes('?')) {
            content = `What should you know?${content}`;
          }
          return {
            type: 'flashcard',
            content: content,
            id: material.id || baseId
          };
        }
        
        // Default to concept
        return {
          type: 'concept',
          content: material.content || 'Key concept to remember',
          explanation: material.explanation || '',
          id: material.id || baseId
        };
      });

      console.log("Parsed", materials.length, "materials");

    } catch (parseError) {
      console.error("Parse error:", parseError.message);

    }

    if (materials.length < 4) {
      materials.push({
        type: 'concept',
        content: 'Review this material regularly for better retention',
        explanation: 'Spaced repetition is scientifically proven to improve memory!',
        id: `material_${Date.now()}_extra`
      });
    }

    const deck = {
      id: `deck_${Date.now()}`,
      title: fileName
        ? `${fileName.replace(/\.(pdf|txt|mp4|mp3|wav|mov)$/i, '')}`
        : `Study Deck - ${new Date().toLocaleDateString()}`,
      materials: materials,
      sourceText: contentToProcess.substring(0, 500),
      sourceFile: fileName ? { 
        name: fileName, 
        type: fileType,
        size: contentToProcess.length 
      } : undefined,
      generatedAt: new Date().toISOString(),
      stats: {
        totalMaterials: materials.length,
        multipleChoice: materials.filter(m => m.type === 'multiple_choice').length,
        flashcards: materials.filter(m => m.type === 'flashcard').length,
        concepts: materials.filter(m => m.type === 'concept').length,
        visualExamples: materials.filter(m => m.type === 'visual_example').length,
        games: materials.filter(m => m.type === 'match_game').length
      }
    };

    console.log(`Created deck: "${deck.title}"`);
    console.log(`${deck.stats.multipleChoice} quizzes`);
    console.log(`${deck.stats.flashcards} flashcards`);
    console.log(`${deck.stats.concepts} concepts`);
    console.log(`${deck.stats.visualExamples} examples`);
    console.log(`${deck.stats.games} games`);

    // Persist deck to MongoDB associated with the authenticated user
    let savedDeckId = null;
    try {
      await connectDB();
      // Ensure collection + indexes exist (idempotent)
      try { await GeneratedDeck.createCollection(); } catch {}
      try { await GeneratedDeck.syncIndexes(); } catch {}
      const doc = new GeneratedDeck({
        userId: decoded.userId,
        deckId: deck.id,
        title: deck.title,
        deck,
      });
      const saved = await doc.save();
      savedDeckId = saved._id?.toString?.() ?? String(saved._id);
    } catch (persistError) {
      console.error("Failed to persist generated deck:", persistError);
      // Non-fatal: continue to return the generated payload
    }

    return NextResponse.json({
      success: true,
      materials: materials,
      deck: deck,
      savedDeckId,
      message: `Generated ${materials.length} interactive study materials!`,
    });

  } catch (error) {
    console.error("Error:", error);

    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Failed to generate study materials',
      },
      { status: 500 }
    );
  }
}