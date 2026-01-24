# System Architecture

## Overview

```
┌──────────────────────────────────┐
│      Frontend (Next.js Pages)    │
│   (register, login, dashboard)   │
└──────────────┬───────────────────┘
               │ HTTP REST
               ↓
┌──────────────────────────────────────────────────┐
│  API Routes (14 endpoints)                       │
│  ├─ Auth (register, login, logout, me)          │
│  ├─ Topics CRUD (C/R/U/D operations)            │
│  └─ Files (presign, upload, download, delete)   │
└──────────┬──────────────────────┬────────────────┘
           │                      │
           ↓                      ↓
   ┌───────────────┐    ┌─────────────────────┐
   │ MongoDB Atlas │    │  Cloudflare R2      │
   │               │    │  (S3-compatible)    │
   │ - Users       │    │                     │
   │ - Topics      │    │  - File storage     │
   │ - Files       │    │  - Bucket: topics/* │
   │ - Generated   │    │                     │
   └───────────────┘    └─────────────────────┘

Support Libraries:
- auth.ts    (bcryptjs, JWT, cookies)
- r2.ts      (AWS SDK v3, presigner)
- mongodb.ts (connection pooling)
```

## Authentication Flow

### 1. Registration

```
User → /api/auth/register
         ├─ Extract email, password, name
         ├─ Hash password (bcryptjs)
         ├─ Create User document
         ├─ Generate JWT token
         ├─ Set httpOnly cookie
         └─ Return user profile + 201
```

### 2. Login

```
User → /api/auth/login
         ├─ Extract email, password
         ├─ Find User by email
         ├─ Compare password with hash
         ├─ Generate JWT token
         ├─ Set httpOnly cookie
         └─ Return user profile + 200
```

### 3. Protected Request

```
Client → Route (with cookie)
         ├─ Extract token from cookie
         ├─ Verify JWT signature
         ├─ Decode to get userId
         ├─ Query DB with userId filter
         └─ Return user-scoped data + 200
```

### 4. Logout

```
User → /api/auth/logout
         ├─ Clear httpOnly cookie
         └─ Return success + 200
```

## JWT Token

```typescript
{
  userId: "507f1f77bcf86cd799439011",    // MongoDB ObjectId
  email: "user@example.com",             // User email
  iat: 1706089800,                       // Issued at (unix time)
  exp: 1706694600                        // Expires in 7 days
}
```

**Signed with**: `JWT_SECRET` environment variable

**Stored in**: httpOnly cookie (not accessible to JavaScript)

## File Storage Flow

### 1. Presign (Generate Upload URL)

```
Client → /api/uploads/presign
         ├─ Verify user owns topic
         ├─ Generate R2 filename
         │  Format: topics/{topicId}/{timestamp}-{random}.{ext}
         ├─ Create presigned PUT URL
         │  Expires in 5 minutes
         └─ Return: {uploadUrl, key, storagePath, filename}
```

### 2. Upload (Client → R2)

```
Client PUT to presigned URL
  ├─ File data uploaded directly to R2
  ├─ Our server never touches the file
  └─ R2 receives and stores file
```

### 3. Save Metadata (Update MongoDB)

```
Client → /api/topics/{topicId}/files
         ├─ Verify user owns topic
         ├─ Create UploadedFile document
         │  - userId, topicId, filename
         │  - bucket, key, storagePath
         └─ Return: file metadata + 201
```

### 4. Download

```
Client → /api/files/{fileId}/download
         ├─ Verify user owns file
         ├─ Generate presigned GET URL
         │  Expires in 1 hour
         └─ Return: {downloadUrl, originalName}

Client → GET downloadUrl
         └─ R2 serves file directly
```

### 5. Delete

```
Client → /api/files/{fileId}
         ├─ Verify user owns file
         ├─ Delete from R2 (best-effort)
         │  Errors logged but don't block
         ├─ Delete from MongoDB
         └─ Return: success + 200
```

## Data Isolation

Every operation verifies userId from JWT:

```typescript
// Topics
const topic = await Topic.findOne({
  _id: topicId,
  userId: decoded.userId  // ← User filter
});

// Files
const file = await UploadedFile.findOne({
  _id: fileId,
  userId: decoded.userId  // ← User filter
});

// Generated Content
const content = await GeneratedContent.findOne({
  _id: contentId,
  userId: decoded.userId  // ← User filter
});
```

