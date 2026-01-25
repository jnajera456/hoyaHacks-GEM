import { connectDB } from '@/lib/mongodb';
import { Deck } from '@/lib/models/Deck';
import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

function verifyToken(token: string) {
  try {
    return jwt.verify(token, JWT_SECRET) as any;
  } catch (error) {
    return null;
  }
}

export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    const token = authHeader?.split(' ')[1];

    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const decoded = verifyToken(token);
    if (!decoded) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    await connectDB();
    const decks = await Deck.find({ userId: decoded.id });

    return NextResponse.json(decks);
  } catch (error) {
    console.error('Get decks error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    const token = authHeader?.split(' ')[1];

    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const decoded = verifyToken(token);
    if (!decoded) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    const body = await request.json();
    await connectDB();

    const deck = new Deck({
      id: `deck_${Date.now()}`,
      userId: decoded.id,
      ...body,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    await deck.save();

    return NextResponse.json(deck, { status: 201 });
  } catch (error) {
    console.error('Create deck error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
