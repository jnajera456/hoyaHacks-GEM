import { connectDB } from '@/lib/mongodb';
import { Topic } from '@/lib/models/Topic';
import { getTokenFromRequest, verifyToken } from '@/lib/auth';
import {
  generatePresignedPutUrl,
  generateR2Filename,
  buildStoragePath,
} from '@/lib/r2';
import { NextRequest, NextResponse } from 'next/server';

/**
 * POST /api/uploads/presign
 * Generate a presigned PUT URL for file upload to R2
 * Body: { topicId, originalName, mimeType, size }
 * Returns: { uploadUrl, key, storagePath, filename }
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

    const { topicId, originalName, mimeType, size } = await request.json();

    if (!topicId || !originalName || !mimeType || size === undefined) {
      return NextResponse.json(
        { error: 'Missing required fields: topicId, originalName, mimeType, size' },
        { status: 400 }
      );
    }

    // Validate topic belongs to user
    await connectDB();

    const topic = await Topic.findOne({
      _id: topicId,
      userId: decoded.userId,
    });

    if (!topic) {
      return NextResponse.json(
        { error: 'Topic not found' },
        { status: 404 }
      );
    }

    const bucket = process.env.R2_BUCKET;
    if (!bucket) {
      return NextResponse.json(
        { error: 'R2 bucket not configured' },
        { status: 500 }
      );
    }

    // Generate R2 filename and presigned URL
    const key = generateR2Filename(topicId, originalName);
    const uploadUrl = await generatePresignedPutUrl(bucket, key, mimeType);
    const storagePath = buildStoragePath(bucket, key);

    console.log(`Generated presigned PUT URL for ${originalName} -> ${key}`);

    return NextResponse.json(
      {
        uploadUrl,
        bucket,
        key,
        storagePath,
        filename: key.split('/').pop(),
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Presign error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
