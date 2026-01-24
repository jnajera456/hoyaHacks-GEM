import { connectDB } from '@/lib/mongodb';
import { UploadedFile } from '@/lib/models/UploadedFile';
import { Topic } from '@/lib/models/Topic';
import { getTokenFromRequest, verifyToken } from '@/lib/auth';
import { buildStoragePath } from '@/lib/r2';
import { NextRequest, NextResponse } from 'next/server';

/**
 * GET /api/topics/:id/files
 * List all files for a topic (verify user owns topic)
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const token = getTokenFromRequest(request);

    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const decoded = verifyToken(token);

    if (!decoded) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    await connectDB();

    // Verify user owns topic
    const topic = await Topic.findOne({
      _id: id,
      userId: decoded.userId,
    });

    if (!topic) {
      return NextResponse.json({ error: 'Topic not found' }, { status: 404 });
    }

    const files = await UploadedFile.find({
      topicId: id,
      userId: decoded.userId,
    }).sort({ createdAt: -1 });

    console.log(`Retrieved ${files.length} files for topic ${id}`);

    return NextResponse.json({ files });
  } catch (error) {
    console.error('Get topic files error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

/**
 * POST /api/topics/:id/files
 * Create file metadata entry after R2 upload
 * Body: { originalName, filename, mimeType, size, bucket, key, storagePath }
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const token = getTokenFromRequest(request);

    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const decoded = verifyToken(token);

    if (!decoded) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    const {
      originalName,
      filename,
      mimeType,
      size,
      bucket,
      key,
      storagePath,
    } = await request.json();

    if (!originalName || !filename || !mimeType || size === undefined || !key) {
      return NextResponse.json(
        { error: 'Missing required file metadata fields' },
        { status: 400 }
      );
    }

    await connectDB();

    // Verify user owns topic
    const topic = await Topic.findOne({
      _id: id,
      userId: decoded.userId,
    });

    if (!topic) {
      return NextResponse.json({ error: 'Topic not found' }, { status: 404 });
    }

    const envBucket = process.env.R2_BUCKET;
    const resolvedBucket = bucket || envBucket;
    if (!resolvedBucket) {
      return NextResponse.json(
        { error: 'R2 bucket not configured' },
        { status: 500 }
      );
    }

    const resolvedStoragePath = storagePath || buildStoragePath(resolvedBucket, key);

    // Create file metadata record
    const uploadedFile = new UploadedFile({
      userId: decoded.userId,
      topicId: id,
      originalName,
      filename,
      mimeType,
      size,
      storageProvider: 'r2',
      bucket: resolvedBucket,
      key,
      storagePath: resolvedStoragePath,
    });

    await uploadedFile.save();

    console.log(`Created file metadata: ${uploadedFile._id}`);

    return NextResponse.json({ file: uploadedFile }, { status: 201 });
  } catch (error) {
    console.error('Create file metadata error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
