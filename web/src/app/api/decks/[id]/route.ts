import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import { GeneratedDeck } from '@/lib/models/GeneratedDeck';
import { getTokenFromRequest, verifyToken } from '@/lib/auth';

export async function GET(
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
    const doc = await GeneratedDeck.findOne({ _id: id, userId: decoded.userId }).lean();
    if (!doc) return NextResponse.json({ error: 'Not found' }, { status: 404 });

    return NextResponse.json({
      id: doc._id.toString(),
      deckId: doc.deckId,
      title: doc.title,
      createdAt: doc.createdAt,
      deck: doc.deck,
    });
  } catch (error) {
    console.error('Get deck error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(
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
    const res = await GeneratedDeck.deleteOne({ _id: id, userId: decoded.userId });
    if (res.deletedCount === 0) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Delete deck error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
