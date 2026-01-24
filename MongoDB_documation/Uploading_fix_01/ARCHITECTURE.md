# Architecture

**Stack:** Next.js (App Router) API routes + MongoDB (Mongoose) + Cloudflare R2 (S3-compatible) + JWT httpOnly cookies.

```
Client (Next.js pages)
   │  JWT cookie
   ▼
API routes (14)
   ├─ Auth: register/login/logout/me
   ├─ Topics: create/list/get/update/delete
   └─ Files: presign → upload → metadata → list → download → delete
   │
   ├─ MongoDB (Atlas)
   │   - Users
   │   - Topics
   │   - UploadedFiles (R2 metadata only)
   │   - GeneratedContent (R2 contentPath + status)
   │
   └─ Cloudflare R2
       - Bytes stored in bucket (topics/<topicId>/...)
       - Presigned PUT/GET via AWS SDK v3
```

**Data isolation:** every query filters by `userId`; missing/unauthorized returns 401/404 without leaking resource existence.

**Storage rules:**
- Only metadata in MongoDB: bucket, key, storagePath (r2://bucket/key), mimeType, size.
- Bytes live in R2. Upload path pattern: `topics/{topicId}/{timestamp}-{rand}.{ext}`.
- Generated content uses `r2://{bucket}/generated/...` via `contentPath` on `GeneratedContent`.

**R2 configuration:**
- Endpoint: `https://<ACCOUNT_ID>.r2.cloudflarestorage.com`
- Region: `auto`
- Access keys: R2 "Manage R2 API Tokens" (not Cloudflare user tokens)
- Client: AWS SDK v3 with `forcePathStyle: true` to avoid SignatureDoesNotMatch.

**Auth flow:** register/login -> bcrypt hash -> JWT signed with `JWT_SECRET` -> set httpOnly cookie -> all topic/file routes verify token and scope by user.

**Upload flow (real, not simulated):**
1) Client POST /api/uploads/presign (needs topic ownership)
2) Client PUT file to returned `uploadUrl` (presigned PUT to R2)
3) Client POST /api/topics/:topicId/files with returned key/bucket to store metadata
4) Later: GET /api/topics/:topicId/files, GET /api/files/:fileId/download (presigned GET), DELETE /api/files/:fileId

**Endpoint count consistency:** 14 core routes (4 auth, 5 topics, 5 files). Legacy demo endpoints remain but are not part of the core flow.
