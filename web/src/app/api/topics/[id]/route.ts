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
 * GET /api/topics/[id] - Get a specific topic
 * Returns: Topic details
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
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

    const topic = await Topic.findOne({
      _id: id,
      userId: decoded.userId, // Ensure user owns this topic
    }).lean();

    if (!topic) {
      return NextResponse.json(
        { error: 'Topic not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      topic: {
        id: topic._id.toString(),
        title: topic.title,
        description: topic.description,
        subject: topic.subject,
        tags: topic.tags,
        createdAt: topic.createdAt,
        updatedAt: topic.updatedAt,
      },
    });
  } catch (error) {
    console.error('Get topic error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

/**
 * PUT /api/topics/[id] - Update a topic
 * Body: { title?, description?, subject?, tags? }
 * Returns: Updated topic
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
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

    const body = await request.json();
    await connectDB();

    const updateData: any = {};
    if (body.title !== undefined) updateData.title = body.title;
    if (body.description !== undefined) updateData.description = body.description;
    if (body.subject !== undefined) updateData.subject = body.subject;
    if (body.tags !== undefined) updateData.tags = body.tags;
    updateData.updatedAt = new Date();

    const topic = await Topic.findOneAndUpdate(
      {
        _id: id,
        userId: decoded.userId, // Ensure user owns this topic
      },
      updateData,
      { new: true }
    ).lean();

    if (!topic) {
      return NextResponse.json(
        { error: 'Topic not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      topic: {
        id: topic._id.toString(),
        title: topic.title,
        description: topic.description,
        subject: topic.subject,
        tags: topic.tags,
        createdAt: topic.createdAt,
        updatedAt: topic.updatedAt,
      },
    });
  } catch (error) {
    console.error('Update topic error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

/**
 * DELETE /api/topics/[id] - Delete a topic
 * Returns: Success confirmation
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
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

    const topic = await Topic.findOneAndDelete({
      _id: id,
      userId: decoded.userId, // Ensure user owns this topic
    });

    if (!topic) {
      return NextResponse.json(
        { error: 'Topic not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      message: 'Topic deleted successfully',
    });
  } catch (error) {
    console.error('Delete topic error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
