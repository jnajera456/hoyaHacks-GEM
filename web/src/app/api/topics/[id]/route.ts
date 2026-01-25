import { connectDB } from '@/lib/mongodb';
import { Topic } from '@/lib/models/Topic';
import { UploadedFile } from '@/lib/models/UploadedFile';
import { getTokenFromRequest, verifyToken } from '@/lib/auth';
import { deleteFromR2 } from '@/lib/r2';
import { NextRequest, NextResponse } from 'next/server';

/**
 * GET /api/topics/:id
 * Get single topic (verify user owns it)
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

    const topic = await Topic.findOne({
      _id: id,
      userId: decoded.userId,
    });

    if (!topic) {
      return NextResponse.json({ error: 'Topic not found' }, { status: 404 });
    }

    console.log(`Retrieved topic: ${id}`);

    return NextResponse.json({ topic });
  } catch (error) {
    console.error('Get topic error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

/**
 * PATCH /api/topics/:id
 * Update topic (verify user owns it)
 */
export async function PATCH(
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

    const { title, description } = await request.json();

    await connectDB();

    const topic = await Topic.findOne({
      _id: id,
      userId: decoded.userId,
    });

    if (!topic) {
      return NextResponse.json({ error: 'Topic not found' }, { status: 404 });
    }

    if (title !== undefined) {
      topic.title = title;
    }

    if (description !== undefined) {
      topic.description = description;
    }

    await topic.save();

    console.log(`Updated topic: ${id}`);

    return NextResponse.json({ topic });
  } catch (error) {
    console.error('Update topic error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

/**
 * DELETE /api/topics/:id
 * Delete topic and all associated files from R2 and MongoDB
 */
export async function DELETE(
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

    const topic = await Topic.findOne({
      _id: id,
      userId: decoded.userId,
    });

    if (!topic) {
      return NextResponse.json({ error: 'Topic not found' }, { status: 404 });
    }

    // Find all files for this topic
    const files = await UploadedFile.find({
      topicId: id,
      userId: decoded.userId,
    });

    // Delete all files from R2 (best-effort)
    for (const file of files) {
      try {
        await deleteFromR2(file.bucket, file.key);
      } catch (err) {
        console.error(`Failed to delete file from R2: ${file.key}`, err);
        // Continue deleting others
      }
    }

    // Delete all file metadata from MongoDB
    await UploadedFile.deleteMany({
      topicId: id,
      userId: decoded.userId,
    });

    // Delete topic
    await Topic.deleteOne({ _id: id });

    console.log(`Deleted topic: ${id} and ${files.length} associated files`);

    return NextResponse.json({ message: 'Topic deleted' });
  } catch (error) {
    console.error('Delete topic error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
