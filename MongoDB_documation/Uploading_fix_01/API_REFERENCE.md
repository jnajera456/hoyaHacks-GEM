# API Reference

**Core endpoints (14 total):**
- Auth (4): POST /auth/register, POST /auth/login, POST /auth/logout, GET /auth/me
- Topics (5): POST /topics, GET /topics, GET /topics/:id, PATCH /topics/:id, DELETE /topics/:id
- Files (5): POST /uploads/presign, GET /topics/:topicId/files, POST /topics/:topicId/files, GET /files/:fileId/download, DELETE /files/:fileId

All requests that modify/read user data require the JWT httpOnly cookie set by register/login.

## Auth

### POST /api/auth/register
- Body: { email, password, name? }
- 201 → { user }

### POST /api/auth/login
- Body: { email, password }
- 200 → { user }

### POST /api/auth/logout
- Clears cookie, 200 → { message }

### GET /api/auth/me
- Requires cookie
- 200 → { user }

## Topics

### POST /api/topics
- Body: { title, description? }
- 201 → { topic }

### GET /api/topics
- 200 → { topics }

### GET /api/topics/:id
- 200 → { topic }
- 404 if not owned/by id

### PATCH /api/topics/:id
- Body: { title?, description? }
- 200 → { topic }

### DELETE /api/topics/:id
- Cascades: deletes topic and its UploadedFile metadata; attempts R2 deletions best-effort
- 200 → { message }

## File Upload Flow

1) **Presign**: POST /api/uploads/presign
- Body: { topicId, originalName, mimeType, size }
- 200 → { uploadUrl, bucket, key, storagePath, filename }

2) **Client Upload to R2** (example with curl)
```bash
curl -X PUT "<uploadUrl>" \
  -H "Content-Type: application/pdf" \
  --data-binary @notes.pdf
```

3) **Save metadata**: POST /api/topics/:topicId/files
- Body: { originalName, filename, mimeType, size, key, bucket?, storagePath? }
- If bucket/storagePath omitted, server fills from env + key
- 201 → { file }

4) **List files**: GET /api/topics/:topicId/files
- 200 → { files: [ { originalName, key, storagePath, bucket, createdAt, ... } ] }

5) **Download**: GET /api/files/:fileId/download
- 200 → { downloadUrl, originalName, mimeType }

6) **Delete**: DELETE /api/files/:fileId
- Deletes metadata and attempts R2 delete (best-effort)
- 200 → { message }

## Generated Content
- Model exists (`GeneratedContent`) storing per-user, per-topic generated outputs with R2 contentPath (r2://bucket/key) and status.
- No public endpoints yet; add similarly with userId scoping if needed.

## Errors (consistent)
- 400 Bad Request: missing/invalid input
- 401 Unauthorized: missing/invalid JWT cookie
- 404 Not Found: resource not owned or not present
- 500 Server Error: database/storage failures

## Environment Expectations
- JWT in httpOnly cookie set by register/login
- R2 endpoint must be `https://<ACCOUNT_ID>.r2.cloudflarestorage.com` and `region: auto`
- Bucket name from env `R2_BUCKET` is authoritative
