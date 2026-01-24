# API Reference

Complete documentation for all backend endpoints.

## Quick Reference

| Endpoint | Method | Purpose | Auth |
|----------|--------|---------|------|
| `/api/auth/register` | POST | Register new user | ❌ |
| `/api/auth/login` | POST | Login user | ❌ |
| `/api/auth/logout` | POST | Logout user | ✅ |
| `/api/auth/me` | GET | Get current user | ✅ |
| `/api/topics` | POST | Create topic | ✅ |
| `/api/topics` | GET | List topics | ✅ |
| `/api/topics/:id` | GET | Get topic | ✅ |
| `/api/topics/:id` | PATCH | Update topic | ✅ |
| `/api/topics/:id` | DELETE | Delete topic | ✅ |
| `/api/uploads/presign` | POST | Get presigned URL | ✅ |
| `/api/topics/:id/files` | GET | List files | ✅ |
| `/api/topics/:id/files` | POST | Create file metadata | ✅ |
| `/api/files/:id/download` | GET | Get download URL | ✅ |
| `/api/files/:id` | DELETE | Delete file | ✅ |

## Authentication Endpoints

### POST /api/auth/register

Register a new user.

**Request:**
```json
{
  "email": "user@example.com",
  "password": "secure-password",
  "name": "John Doe"
}
```

**Response (201):**
```json
{
  "user": {
    "_id": "507f1f77bcf86cd799439011",
    "email": "user@example.com",
    "name": "John Doe",
    "createdAt": "2026-01-24T10:30:00Z"
  }
}
```

**Sets Cookie:** `token=<jwt>` (httpOnly, 7 days)

### POST /api/auth/login

Login with email and password.

**Request:**
```json
{
  "email": "user@example.com",
  "password": "secure-password"
}
```

**Response (200):**
```json
{
  "user": {
    "_id": "507f1f77bcf86cd799439011",
    "email": "user@example.com",
    "name": "John Doe"
  }
}
```

**Sets Cookie:** `token=<jwt>` (httpOnly, 7 days)

### POST /api/auth/logout

Logout current user.

**Response (200):**
```json
{
  "message": "Logged out successfully"
}
```

**Clears Cookie:** Removes token cookie

### GET /api/auth/me

Get authenticated user profile.

**Response (200):**
```json
{
  "user": {
    "_id": "507f1f77bcf86cd799439011",
    "email": "user@example.com",
    "name": "John Doe",
    "createdAt": "2026-01-24T10:30:00Z"
  }
}
```

---

## Topics Endpoints

### POST /api/topics

Create a new topic.

**Request:**
```json
{
  "title": "Biology 101",
  "description": "Intro to cellular biology"
}
```

**Response (201):**
```json
{
  "topic": {
    "_id": "507f1f77bcf86cd799439012",
    "userId": "507f1f77bcf86cd799439011",
    "title": "Biology 101",
    "description": "Intro to cellular biology",
    "createdAt": "2026-01-24T10:30:00Z"
  }
}
```

### GET /api/topics

List all topics for authenticated user.

**Response (200):**
```json
{
  "topics": [
    {
      "_id": "507f1f77bcf86cd799439012",
      "userId": "507f1f77bcf86cd799439011",
      "title": "Biology 101",
      "description": "Intro to cellular biology",
      "createdAt": "2026-01-24T10:30:00Z"
    }
  ]
}
```

### GET /api/topics/:id

Get single topic.

**Response (200):** Same as POST response above

### PATCH /api/topics/:id

Update topic fields.

**Request:**
```json
{
  "title": "Biology 201",
  "description": "Advanced biology"
}
```

**Response (200):** Updated topic object

### DELETE /api/topics/:id

Delete topic and cascade delete all associated files.

**Response (200):**
```json
{
  "message": "Topic deleted"
}
```

---

## File Operations Endpoints

### POST /api/uploads/presign

Generate presigned URL for file upload to R2.

