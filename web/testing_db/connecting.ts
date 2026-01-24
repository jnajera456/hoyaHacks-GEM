import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

import bcrypt from "bcryptjs";
import mongoose from "mongoose";

import { User } from "../src/lib/models/User";
import { Topic } from "../src/lib/models/Topic";
import { UploadedFile } from "../src/lib/models/UploadedFile";
import { GeneratedContent } from "../src/lib/models/GeneratedContent";

const { MONGODB_URI, R2_BUCKET } = process.env;

async function run() {
  if (!MONGODB_URI) {
    throw new Error("Set MONGODB_URI in .env.local before running this script.");
  }

  console.log("Connecting to MongoDB...");
  await mongoose.connect(MONGODB_URI);
  console.log("Connected");

  // Use unique values so re-running doesn’t fail on unique email constraints
  const runId = Date.now();
  const email = `testuser_${runId}@example.com`;
  const bucket = R2_BUCKET || "demo-bucket";

  // 1) Create user
  const passwordHash = await bcrypt.hash("test-password", 10);
  const user = await User.create({
    email,
    name: "Test User",
    passwordHash,
  });
  const userId = user._id?.toString?.() ?? String((user as any)._id);
  console.log("User created:", { userId, email: user.email });

  // 2) Create topic
  const topic = await Topic.create({
    userId: user._id,
    title: `Test Topic ${runId}`,
    description: "Topic created by test script",
  });
  const topicId = topic._id?.toString?.() ?? String((topic as any)._id);
  console.log("Topic created:", { topicId, title: topic.title });

  // 3) Create uploaded file metadata
  const key = `topics/${topicId}/notes-${runId}.pdf`;
  const storagePath = `r2://${bucket}/${key}`;

  const uploadedFile = await UploadedFile.create({
    userId: user._id,
    topicId: topic._id,
    originalName: "Notes.pdf",
    filename: `notes-${runId}.pdf`,
    mimeType: "application/pdf",
    size: 123456,
    storageProvider: "r2",
    bucket,
    key,
    storagePath,
  });
  const fileId = uploadedFile._id?.toString?.() ?? String((uploadedFile as any)._id);
  console.log("UploadedFile created:", { fileId, filename: uploadedFile.filename });

  // 4) Create generated content metadata
  const generated = await GeneratedContent.create({
    userId: user._id,
    topicId: topic._id,
    type: "video",
    title: "Sample generated video",
    status: "completed",
    contentPath: `r2://${bucket}/generated/${runId}.mp4`,
    storageProvider: "r2",
  });
  const genId = generated._id?.toString?.() ?? String((generated as any)._id);
  console.log("GeneratedContent created:", { genId, status: generated.status });

  // 5) Read back and verify relationship queries
  const topics = await Topic.find({ userId: user._id }).sort({ createdAt: -1 }).lean();
  const files = await UploadedFile.find({ userId: user._id, topicId: topic._id }).lean();
  const outputs = await GeneratedContent.find({ userId: user._id, topicId: topic._id }).lean();

  console.log("Readback counts:", {
    topics: topics.length,
    files: files.length,
    generated: outputs.length
  });

  console.log("Success: DB write + read verified");

  await mongoose.disconnect();
  console.log("Disconnected");
}

run().catch(async (err) => {
  console.error("Error running script:", err);
  try {
    await mongoose.disconnect();
  } catch {}
  process.exit(1);
});
