import { NextResponse } from "next/server";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import crypto from "crypto";

const s3 = new S3Client({
  region: "auto",
  endpoint: process.env.R2_ENDPOINT,
  credentials: {
    accessKeyId: (process.env.R2_ACCESS_KEY_ID || "").trim(),
    secretAccessKey: (process.env.R2_SECRET_ACCESS_KEY || "").trim(),
  },

  // IMPORTANT: disable new default S3 integrity/checksum behavior
  // that can break non-AWS S3 backends like R2
  requestChecksumCalculation: "WHEN_REQUIRED",
  responseChecksumValidation: "WHEN_REQUIRED",
});

function sanitize(name: string) {
  return name.replace(/[^a-zA-Z0-9._-]/g, "_");
}

export async function POST(req: Request) {
  try {
    const { topicId, originalName, mimeType } = await req.json();

    if (!topicId || !originalName || !mimeType) {
      return NextResponse.json(
        { error: "topicId, originalName, mimeType required" },
        { status: 400 }
      );
    }

    const id = crypto.randomUUID();
    const safeName = sanitize(originalName);
    const key = `topics/${topicId}/${id}-${safeName}`;

    const command = new PutObjectCommand({
      Bucket: process.env.R2_BUCKET,
      Key: key,
      ContentType: mimeType,
    });

    const uploadUrl = await getSignedUrl(s3, command, {
      expiresIn: 60 * 5, // 5 minutes
    });

    return NextResponse.json({
      uploadUrl,
      storagePath: `r2://${process.env.R2_BUCKET}/${key}`,
      filename: `${id}-${safeName}`,
      key,
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: err?.message ?? "Presign failed" },
      { status: 500 }
    );
  }
}
