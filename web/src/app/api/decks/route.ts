import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import { GeneratedDeck } from '@/lib/models/GeneratedDeck';
import { getTokenFromRequest, verifyToken } from '@/lib/auth';
import { autoBootstrap } from '@/lib/autoBootstrap';

/**
 * GET /api/decks - List generated decks for the authenticated user
 */
export async function GET(request: NextRequest) {
  try {
    const token = getTokenFromRequest(request);
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const decoded = verifyToken(token);
    if (!decoded) return NextResponse.json({ error: 'Invalid token' }, { status: 401 });

    await connectDB();
    await autoBootstrap();
    // Ensure collection + indexes exist (idempotent)
    try { await GeneratedDeck.createCollection(); } catch {}
    try { await GeneratedDeck.syncIndexes(); } catch {}
    const decks = await GeneratedDeck.find({ userId: decoded.userId })
      .sort({ createdAt: -1 })
      .lean();

    return NextResponse.json({
      decks: decks.map((d) => ({
        id: d._id.toString(),
        deckId: d.deckId,
        title: d.title,
        createdAt: d.createdAt,
        deck: d.deck,
      })),
    });
  } catch (error) {
    console.error('List decks error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

