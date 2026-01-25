import { S3Client, PutObjectCommand, GetObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

// Singleton R2 client
let r2Client: S3Client | null = null;

function getR2Client(): S3Client {
  if (r2Client) return r2Client;

  // Cloudflare R2 wants the account-level endpoint (https://<ACCOUNT_ID>.r2.cloudflarestorage.com)
  const endpoint = process.env.R2_ENDPOINT?.replace(/\/$/, '');
  const accessKeyId = process.env.R2_ACCESS_KEY_ID;
  const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY;

  if (!endpoint || !accessKeyId || !secretAccessKey) {
    throw new Error('Missing R2 environment variables: R2_ENDPOINT, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY');
  }

  r2Client = new S3Client({
    region: 'auto',
    endpoint,
    forcePathStyle: true, // R2 is path-style friendly and this avoids signature mismatches
    credentials: {
      accessKeyId,
      secretAccessKey,
    },
  });

  return r2Client;
}

/**
 * Generate a presigned PUT URL for uploading files to R2
 * Allows client to upload directly to R2 bucket
 */
export async function generatePresignedPutUrl(
  bucket: string,
  key: string,
  contentType: string,
  expiresIn: number = 3600 // 1 hour default
): Promise<string> {
  const client = getR2Client();
  const command = new PutObjectCommand({
    Bucket: bucket,
    Key: key,
    ContentType: contentType,
  });

  const url = await getSignedUrl(client, command, { expiresIn });
  return url;
}

/**
 * Generate a presigned GET URL for downloading files from R2
 * Allows client to download from R2 directly
 */
export async function generatePresignedGetUrl(
  bucket: string,
  key: string,
  expiresIn: number = 3600 // 1 hour default
): Promise<string> {
  const client = getR2Client();
  const command = new GetObjectCommand({
    Bucket: bucket,
    Key: key,
  });

  const url = await getSignedUrl(client, command, { expiresIn });
  return url;
}

/**
 * Delete an object from R2 (best-effort)
 */
export async function deleteFromR2(bucket: string, key: string): Promise<boolean> {
  try {
    const client = getR2Client();
    const command = new DeleteObjectCommand({
      Bucket: bucket,
      Key: key,
    });
    await client.send(command);
    return true;
  } catch (error) {
    console.error(`Failed to delete R2 object ${bucket}/${key}:`, error);
    // Best-effort: don't throw, just log
    return false;
  }
}

/**
 * Generate a unique filename for R2 storage
 * Pattern: topics/{topicId}/{timestamp}-{random}.{ext}
 */
export function generateR2Filename(topicId: string, originalName: string): string {
  const ext = originalName.split('.').pop() || 'bin';
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 8);
  return `topics/${topicId}/${timestamp}-${random}.${ext}`;
}

/**
 * Build the storage path in format: r2://bucket/key
 */
export function buildStoragePath(bucket: string, key: string): string {
  return `r2://${bucket}/${key}`;
}

/**
 * Parse storage path (r2://bucket/key) into bucket and key
 */
export function parseStoragePath(storagePath: string): { bucket: string; key: string } | null {
  const match = storagePath.match(/^r2:\/\/([^\/]+)\/(.+)$/);
  if (!match) return null;
  return {
    bucket: match[1],
    key: match[2],
  };
}
