import { connectDB } from '@/lib/mongodb';
import { UploadedFile } from '@/lib/models/UploadedFile';
import { getTokenFromRequest, verifyToken } from '@/lib/auth';
import { deleteFromR2 } from '@/lib/r2';
import { NextRequest, NextResponse } from 'next/server';

/**
 * DELETE /api/files/:fileId
 * Delete file from R2 and metadata from MongoDB
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ fileId: string }> }
) {
  try {
    const { fileId } = await params;
    const token = getTokenFromRequest(request);

    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const decoded = verifyToken(token);

    if (!decoded) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    await connectDB();

    const file = await UploadedFile.findOne({
      _id: fileId,
      userId: decoded.userId,
    });

    if (!file) {
      return NextResponse.json({ error: 'File not found' }, { status: 404 });
    }

    // Delete from R2 (best-effort)
    await deleteFromR2(file.bucket, file.key);

    // Delete metadata from MongoDB
    await UploadedFile.deleteOne({ _id: fileId });

    console.log(`Deleted file ${file.originalName} and metadata`);

    return NextResponse.json({ message: 'File deleted' });
  } catch (error) {
    console.error('Delete file error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
