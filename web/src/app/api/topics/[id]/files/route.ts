import { connectDB } from '@/lib/mongodb';
import { UploadedFile } from '@/lib/models/UploadedFile';
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
 * GET /api/topics/[id]/files - List all uploaded files for a topic
 * Returns: Array of file metadata (id, filename, fileType, size, createdAt)
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

    const files = await UploadedFile.find({
      topicId: id,
      userId: decoded.userId, // Double-check user owns these files
    })
      .sort({ createdAt: -1 })
      .lean();

    return NextResponse.json({
      files: files.map(file => ({
        id: file._id.toString(),
        filename: file.filename,
        originalName: file.originalName,
        fileType: file.fileType,
        mimeType: file.mimeType,
        size: file.size,
        createdAt: file.createdAt,
      })),
    });
  } catch (error) {
    console.error('Get topic files error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

/**
 * POST /api/topics/[id]/files - Create file metadata entry (file storage handled separately)
 * Body: {
 *   originalName: string,
 *   filename: string,
 *   fileType: 'pdf' | 'txt' | 'video' | 'image' | 'document' | 'other',
 *   mimeType: string,
 *   storagePath: string,
 *   size: number,
 *   metadata?: { pageCount?, duration?, width?, height?, textExtract? }
 * }
 * Returns: Created file metadata
 *
 * Note: Actual file upload happens via separate file upload service
 * This endpoint only creates the metadata record for tracking
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
      originalName,
      filename,
      fileType,
      mimeType,
      storagePath,
      size,
      metadata,
    } = await request.json();

    // Validate required fields
    if (!originalName || !filename || !fileType || !storagePath || !size) {
      return NextResponse.json(
        { error: 'Missing required file metadata fields' },
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

    // Create file metadata record
    const uploadedFile = new UploadedFile({
      userId: decoded.userId,
      topicId: id,
      originalName,
      filename,
      fileType,
      mimeType,
      storagePath,
      size,
      metadata: metadata || {},
    });

    await uploadedFile.save();

    return NextResponse.json(
      {
        file: {
          id: uploadedFile._id.toString(),
          filename: uploadedFile.filename,
          originalName: uploadedFile.originalName,
          fileType: uploadedFile.fileType,
          mimeType: uploadedFile.mimeType,
          size: uploadedFile.size,
          storagePath: uploadedFile.storagePath,
          createdAt: uploadedFile.createdAt,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Create file metadata error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
