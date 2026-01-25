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

    const { text, fileName, fileType } = await request.json();

    if (!text) {
      return NextResponse.json(
        {
          success: false,
          error: "Please provide text content or upload a file",
        },
        { status: 400 }
      );
    }

    const contentToProcess = text;

    console.log("📄 Processing content:", {
      source: fileName ? `File: ${fileName}` : "Text input",
      contentLength: contentToProcess.length,
      fileType: fileType || 'text'
    });

const prompt = `You are a Master Educational Architect. Deconstruct the provided content and rebuild it into a gamified study suite.

GOAL: Produce 15-20 high-quality, engaging study units.

CONTENT TO PROCESS (truncated):
${contentToProcess.substring(0, 3000)}

OUTPUT FORMAT: Return ONLY a valid JSON array (no surrounding text, no code fences). Each item MUST be one of the following types with the exact schema:

1. MULTIPLE_CHOICE:
{ "id": string, "type": "multiple_choice", "question": string, "options": [4 strings], "correctIndex": number, "explanation": string }

2. FLASHCARD:
{ "id": string, "type": "flashcard", "content": "Question?Answer" }

3. CONCEPT:
{ "id": string, "type": "concept", "content": string, "explanation": string }

4. VISUAL_EXAMPLE:
{ "id": string, "type": "visual_example", "title": string, "content": string }

5. MATCH_GAME:
{ "id": string, "type": "match_game", "title": string, "pairs": [{"term": string, "definition": string}] }

STRICT RULES:
- Tone: High-energy, witty, relatable; use vivid analogies.
- Variety: Use all 5 types; no type exceeds 30% of items.
- Accuracy: Multiple-choice distractors must be plausible.
- Match games: Exactly 5 pairs per item.
- JSON integrity: Use ONLY double quotes; escape inner quotes with \\". Do NOT include any text outside the JSON array.

CRITICAL CONTENT LENGTH CONSTRAINTS:
- For CONCEPT type: content must be MAXIMUM 4 sentences total - concise, punchy, focused on the single most important point.
- For VISUAL_EXAMPLE type: content must be MAXIMUM 4 sentences with optional 1 short heading - think TikTok-style: quick, digestible, impactful.
- For MULTIPLE_CHOICE type: the 'explanation' field must be MAXIMUM 2 sentences (about 25-30 words). Be extremely concise - explain ONLY why the answer is correct in the briefest way possible.
- Each concept and visual example must fit on one screen with NO scrolling.
- Maintain educational value through clarity and focus, not length.
- Keep other types (flashcard, match_game) standard length.

FLASHCARD QUESTION REQUIREMENTS:
- For flashcard items, NEVER use generic questions like 'What should you know?' - always write specific, contextual questions that relate directly to the topic being studied.
- Example: Instead of 'What should you know?Name the stages', use 'What are the two main stages of photosynthesis?'
- Questions must be clear, specific, and immediately reveal what concept is being tested.

READABILITY REQUIREMENTS (critical):
- For "content" and "explanation" fields, write structured Markdown with clear sections.
- Always include headings (e.g., "## Key Idea"), bullets ("- " or "* "), and paragraph breaks (blank lines) where appropriate.
- Do NOT collapse everything into one large paragraph; ensure newlines between sections and bullets.
- Keep flashcard content strictly as "Question?Answer" without Markdown.
`;

    console.log("🤖 Generating interactive content...");

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const geminiText = response.text();

    console.log("Received response");

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

      // Helper function to truncate explanations to 2 sentences max
      const truncateToTwoSentences = (text) => {
        if (!text || typeof text !== 'string') return '';
        const sentences = text.split(/[.!?]+/).filter(s => s.trim());
        if (sentences.length <= 2) {
          return text.trim();
        }
        return sentences.slice(0, 2).map(s => s.trim()).join('. ') + '.';
      };

      // Lightweight server-side safeguard: ensure paragraph breaks & lists are preserved
      const formatText = (text) => {
        if (!text || typeof text !== 'string') return '';
        // Normalize CRLF to LF and trim trailing spaces
        let t = text.replace(/\r\n/g, "\n").replace(/\t/g, ' ').replace(/[ \u00A0]+$/gm, '');
        // If there are no newlines but the text is long, insert paragraph breaks after sentences
        if (!/\n/.test(t) && t.length > 240) {
          t = t
            .split(/(?<=[.!?])\s+/)
            .filter(Boolean)
            .join("\n\n");
        }
        // Collapse 3+ newlines into double newlines to keep sections clear
        t = t.replace(/\n{3,}/g, "\n\n");
        return t;
      };

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
            explanation: truncateToTwoSentences(material.explanation || 'Review the concept'),
            id: material.id || baseId
          };
        }
        
        if (material.type === 'visual_example') {
          return {
            type: 'visual_example',
            title: material.title || 'Example',
            content: formatText(material.content || 'Consider this example...'),
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
          content: formatText(material.content || 'Key concept to remember'),
          explanation: formatText(material.explanation || ''),
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