# StudyToks API Reference - Database-First Architecture

## Authentication

### POST /api/auth
Create account or sign in. No offline support, online-only.

**Signup:**
```json
{
  "action": "signup",
  "email": "user@example.com",
  "password": "password123",
  "name": "John Doe"
}
```
Response:
```json
{
  "token": "eyJhbGc...",
  "user": {
    "id": "507f1f77bcf86cd799439011",
    "name": "John Doe",
    "email": "user@example.com"
  }
}
```

**Signin:**
```json
{
  "action": "signin",
  "email": "user@example.com",
  "password": "password123"
}
```
Response: Same as signup

**Note:** Guest login removed. Authenticated users only.

---

## User Profile

### GET /api/users
Get authenticated user profile.

**Headers:**
```
Authorization: Bearer <token>
```

Response:
```json
{
  "id": "507f1f77bcf86cd799439011",
  "name": "John Doe",
  "email": "user@example.com",
  "createdAt": "2024-01-15T10:30:00Z"
}
```

### PUT /api/users
Update authenticated user (name only).

**Headers:**
```
Authorization: Bearer <token>
```

**Body:**
```json
{
  "name": "Jane Doe"
}
```

Response: Updated user object

---

## Topics (User Study Topics)

### GET /api/topics
List all topics for authenticated user (newest first).

**Headers:**
```
Authorization: Bearer <token>
```

Response:
```json
{
  "topics": [
    {
      "id": "507f1f77bcf86cd799439012",
      "title": "Biology Chapter 3",
      "description": "Cell biology and reproduction",
      "subject": "Biology",
      "tags": ["chapter-3", "cells"],
      "createdAt": "2024-01-15T10:30:00Z"
    }
  ]
}
```

### POST /api/topics
Create a new topic.

**Headers:**
```
Authorization: Bearer <token>
Content-Type: application/json
```

**Body:**
```json
{
  "title": "Biology Chapter 3",
  "description": "Cell biology and reproduction",
  "subject": "Biology",
  "tags": ["chapter-3", "cells"]
}
```

Response: Created topic object

### GET /api/topics/[id]
Get specific topic.

**Headers:**
```
Authorization: Bearer <token>
```

Response: Topic object with createdAt and updatedAt

### PUT /api/topics/[id]
Update topic.

**Headers:**
```
Authorization: Bearer <token>
```

**Body:**
```json
{
  "title": "Biology Chapter 3 (Updated)",
  "description": "Updated description",
  "subject": "Biology",
  "tags": ["chapter-3", "cells", "updated"]
}
```

Response: Updated topic object

### DELETE /api/topics/[id]
Delete a topic.

**Headers:**
```
Authorization: Bearer <token>
```

Response:
```json
{
  "message": "Topic deleted successfully"
}
```

---

## Uploaded Files

### GET /api/topics/[id]/files
List all uploaded files for a topic.

**Headers:**
```
Authorization: Bearer <token>
```

Response:
```json
{
  "files": [
    {
      "id": "507f1f77bcf86cd799439013",
      "filename": "notes-20240115.pdf",
      "originalName": "Notes January 15.pdf",
      "fileType": "pdf",
      "mimeType": "application/pdf",
      "size": 2048576,
      "createdAt": "2024-01-15T10:30:00Z"
    }
  ]
}
```

### POST /api/topics/[id]/files
Create file metadata entry (file upload happens separately via cloud storage).

**Headers:**
```
Authorization: Bearer <token>
Content-Type: application/json
```

**Body:**
```json
{
  "originalName": "Notes January 15.pdf",
  "filename": "notes-20240115.pdf",
  "fileType": "pdf",
  "mimeType": "application/pdf",
  "storagePath": "s3://bucket/topics/507f1f77bcf86cd799439012/notes-20240115.pdf",
  "size": 2048576,
  "metadata": {
    "pageCount": 15,
    "duration": null,
    "width": null,
    "height": null,
    "textExtract": "Chapter 3: Cell Biology. Cells are the basic..."
  }
}
```

Response:
```json
{
  "file": {
    "id": "507f1f77bcf86cd799439013",
    "filename": "notes-20240115.pdf",
    "originalName": "Notes January 15.pdf",
    "fileType": "pdf",
    "mimeType": "application/pdf",
    "size": 2048576,
    "storagePath": "s3://bucket/topics/507f1f77bcf86cd799439012/notes-20240115.pdf",
    "createdAt": "2024-01-15T10:30:00Z"
  }
}
```

**Supported file types:** pdf, txt, video, image, document, other

---

## Generated Content (AI-Generated Study Materials)

### GET /api/topics/[id]/generated
List all AI-generated content for a topic.

**Headers:**
```
Authorization: Bearer <token>
```

Response:
```json
{
  "generatedContent": [
    {
      "id": "507f1f77bcf86cd799439014",
      "contentType": "short-form-video",
      "aiModel": "gemini",
      "status": "completed",
      "contentPath": "s3://bucket/generated/507f1f77bcf86cd799439014.mp4",
      "errorMessage": null,
      "createdAt": "2024-01-15T10:35:00Z"
    }
  ]
}
```

### POST /api/topics/[id]/generated
Create AI-generated content record.

**Headers:**
```
Authorization: Bearer <token>
Content-Type: application/json
```