**Result**: Users can only access their own data. Cross-user access attempts return 404 (not found), not revealing whether resource exists.

## Topics CRUD Flow

### Create Topic

```
POST /api/topics
  ├─ Verify auth token
  ├─ Extract {title, description?}
  ├─ Create Topic with userId
  └─ Return: topic + 201
```

### Read Topics (List)

```
GET /api/topics
  ├─ Verify auth token
  ├─ Query: {userId: decoded.userId}
  ├─ Sort: {createdAt: -1}
  └─ Return: [topics] + 200
```

### Read Topic (Single)

```
GET /api/topics/:id
  ├─ Verify auth token
  ├─ Query: {_id: id, userId: decoded.userId}
  └─ Return: topic + 200 or 404
```

### Update Topic

```
PATCH /api/topics/:id
  ├─ Verify auth token
  ├─ Find and verify ownership
  ├─ Update: {title?, description?}
  └─ Return: updated topic + 200
```

### Delete Topic (Cascade)

```
DELETE /api/topics/:id
  ├─ Verify auth token
  ├─ Find all UploadedFiles for topic
  ├─ For each file:
  │  ├─ Delete from R2 (best-effort)
  │  └─ Continue if R2 fails
  ├─ Delete all file metadata
  ├─ Delete topic
  └─ Return: success + 200
```

## Error Handling

### Consistent Response Format

```json
Success: { "data": {...} }
Error:   { "error": "message" }
```

### Status Codes

- `201 Created`: Resource created successfully
- `200 OK`: Successful read/update/delete
- `400 Bad Request`: Invalid input
- `401 Unauthorized`: Missing/invalid auth
- `404 Not Found`: Resource doesn't exist
- `500 Server Error`: Database/storage failure

### Error Logging

```typescript
try {
  // operation
} catch (error) {
  console.error('Operation error:', error);
  return NextResponse.json(
    { error: 'Internal server error' },
    { status: 500 }
  );
}
```

All errors logged with context for debugging.

## Database Indexes

```typescript
// User
{ email: 1, unique: true }    // Fast login, prevent duplicates
{ createdAt: 1 }              // Sort by date

// Topic
{ userId: 1 }                 // List user's topics
{ createdAt: 1 }              // Sort by date

// UploadedFile
{ userId: 1 }                 // Verify ownership
{ topicId: 1 }                // List files for topic
{ createdAt: 1 }              // Sort by date

// GeneratedContent
{ userId: 1 }                 // Verify ownership
{ topicId: 1 }                // Find by topic
{ createdAt: 1 }              // Sort by date
```

## Security Mechanisms

| Mechanism | Implementation | Benefit |
|-----------|-----------------|---------|
| Password Hashing | bcryptjs | Can't recover password from DB |
| JWT Signing | HMAC-SHA256 | Token can't be forged |
| httpOnly Cookies | Browser config | JavaScript can't steal token |
| User Isolation | userId filter | Users can't access each other's data |
| Presigned URLs | AWS SDK | Time-limited, scoped to action |
| Best-Effort Delete | Error handling | Partial failure doesn't break state |

## Scalability Considerations

### Connection Pooling

MongoDB connection reused across requests:
```typescript
let cached = global.mongoose;
if (!cached) cached = mongoose.connect(MONGODB_URI);
```

Prevents connection exhaustion.

### Stateless API

Each request is independent - can deploy multiple instances.

### Database Indexes

Indexed queries ensure O(log n) performance even with millions of documents.

### Presigned URLs

Files uploaded directly to R2, not through our server. Reduces server load and bandwidth.

### Async Operations

Best-effort R2 deletion doesn't block response - metadata deleted regardless of R2 status.

## Future Enhancements

### Short-term
- [ ] Pagination (GET /api/topics?page=1&limit=10)
- [ ] Search (GET /api/topics?search=keyword)
- [ ] File versioning
- [ ] Bulk operations

### Medium-term
- [ ] WebSocket for real-time updates
- [ ] Sharing/collaboration (share topics)
- [ ] AI-generated summaries
- [ ] Full-text search

### Long-term
- [ ] Microservices (separate auth, storage, AI)
- [ ] Redis caching
- [ ] Event sourcing
- [ ] GraphQL API

---

**Last Updated**: January 24, 2026
