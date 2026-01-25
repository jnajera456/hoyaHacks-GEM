import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import { GeneratedDeck } from "@/lib/models/GeneratedDeck";
import { getTokenFromRequest, verifyToken } from "@/lib/auth";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');
const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

/**
 * POST /api/decks/:id/augment
 * Add new materials to an existing deck based on new content
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    const token = getTokenFromRequest(request);
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const decoded = verifyToken(token);
    if (!decoded) return NextResponse.json({ error: 'Invalid token' }, { status: 401 });

    await connectDB();
    try { await GeneratedDeck.createCollection(); } catch {}
    try { await GeneratedDeck.syncIndexes(); } catch {}

    // Get existing deck
    const existingDoc = await GeneratedDeck.findOne({ _id: id, userId: decoded.userId });
    if (!existingDoc) {
      return NextResponse.json({ error: 'Deck not found' }, { status: 404 });
    }

    const existingDeck = existingDoc.deck;
    const { text, fileName, fileType } = await request.json();

    if (!text) {
      return NextResponse.json({ error: 'Please provide content to add' }, { status: 400 });
    }

    console.log("📚 Augmenting existing deck:", {
      deckId: id,
      currentMaterials: existingDeck.materials.length,
      newContentLength: text.length
    });

    // Create summary of existing deck for context
    const existingMaterialsSummary = existingDeck.materials
      .slice(0, 10)
      .map((m: any) => {
        if (m.type === 'flashcard') return `Flashcard: ${m.content?.split('?')[0]}`;
        if (m.type === 'multiple_choice') return `Quiz: ${m.question}`;
        if (m.type === 'concept') return `Concept: ${m.content?.substring(0, 50)}...`;
        if (m.type === 'visual_example') return `Example: ${m.title}`;
        if (m.type === 'match_game') return `Match Game: ${m.title}`;
        return 'Material';
      })
      .join('\n');

    const prompt = `You are a Master Educational Architect. A student already has a study deck and wants to add new materials to complement it.

EXISTING DECK (first ${Math.min(10, existingDeck.materials.length)} of ${existingDeck.materials.length} materials):
${existingMaterialsSummary}

NEW CONTENT TO ADD:
${text.substring(0, 2000)}

GOAL: Generate 5-8 NEW, COMPLEMENTARY study materials that extend understanding without duplicating existing ones.

Use these 5 types: MULTIPLE_CHOICE, FLASHCARD, CONCEPT, VISUAL_EXAMPLE, MATCH_GAME

OUTPUT FORMAT: Return ONLY a valid JSON array. Each item must follow this schema:

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
- Tone: High-energy, witty, relatable.
- Variety: Mix all types; no single type should dominate.
- Match games: Exactly 5 pairs.
- JSON: ONLY double quotes; escape inner quotes with \\". NO text outside JSON array.
- CRITICAL: Include headings, bullets, and paragraph breaks in explanations and content.
`;

    console.log("🤖 Generating complementary materials...");

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const geminiText = response.text();

    let newMaterials = [];
    try {
      let jsonText = geminiText.trim()
        .replace(/```json\s*/g, "")
        .replace(/```javascript\s*/g, "")
        .replace(/```\s*/g, "")
        .trim();

      const parsed = JSON.parse(jsonText);
      newMaterials = Array.isArray(parsed) ? parsed : [parsed];

      const formatText = (text: any) => {
        if (!text || typeof text !== 'string') return '';
        let t = text.replace(/\r\n/g, "\n").replace(/\t/g, ' ').replace(/[ \u00A0]+$/gm, '');
        if (!/\n/.test(t) && t.length > 240) {
          t = t
            .split(/(?<=[.!?])\s+/)
            .filter(Boolean)
            .join("\n\n");
        }
        t = t.replace(/\n{3,}/g, "\n\n");
        return t;
      };

      newMaterials = newMaterials.map((material: any, index: number) => {
        const baseId = `material_${Date.now()}_${index}`;

        if (material.type === 'multiple_choice') {
          return {
            type: 'multiple_choice',
            question: material.question || 'Question?',
            options: Array.isArray(material.options) && material.options.length === 4
              ? material.options
              : ['A', 'B', 'C', 'D'],
            correctIndex: typeof material.correctIndex === 'number' ? material.correctIndex : 0,
            explanation: formatText(material.explanation || ''),
            id: material.id || baseId
          };
        }

        if (material.type === 'visual_example') {
          return {
            type: 'visual_example',
            title: material.title || 'Example',
            content: formatText(material.content || ''),
            id: material.id || baseId
          };
        }

        if (material.type === 'match_game') {
          return {
            type: 'match_game',
            title: material.title || 'Match',
            pairs: Array.isArray(material.pairs) && material.pairs.length === 5
              ? material.pairs
              : [{ term: 'Term', definition: 'Definition' }],
            id: material.id || baseId
          };
        }

        if (material.type === 'flashcard') {
          let content = material.content || 'Q?A';
          if (!content.includes('?')) {
            content = `Question?${content}`;
          }
          return {
            type: 'flashcard',
            content,
            id: material.id || baseId
          };
        }

        return {
          type: 'concept',
          content: formatText(material.content || ''),
          explanation: formatText(material.explanation || ''),
          id: material.id || baseId
        };
      });

      console.log(`✅ Generated ${newMaterials.length} new materials`);
    } catch (parseError: any) {
      console.error("Parse error:", parseError.message);
      return NextResponse.json(
        { error: 'Failed to parse generated materials' },
        { status: 500 }
      );
    }

    const mergedMaterials = [...existingDeck.materials, ...newMaterials];

    const updatedDeck = {
      ...existingDeck,
      materials: mergedMaterials,
      stats: {
        totalMaterials: mergedMaterials.length,
        multipleChoice: mergedMaterials.filter((m: any) => m.type === 'multiple_choice').length,
        flashcards: mergedMaterials.filter((m: any) => m.type === 'flashcard').length,
        concepts: mergedMaterials.filter((m: any) => m.type === 'concept').length,
        visualExamples: mergedMaterials.filter((m: any) => m.type === 'visual_example').length,
        games: mergedMaterials.filter((m: any) => m.type === 'match_game').length
      }
    };

    const updatedDoc = await GeneratedDeck.findByIdAndUpdate(
      id,
      { deck: updatedDeck },
      { new: true }
    );

    if (!updatedDoc) {
      return NextResponse.json({ error: 'Failed to update deck' }, { status: 500 });
    }

    console.log(`📚 Deck augmented: ${existingDeck.materials.length} → ${mergedMaterials.length} materials`);

    return NextResponse.json({
      success: true,
      newMaterials,
      deck: updatedDeck,
      stats: updatedDeck.stats,
      message: `Added ${newMaterials.length} materials! Deck now has ${mergedMaterials.length} total.`
    });

  } catch (error: any) {
    console.error("Augment deck error:", error);
    return NextResponse.json(
      { error: error.message || 'Failed to augment deck' },
      { status: 500 }
    );
  }
}
