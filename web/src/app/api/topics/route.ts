import { connectDB } from '@/lib/mongodb';
import { Topic } from '@/lib/models/Topic';
import { getTokenFromRequest, verifyToken } from '@/lib/auth';
import { NextRequest, NextResponse } from 'next/server';

/**
 * POST /api/topics
 * Create new topic for authenticated user
 */
export async function POST(request: NextRequest) {
  try {
    const token = getTokenFromRequest(request);

    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const decoded = verifyToken(token);

    if (!decoded) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    const { title, description } = await request.json();

    if (!title) {
      return NextResponse.json({ error: 'Title is required' }, { status: 400 });
    }

    await connectDB();

    const topic = new Topic({
      userId: decoded.userId,
      title,
      description: description || '',
    });

    await topic.save();

    console.log(`Created topic: ${topic._id}`);

    return NextResponse.json({ topic }, { status: 201 });
  } catch (error) {
    console.error('Create topic error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

/**
 * GET /api/topics
 * List all topics for authenticated user
 */
export async function GET(request: NextRequest) {
  try {
    const token = getTokenFromRequest(request);

    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const decoded = verifyToken(token);

    if (!decoded) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    await connectDB();

    const topics = await Topic.find({ userId: decoded.userId }).sort({
      createdAt: -1,
    });

    console.log(`Retrieved ${topics.length} topics for user ${decoded.userId}`);

    return NextResponse.json({ topics });
  } catch (error) {
    console.error('Get topics error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
