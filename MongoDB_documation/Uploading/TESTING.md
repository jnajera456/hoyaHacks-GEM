# Testing Guide

Complete instructions for testing the backend implementation.

## Quick Start

### 1. Verify Build

```bash
cd web
npm run build
```

Expected: `✓ Compiled successfully`

### 2. Test MongoDB Connection

```bash
npx tsx testing_db/connecting.ts
```

Expected output:
```
MongoDB Connected ✓
Connected to: mongodb+srv://...
Collections: users, topics, uploadedfiles, generatedcontents
```

### 3. Test R2 Connection

```bash
npx tsx testing_db/uplaoding.ts
```

Expected output:
```
R2 sanity: { bucket: '...', endpoint: '...', ... }
PUT success → [debug/TIMESTAMP-hello.txt]
GET success → file retrieved
DELETE success → file deleted
```

## Manual Testing with cURL

### Setup

```bash
# Start dev server in one terminal
npm run dev

# In another terminal, set up variables
BASE_URL="http://localhost:3000"
COOKIES_FILE="cookies.txt"
```

### 1. Register User

```bash
curl -X POST "$BASE_URL/api/auth/register" \
  -H "Content-Type: application/json" \
  -c "$COOKIES_FILE" \
  -d '{
    "email": "test@example.com",
    "password": "TestPassword123!",
    "name": "Test User"
  }'
```

Expected response:
```json
{
  "user": {
    "_id": "...",
    "email": "test@example.com",
    "name": "Test User",
    "createdAt": "2026-01-24T..."
  }
}
```

### 2. Login User

```bash
curl -X POST "$BASE_URL/api/auth/login" \
  -H "Content-Type: application/json" \
  -c "$COOKIES_FILE" \
  -d '{
    "email": "test@example.com",
    "password": "TestPassword123!"
  }'
```

Expected response:
```json
{
  "user": {
    "_id": "...",
    "email": "test@example.com",
    "name": "Test User"
  }
}
```

Check that cookie was saved:
```bash
cat "$COOKIES_FILE"  # Should show token=...
```

### 3. Get Current User

```bash
curl -X GET "$BASE_URL/api/auth/me" \
  -b "$COOKIES_FILE"
```

Expected response:
```json
{
  "user": {
    "_id": "...",
    "email": "test@example.com",
    "name": "Test User",
    "createdAt": "2026-01-24T..."
  }
}
```

### 4. Create Topic

```bash
curl -X POST "$BASE_URL/api/topics" \
  -H "Content-Type: application/json" \
  -b "$COOKIES_FILE" \
  -d '{
    "title": "Biology 101",
    "description": "Introduction to cellular biology"
  }'
```

Expected response:
```json
{
  "topic": {
    "_id": "TOPIC_ID_HERE",
    "userId": "...",
    "title": "Biology 101",
    "description": "Introduction to cellular biology",
    "createdAt": "2026-01-24T..."
  }
}
```

**Save TOPIC_ID for next steps**:
```bash
TOPIC_ID="TOPIC_ID_HERE"
```

### 5. List Topics

```bash
curl -X GET "$BASE_URL/api/topics" \
  -b "$COOKIES_FILE"
```

Expected response:
```json
{
  "topics": [
    {
      "_id": "TOPIC_ID_HERE",
      "userId": "...",
      "title": "Biology 101",
      "description": "Introduction to cellular biology",
      "createdAt": "2026-01-24T..."
    }
  ]
}
```

### 6. Get Single Topic

```bash
curl -X GET "$BASE_URL/api/topics/$TOPIC_ID" \
  -b "$COOKIES_FILE"
```

Expected response: Same as above (single topic)

### 7. Update Topic

```bash
curl -X PATCH "$BASE_URL/api/topics/$TOPIC_ID" \
  -H "Content-Type: application/json" \
  -b "$COOKIES_FILE" \
  -d '{
    "title": "Biology 101 - Advanced",
    "description": "Advanced cellular and molecular biology"
  }'
```

Expected response:
```json
{
  "topic": {
    "_id": "TOPIC_ID_HERE",
    "userId": "...",
    "title": "Biology 101 - Advanced",
    "description": "Advanced cellular and molecular biology",
    "createdAt": "2026-01-24T..."
  }
}
```

### 8. Generate Presigned Upload URL

```bash
curl -X POST "$BASE_URL/api/uploads/presign" \
  -H "Content-Type: application/json" \
  -b "$COOKIES_FILE" \
  -d '{
    "topicId": "'$TOPIC_ID'",
    "originalName": "notes.pdf",
    "mimeType": "application/pdf",
    "size": 1024000
  }'
```

Expected response:
```json
{
  "uploadUrl": "https://account.r2.cloudflarestorage.com/bucket/...",
  "key": "topics/TOPIC_ID/...",
  "storagePath": "r2://bucket/topics/TOPIC_ID/...",
  "filename": "..."
}
```