**Request:**
```json
{
  "topicId": "507f1f77bcf86cd799439012",
  "originalName": "notes.pdf",
  "mimeType": "application/pdf",
  "size": 1024000
}
```

**Response (200):**
```json
{
  "uploadUrl": "https://account.r2.cloudflarestorage.com/bucket/...",
  "key": "topics/507f1f77bcf86cd799439012/1706089800000-abc123.pdf",
  "storagePath": "r2://bucket/topics/507f1f77bcf86cd799439012/1706089800000-abc123.pdf",
  "filename": "1706089800000-abc123.pdf"
}
```

**URL Expiry:** 5 minutes

### GET /api/topics/:id/files

List all files for a topic.

**Response (200):**
```json
{
  "files": [
    {
      "_id": "507f1f77bcf86cd799439014",
      "userId": "507f1f77bcf86cd799439011",
      "topicId": "507f1f77bcf86cd799439012",
      "originalName": "notes.pdf",
      "filename": "1706089800000-abc123.pdf",
      "mimeType": "application/pdf",
      "size": 1024000,
      "storageProvider": "r2",
      "bucket": "hoya-hacks",
      "key": "topics/507f1f77bcf86cd799439012/1706089800000-abc123.pdf",
      "storagePath": "r2://hoya-hacks/topics/507f1f77bcf86cd799439012/1706089800000-abc123.pdf",
      "createdAt": "2026-01-24T10:35:00Z"
    }
  ]
}
```

### POST /api/topics/:id/files

Create file metadata after R2 upload completes.

**Request:**
```json
{
  "originalName": "notes.pdf",
  "filename": "1706089800000-abc123.pdf",
  "mimeType": "application/pdf",
  "size": 1024000,
  "bucket": "hoya-hacks",
  "key": "topics/507f1f77bcf86cd799439012/1706089800000-abc123.pdf",
  "storagePath": "r2://hoya-hacks/topics/507f1f77bcf86cd799439012/1706089800000-abc123.pdf"
}
```

**Response (201):** File metadata object

### GET /api/files/:id/download

Get presigned download URL for file.

**Response (200):**
```json
{
  "downloadUrl": "https://account.r2.cloudflarestorage.com/bucket/...",
  "originalName": "notes.pdf"
}
```

**URL Expiry:** 1 hour

### DELETE /api/files/:id

Delete file from R2 and remove metadata from MongoDB.

**Response (200):**
```json
{
  "message": "File deleted"
}
```

---

## Error Responses

All errors return JSON with status code:

```json
{
  "error": "Description of error"
}
```

### Common Errors

| Status | Error | Cause |
|--------|-------|-------|
| 400 | Missing required fields | Invalid request body |
| 400 | Email and password required | Auth endpoint missing fields |
| 400 | Title is required | Topic missing title |
| 400 | User already exists | Duplicate email on register |
| 401 | Unauthorized | Missing/invalid authentication |
| 401 | Invalid email or password | Wrong credentials |
| 404 | Topic not found | Topic doesn't exist or wrong user |
| 404 | File not found | File doesn't exist or wrong user |
| 500 | Internal server error | Database or storage error |

---

## HTTP Status Codes

| Code | Meaning |
|------|---------|
| 200 | OK - Successful read/update/delete |
| 201 | Created - Resource created successfully |
| 400 | Bad Request - Invalid input or missing fields |
| 401 | Unauthorized - Missing or invalid authentication |
| 404 | Not Found - Resource doesn't exist |
| 500 | Server Error - Database or storage failure |

---

## Authentication

All endpoints except register and login require authentication via httpOnly cookie. The cookie is automatically sent by browsers.

**cURL with cookie:**
```bash
curl -X GET http://localhost:3000/api/auth/me \
  -b cookies.txt  # Uses saved cookies
```

**Example workflow:**
```bash
# 1. Register/Login (sets cookie)
curl -X POST ... -c cookies.txt

# 2. Subsequent requests (uses cookie)
curl -X GET ... -b cookies.txt
```

---

Last Updated: January 24, 2026
