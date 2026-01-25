import { connectDB } from '@/lib/mongodb';
import { GeneratedContent } from '@/lib/models/GeneratedContent';
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
 * GET /api/topics/[id]/generated - List all generated content for a topic
 * Returns: Array of generated content (id, contentType, aiModel, status, createdAt)
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

    // Verify topic exists and belongs to user
    const topic = await Topic.findOne({
      _id: id,
      userId: decoded.userId,
    });

    if (!topic) {
      return NextResponse.json(
        { error: 'Topic not found' },
        { status: 404 }
      );
    }

    const generatedContent = await GeneratedContent.find({
      topicId: id,
      userId: decoded.userId, // Double-check user owns this content
    })
      .sort({ createdAt: -1 })
      .lean();

    return NextResponse.json({
      generatedContent: generatedContent.map(content => ({
        id: content._id.toString(),
        contentType: content.contentType,
        aiModel: content.aiModel,
        status: content.status,
        contentPath: content.contentPath,
        errorMessage: content.errorMessage,
        createdAt: content.createdAt,
      })),
    });
  } catch (error) {
    console.error('Get generated content error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

/**
 * POST /api/topics/[id]/generated - Create generated content record
 * Body: {
 *   contentType: 'short-form-video' | 'summary' | 'flashcards' | 'quiz' | 'study-guide' | 'artifact',
 *   aiModel: 'gemini' | 'chatgpt' | 'claude' | 'other',
 *   contentPath?: string,
 *   status?: 'pending' | 'generating' | 'completed' | 'failed',
 *   generationMetadata?: { prompt, parameters, executionTimeMs, tokensUsed, modelVersion },
 *   contentMetadata?: { duration, wordCount, itemCount, sourceFileIds }
 * }
 * Returns: Created generated content record
 */
export async function POST(
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

    const {
      contentType,
      aiModel,
      contentPath,
      status,
      generationMetadata,
      contentMetadata,
    } = await request.json();

    // Validate required fields
    if (!contentType || !aiModel) {
      return NextResponse.json(
        { error: 'contentType and aiModel are required' },
        { status: 400 }
      );
    }

    await connectDB();

    // Verify topic exists and belongs to user
    const topic = await Topic.findOne({
      _id: id,
      userId: decoded.userId,
    });

    if (!topic) {
      return NextResponse.json(
        { error: 'Topic not found' },
        { status: 404 }
      );
    }

    // Create generated content record
    const content = new GeneratedContent({
      userId: decoded.userId,
      topicId: id,
      contentType,
      aiModel,
      contentPath: contentPath || undefined,
      status: status || 'pending',
      generationMetadata: generationMetadata || {},
      contentMetadata: contentMetadata || {},
    });

    await content.save();

    return NextResponse.json(
      {
        generatedContent: {
          id: content._id.toString(),
          contentType: content.contentType,
          aiModel: content.aiModel,
          status: content.status,
          contentPath: content.contentPath,
          createdAt: content.createdAt,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Create generated content error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