**Save values for next step**:
```bash
UPLOAD_URL="https://..."  # From response
KEY="topics/..."
STORAGE_PATH="r2://..."
FILENAME="..."
```

### 9. Simulate File Upload (Mock)

Since we can't actually upload to R2 in testing, we simulate with the metadata:

```bash
curl -X POST "$BASE_URL/api/topics/$TOPIC_ID/files" \
  -H "Content-Type: application/json" \
  -b "$COOKIES_FILE" \
  -d '{
    "originalName": "notes.pdf",
    "filename": "'$FILENAME'",
    "mimeType": "application/pdf",
    "size": 1024000,
    "bucket": "'$R2_BUCKET'",
    "key": "'$KEY'",
    "storagePath": "'$STORAGE_PATH'"
  }'
```

Expected response:
```json
{
  "file": {
    "_id": "FILE_ID_HERE",
    "userId": "...",
    "topicId": "TOPIC_ID_HERE",
    "originalName": "notes.pdf",
    "filename": "...",
    "mimeType": "application/pdf",
    "size": 1024000,
    "storageProvider": "r2",
    "bucket": "...",
    "key": "topics/...",
    "storagePath": "r2://...",
    "createdAt": "2026-01-24T..."
  }
}
```

**Save FILE_ID for next steps**:
```bash
FILE_ID="FILE_ID_HERE"
```

### 10. List Files for Topic

```bash
curl -X GET "$BASE_URL/api/topics/$TOPIC_ID/files" \
  -b "$COOKIES_FILE"
```

Expected response:
```json
{
  "files": [
    {
      "_id": "FILE_ID_HERE",
      "userId": "...",
      "topicId": "TOPIC_ID_HERE",
      "originalName": "notes.pdf",
      ...
    }
  ]
}
```

### 11. Get Download URL

```bash
curl -X GET "$BASE_URL/api/files/$FILE_ID/download" \
  -b "$COOKIES_FILE"
```

Expected response:
```json
{
  "downloadUrl": "https://account.r2.cloudflarestorage.com/bucket/...",
  "originalName": "notes.pdf"
}
```

### 12. Delete File

```bash
curl -X DELETE "$BASE_URL/api/files/$FILE_ID" \
  -b "$COOKIES_FILE"
```

Expected response:
```json
{
  "message": "File deleted"
}
```

Verify deletion - should return 404:
```bash
curl -X GET "$BASE_URL/api/files/$FILE_ID/download" \
  -b "$COOKIES_FILE"
# Expected: 404 error
```

### 13. Delete Topic (with cascade)

```bash
curl -X DELETE "$BASE_URL/api/topics/$TOPIC_ID" \
  -b "$COOKIES_FILE"
```

Expected response:
```json
{
  "message": "Topic deleted"
}
```

Verify deletion - should return empty list:
```bash
curl -X GET "$BASE_URL/api/topics" \
  -b "$COOKIES_FILE"
# Expected: {"topics": []}
```

### 14. Logout

```bash
curl -X POST "$BASE_URL/api/auth/logout" \
  -b "$COOKIES_FILE"
```

Expected response:
```json
{
  "message": "Logged out successfully"
}
```

Verify auth fails after logout:
```bash
curl -X GET "$BASE_URL/api/auth/me" \
  -b "$COOKIES_FILE"
# Expected: 401 error
```

## Testing with Postman

### Setup

