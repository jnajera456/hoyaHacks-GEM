import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";

async function main() {
  const bucket = process.env.R2_BUCKET!;
  const endpoint = process.env.R2_ENDPOINT!;
  const accessKeyId = (process.env.R2_ACCESS_KEY_ID || "").trim();
  const secretAccessKey = (process.env.R2_SECRET_ACCESS_KEY || "").trim();

  console.log("R2 sanity:", {
    bucket,
    endpoint,
    accessKeyPrefix: accessKeyId.slice(0, 6),
    hasSecret: secretAccessKey.length > 0,
  });

  const s3 = new S3Client({
    region: "auto",
    endpoint,
    credentials: { accessKeyId, secretAccessKey },
  });

  const key = `debug/${Date.now()}-hello.txt`;

  await s3.send(
    new PutObjectCommand({
      Bucket: bucket,
      Key: key,
      Body: Buffer.from("hello from direct_put\n"),
      ContentType: "text/plain",
    })
  );

  console.log("✅ Direct upload OK:", { key });
}

main().catch((e) => {
  console.error("❌ Direct upload failed:", e);
  process.exit(1);
});
