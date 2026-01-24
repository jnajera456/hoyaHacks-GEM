import mongoose from "mongoose";

// Adjust these imports if your paths/exports differ
import { User } from "../src/lib/models/User";
import { Topic } from "../src/lib/models/Topic";
import { UploadedFile } from "../src/lib/models/UploadedFile";
import { GeneratedContent } from "../src/lib/models/GeneratedContent";

import "dotenv/config";

const MONGODB_URI = process.env.MONGODB_URI;

function ensureIdIfNeeded(model: any, doc: any) {
  // If schema disables _id, Mongoose won't generate it; we provide one.
  const hasIdPath = Boolean(model?.schema?.path("_idHoyaHacks_Database"));
  if (!hasIdPath && !doc._id) {
    doc._id = new mongoose.Types.ObjectId();
  }
  return doc;
}

async function run() {
  if (!MONGODB_URI || MONGODB_URI.includes("USERNAME") || MONGODB_URI.includes("PASSWORD")) {
    throw new Error("Set MONGODB_URI in the script (or switch back to env vars).");
  }

  console.log("Connecting to MongoDB...");
  await mongoose.connect(MONGODB_URI);
  console.log("Connected");

  // Use unique values so re-running doesn’t fail on unique email constraints
  const runId = Date.now();
  const email = `testuser_${runId}@example.com`;

  // 1) Create user
  const userDoc = ensureIdIfNeeded(User, {
    email,
    name: "Test User",
    password: "test-password"
  });

  const user = await User.create(userDoc);
  const userId = user._id?.toString?.() ?? String((user as any)._id);
  console.log("User created:", { userId, email: user.email });

  // 2) Create topic
  const topicDoc = ensureIdIfNeeded(Topic, {
    userId: user._id,
    title: `Test Topic ${runId}`,
    description: "Topic created by test script",
    subject: "Demo",
    tags: ["test", "script"]
  });

  const topic = await Topic.create(topicDoc);
  const topicId = topic._id?.toString?.() ?? String((topic as any)._id);
  console.log("Topic created:", { topicId, title: topic.title });

  // 3) Create uploaded file metadata
  const fileDoc = ensureIdIfNeeded(UploadedFile, {
    userId: user._id,
    topicId: topic._id,
    originalName: "Notes.pdf",
    filename: `notes-${runId}.pdf`,
    fileType: "pdf",
    mimeType: "application/pdf",
    storagePath: `s3://demo-bucket/topics/${topicId}/notes-${runId}.pdf`,
    size: 123456,
    metadata: {
      pageCount: 3,
      duration: null,
      width: null,
      height: null,
      textExtract: "Test extract"
    }
  });

  const uploadedFile = await UploadedFile.create(fileDoc);
  const fileId = uploadedFile._id?.toString?.() ?? String((uploadedFile as any)._id);
  console.log("UploadedFile created:", { fileId, filename: uploadedFile.filename });

  // 4) Create generated content metadata
  const genDoc = ensureIdIfNeeded(GeneratedContent, {
    userId: user._id,
    topicId: topic._id,
    contentType: "short-form-video",
    aiModel: "gemini",
    status: "completed",
    contentPath: `s3://demo-bucket/generated/${runId}.mp4`,
    generationMetadata: {
      prompt: "Create a 30-second video from the notes",
      parameters: { temperature: 0.7, maxTokens: 500 },
      executionTimeMs: 2500,
      tokensUsed: 200,
      modelVersion: "demo"
    },
    contentMetadata: {
      duration: 30,
      wordCount: null,
      itemCount: null,
      sourceFileIds: [uploadedFile._id]
    },
    userFeedback: {
      rating: 5,
      notes: "Looks good"
    }
  });

  const generated = await GeneratedContent.create(genDoc);
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
