import { connectDB } from '@/lib/mongodb';
import { UploadedFile } from '@/lib/models/UploadedFile';
import { getTokenFromRequest, verifyToken } from '@/lib/auth';
import { generatePresignedGetUrl } from '@/lib/r2';
import { NextRequest, NextResponse } from 'next/server';

/**
 * GET /api/files/:fileId/download
 * Get a presigned URL to download file from R2
 */
export async function GET(
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

    // Generate presigned GET URL
    const downloadUrl = await generatePresignedGetUrl(file.bucket, file.key);

    return NextResponse.json({
      downloadUrl,
      originalName: file.originalName,
      mimeType: file.mimeType,
    });
  } catch (error) {
    console.error('Download error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