**Body:**
```json
{
  "contentType": "short-form-video",
  "aiModel": "gemini",
  "contentPath": "s3://bucket/generated/507f1f77bcf86cd799439014.mp4",
  "status": "completed",
  "generationMetadata": {
    "prompt": "Create a 30-second video about cell mitosis based on these notes...",
    "parameters": {
      "temperature": 0.7,
      "maxTokens": 2000,
      "otherParams": {}
    },
    "executionTimeMs": 45000,
    "tokensUsed": 1250,
    "modelVersion": "gemini-3-flash-preview"
  },
  "contentMetadata": {
    "duration": 30,
    "wordCount": null,
    "itemCount": null,
    "sourceFileIds": ["507f1f77bcf86cd799439013"]
  }
}
```

Response:
```json
{
  "generatedContent": {
    "id": "507f1f77bcf86cd799439014",
    "contentType": "short-form-video",
    "aiModel": "gemini",
    "status": "completed",
    "contentPath": "s3://bucket/generated/507f1f77bcf86cd799439014.mp4",
    "createdAt": "2024-01-15T10:35:00Z"
  }
}
```

**Supported content types:** short-form-video, summary, flashcards, quiz, study-guide, artifact

**Supported AI models:** gemini, chatgpt, claude, other

**Status values:** pending, generating, completed, failed

---

## Error Responses

All errors follow this format:

```json
{
  "error": "Description of what went wrong"
}
```

**Common status codes:**
- `200 OK`: Successful GET or PUT
- `201 Created`: Successful POST
- `400 Bad Request`: Missing required fields or invalid input
- `401 Unauthorized`: Missing or invalid token
- `404 Not Found`: Topic, file, or content not found
- `500 Internal Server Error`: Server error

---

## JavaScript Client Library

Use the provided `src/lib/api.ts` client:

```typescript
import { authAPI, topicAPI, uploadedFileAPI, generatedContentAPI, userAPI } from '@/lib/api';

// Authentication
const user = await authAPI.signup('user@example.com', 'password', 'John');
const user = await authAPI.signin('user@example.com', 'password');
authAPI.logout();

// User profile
const profile = await userAPI.getProfile();
await userAPI.updateProfile({ name: 'Jane' });

// Topics
const topics = await topicAPI.list();
const topic = await topicAPI.create('Title', 'desc', 'subject', ['tag1']);
await topicAPI.update(topicId, { title: 'New title' });
await topicAPI.delete(topicId);

// Uploaded files
const files = await uploadedFileAPI.listByTopic(topicId);
const file = await uploadedFileAPI.createMetadata(topicId, { 
  originalName, filename, fileType, mimeType, storagePath, size 
});

// Generated content
const content = await generatedContentAPI.listByTopic(topicId);
const generated = await generatedContentAPI.create(topicId, {
  contentType: 'short-form-video',
  aiModel: 'gemini',
  // ... other fields
});
```

---

## Data Model

### User
- `id` (ObjectId)
- `email` (String, unique, lowercase, indexed)
- `name` (String)
- `password` (String, hashed with bcryptjs)
- `createdAt` (Date, indexed)
- `updatedAt` (Date)

### Topic
- `id` (ObjectId)
- `userId` (ObjectId ref to User, indexed)
- `title` (String)
- `description` (String)
- `subject` (String)
- `tags` ([String])
- `createdAt` (Date, indexed)
- `updatedAt` (Date)

### UploadedFile
- `id` (ObjectId)
- `userId` (ObjectId ref to User, indexed)
- `topicId` (ObjectId ref to Topic, indexed)
- `filename` (String)
- `originalName` (String)
- `fileType` (Enum: pdf, txt, video, image, document, other)
- `mimeType` (String)
- `storagePath` (String)
- `size` (Number, bytes)
- `metadata` (Object with optional pageCount, duration, width, height, textExtract)
- `createdAt` (Date, indexed)
- `updatedAt` (Date)

### GeneratedContent
- `id` (ObjectId)
- `userId` (ObjectId ref to User, indexed)
- `topicId` (ObjectId ref to Topic, indexed)
- `contentType` (Enum: short-form-video, summary, flashcards, quiz, study-guide, artifact)
- `aiModel` (Enum: gemini, chatgpt, claude, other)
- `contentPath` (String, optional)
- `status` (Enum: pending, generating, completed, failed)
- `errorMessage` (String, optional)
- `generationMetadata` (Object with prompt, parameters, executionTimeMs, tokensUsed, modelVersion)
- `contentMetadata` (Object with duration, wordCount, itemCount, sourceFileIds)
- `userFeedback` (Object with optional rating 1-5 and notes)
- `createdAt` (Date, indexed)
- `updatedAt` (Date)

---

## Key Features

✅ **Fully authenticated**: All endpoints require Bearer token  
✅ **User scoped**: Users only see their own data  
✅ **Topic scoped**: Files and content isolated by topic  
✅ **Online only**: No offline support, requires MongoDB connectivity  
✅ **Database-first**: Single source of truth is MongoDB  
✅ **AI-ready**: Schemas support tracking without implementation  
✅ **File-storage-ready**: File paths tracked, content stored separately  
✅ **Multi-device**: Consistent data via database reads  

---

## Migration from Old API

| Old | New |
|-----|-----|
| POST /api/auth (guest) | Removed - authenticated only |
| GET/POST /api/decks | GET/POST /api/topics |
| PUT/DELETE /api/decks/[id] | PUT/DELETE /api/topics/[id] |
| GET /api/sessions | GET /api/topics/[id]/generated |
| POST /api/sessions | POST /api/topics/[id]/generated |
| hybridStorage.* | topicAPI, uploadedFileAPI, generatedContentAPI |

---

## Notes for Hackathon

- Passwords stored with bcryptjs hashing (good enough for demo)
- No strong security hardening (can be added later)
- All user-scoped data accessed via userId from JWT token
- Files and generated content must be stored separately (schemas track metadata only)
- Build completes successfully, ready for frontend integration
