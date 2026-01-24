import { connectDB } from '@/lib/mongodb';
import { Topic } from '@/lib/models/Topic';
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

/**
 * GET /api/topics - List all topics for authenticated user
 * Returns: Array of topics (id, title, description, subject, tags, createdAt)
 */
export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    const token = authHeader?.split(' ')[1];

    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const decoded = verifyToken(token);
    if (!decoded || !decoded.userId) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    await connectDB();

    const topics = await Topic.find({ userId: decoded.userId })
      .sort({ createdAt: -1 })
      .lean();

    return NextResponse.json({
      topics: topics.map(topic => ({
        id: topic._id.toString(),
        title: topic.title,
        description: topic.description,
        subject: topic.subject,
        tags: topic.tags,
        createdAt: topic.createdAt,
      })),
    });
  } catch (error) {
    console.error('Get topics error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

/**
 * POST /api/topics - Create a new topic
 * Body: { title, description?, subject?, tags? }
 * Returns: Created topic
 */
export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    const token = authHeader?.split(' ')[1];

    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const decoded = verifyToken(token);
    if (!decoded || !decoded.userId) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    const { title, description, subject, tags } = await request.json();

    if (!title) {
      return NextResponse.json(
        { error: 'Title is required' },
        { status: 400 }
      );
    }

    await connectDB();

    const topic = new Topic({
      userId: decoded.userId,
      title,
      description: description || '',
      subject: subject || '',
      tags: tags || [],
    });

    await topic.save();

    return NextResponse.json(
      {
        topic: {
          id: topic._id.toString(),
          title: topic.title,
          description: topic.description,
          subject: topic.subject,
          tags: topic.tags,
          createdAt: topic.createdAt,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Create topic error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