1. Install [Postman](https://www.postman.com/downloads/)
2. Create new collection called "StudyToks Backend"
3. Add environment variable:
   - Name: `base_url`
   - Value: `http://localhost:3000`
4. Add more variables:
   - `topic_id` (will fill during tests)
   - `file_id` (will fill during tests)
   - `user_id` (will fill during tests)

### Request Templates

**Register**
- Method: POST
- URL: `{{base_url}}/api/auth/register`
- Body (JSON):
```json
{
  "email": "test@{{$timestamp}}.com",
  "password": "TestPassword123!",
  "name": "Test User"
}
```

**Login**
- Method: POST
- URL: `{{base_url}}/api/auth/login`
- Body:
```json
{
  "email": "test@example.com",
  "password": "TestPassword123!"
}
```

**Create Topic**
- Method: POST
- URL: `{{base_url}}/api/topics`
- Body:
```json
{
  "title": "Biology 101",
  "description": "Intro to biology"
}
```

## Error Cases to Test

### Missing Fields

```bash
# Missing email
curl -X POST "$BASE_URL/api/auth/register" \
  -H "Content-Type: application/json" \
  -d '{"password": "test"}'
# Expected: 400 - "Email and password are required"

# Missing title
curl -X POST "$BASE_URL/api/topics" \
  -H "Content-Type: application/json" \
  -b "$COOKIES_FILE" \
  -d '{"description": "test"}'
# Expected: 400 - "Title is required"
```

### Unauthorized Access

```bash
# No cookie
curl -X GET "$BASE_URL/api/topics"
# Expected: 401 - "Unauthorized"

# Invalid token
curl -X GET "$BASE_URL/api/topics" \
  -H "Cookie: token=invalid"
# Expected: 401 - "Invalid token"
```

### Not Found

```bash
# Non-existent topic
curl -X GET "$BASE_URL/api/topics/000000000000000000000000" \
  -b "$COOKIES_FILE"
# Expected: 404 - "Topic not found"

# Non-existent file
curl -X GET "$BASE_URL/api/files/000000000000000000000000/download" \
  -b "$COOKIES_FILE"
# Expected: 404 - "File not found"
```

### Duplicate User

```bash
# Register same email twice
curl -X POST "$BASE_URL/api/auth/register" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "duplicate@example.com",
    "password": "test123"
  }'

# Second attempt - should fail
curl -X POST "$BASE_URL/api/auth/register" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "duplicate@example.com",
    "password": "test456"
  }'
# Expected: 400 - "User already exists"
```

### Wrong Password

```bash
curl -X POST "$BASE_URL/api/auth/login" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "WrongPassword123!"
  }'
# Expected: 401 - "Invalid email or password"
```

## Data Validation Tests

### Email Validation

```bash
# Invalid email format
curl -X POST "$BASE_URL/api/auth/register" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "not-an-email",
    "password": "test123"
  }'
# Should succeed (email not validated on backend)
# Frontend should validate before sending
```

### Password Strength

```bash
# Very short password
curl -X POST "$BASE_URL/api/auth/register" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "a"
  }'
# Should succeed (no password validation on backend)
# Frontend should validate before sending
```

## Performance Tests

### List Many Topics

```bash
# Create 100 topics and measure response time
for i in {1..100}; do
  curl -X POST "$BASE_URL/api/topics" \
    -H "Content-Type: application/json" \
    -b "$COOKIES_FILE" \
    -d "{\"title\": \"Topic $i\"}"
done

# Time the list request
time curl -X GET "$BASE_URL/api/topics" -b "$COOKIES_FILE"
```

Expected: Should complete in < 1 second

### Large File Metadata

```bash
# Create file with very large size value
curl -X POST "$BASE_URL/api/topics/$TOPIC_ID/files" \
  -H "Content-Type: application/json" \
  -b "$COOKIES_FILE" \
  -d '{
    "originalName": "huge.zip",
    "filename": "huge.zip",
    "mimeType": "application/zip",
    "size": 10737418240,
    "bucket": "...",
    "key": "...",
    "storagePath": "..."
  }'
```

Expected: Should handle large numbers without issue

## Security Tests

### Cross-User Access

```bash
# Create two users
# User A creates topic
# User B tries to access User A's topic by ID
curl -X GET "$BASE_URL/api/topics/$USER_A_TOPIC_ID" \
  -b user_b_cookies.txt
# Expected: 404 - Topic should not be accessible
```

### Token Tampering

```bash
# Extract token and modify it
# Set cookie with modified token
# Expected: 401 - Token verification should fail
```

### SQL Injection Attempts

```bash
# Try to inject MongoDB query
curl -X POST "$BASE_URL/api/topics" \
  -H "Content-Type: application/json" \
  -b "$COOKIES_FILE" \
  -d '{"title": "{\$ne: null}"}'
# Expected: Should create topic with that exact title (safe)
```

## Continuous Integration (CI)

Create `.github/workflows/test.yml`:

```yaml
name: Build & Test

on: [push, pull_request]

jobs:
  build:
    runs-on: ubuntu-latest
    services:
      mongodb:
        image: mongo
        options: >-
          --health-cmd mongosh
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5

    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: 18

      - run: npm ci
      - run: npm run build
      - run: npm run test  # (when tests added)
```

## Test Summary Checklist

- [ ] Build compiles without errors
- [ ] MongoDB connection works
- [ ] R2 connection works
- [ ] User registration works
- [ ] User login works
- [ ] Get current user works
- [ ] Create topic works
- [ ] List topics works
- [ ] Get single topic works
- [ ] Update topic works
- [ ] Delete topic works
- [ ] Generate presigned URL works
- [ ] Create file metadata works
- [ ] List files works
- [ ] Get download URL works
- [ ] Delete file works
- [ ] Logout works
- [ ] Unauthorized requests return 401
- [ ] Not found requests return 404
- [ ] Invalid input returns 400
- [ ] User data is isolated
- [ ] Cascade deletion works

---

**Status**: Ready for testing  
**Last Updated**: January 24, 2026
