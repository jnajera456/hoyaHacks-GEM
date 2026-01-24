# Setup Guide

## Prerequisites

- **Node.js**: 18.x or higher ([Download](https://nodejs.org/))
- **npm**: Comes with Node.js
- **MongoDB Atlas**: Free account at [mongodb.com](https://www.mongodb.com/cloud/atlas)
- **Cloudflare Account**: Free account at [cloudflare.com](https://www.cloudflare.com/)

## Environment Setup

### 1. Clone Repository

```bash
cd /path/to/workspace
git clone <repo-url>
cd hoyaHacks-GEM/web
```

### 2. Install Dependencies

```bash
npm install
```

**Key dependencies installed:**
- next@16.1.4 (React framework)
- typescript (type safety)
- mongoose (MongoDB ODM)
- jsonwebtoken (JWT auth)
- bcryptjs (password hashing)
- @aws-sdk/client-s3 (R2 storage)
- @aws-sdk/s3-request-presigner (presigned URLs)

### 3. MongoDB Setup

#### Create MongoDB Atlas Cluster

1. Go to [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
2. Sign up or log in
3. Create a new project (name: "hoyahacks-gem")
4. Create a new cluster:
   - Provider: AWS
   - Region: us-east-1 (or closest to you)
   - Cluster tier: M0 (Free)
5. Wait for cluster to be ready (~5 min)

#### Get Connection String

1. Click "Connect" button
2. Select "Drivers"
3. Choose Node.js, version 5.9 or later
4. Copy the connection string
5. Replace `<password>` with your database password
6. Replace `<username>` with your database username

**String format**:
```
mongodb+srv://username:password@cluster-name.mongodb.net/hoyahacks?retryWrites=true&w=majority&appName=hoyahacks
```

### 4. Cloudflare R2 Setup

#### Create R2 Bucket

1. Go to [Cloudflare Dashboard](https://dash.cloudflare.com/)
2. Sign up or log in
3. Navigate to **R2** (left sidebar)
4. Click **Create bucket**
5. Bucket name: `hoyahacks-gem` (lowercase, no spaces)
6. Location: US (auto-optimized)
7. Click **Create bucket**

#### Generate API Token

1. In R2, click **Settings** (gear icon)
2. Scroll to "API tokens" section
3. Click **Create API token**
4. Permissions: **Object Read & Write** + **Bucket Listing**
5. TTL: Leave as default (never expire)
6. Click **Create API token**
7. Copy and save:
   - Access Key ID
   - Secret Access Key (won't show again!)

### 5. Environment Variables

Create `.env.local` in `/web` directory:

```bash
# MongoDB
MONGODB_URI="mongodb+srv://username:password@cluster.mongodb.net/hoyahacks?retryWrites=true&w=majority&appName=hoyahacks"

# JWT Authentication
JWT_SECRET="your-super-secret-random-string-32-chars-minimum-change-this"

# Cloudflare R2
R2_ENDPOINT="https://bucket-name.s3.us-east-1.amazonaws.com"
R2_ACCESS_KEY_ID="your-r2-access-key-id"
R2_SECRET_ACCESS_KEY="your-r2-secret-access-key"
R2_BUCKET="hoyahacks-gem"
```

#### Generate Secure JWT_SECRET

```bash
# macOS/Linux
openssl rand -base64 32

# Or use Node.js
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"

# Copy output to JWT_SECRET value
```

**Important**: Change `JWT_SECRET` in production. Use a strong random value.

## Verification

### 1. Test MongoDB Connection

```bash
# From /web directory
node testing_db/connecting.ts
```

**Expected output**:
```
MongoDB connection successful!
Collections: users, topics, uploadedfiles, generatedcontents
```

### 2. Test R2 Storage

```bash
# From /web directory
node testing_db/uplaoding.ts
```

**Expected output**:
```
R2 connection successful!
PUT: ✓ File uploaded
GET: ✓ File retrieved
DELETE: ✓ File deleted
```

### 3. Build Project

```bash
npm run build
```

**Expected output**:
```
Turbopack compiled successfully in X.XXs
```

### 4. Start Development Server

```bash
npm run dev
```

**Output**:
```
  ▲ Next.js 16.1.4
  - Local:        http://localhost:3000
  - Environments: .env.local

✓ Ready in 1.2s
```

Navigate to `http://localhost:3000` - should see homepage.

## Testing API Endpoints

### Manual Testing with cURL

#### 1. Register User

```bash
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "password": "SecurePass123!",
    "name": "Test User"
  }' \
  -c cookies.txt
```

**Response** (201):
```json
{
  "user": {
    "_id": "507f1f77bcf86cd799439011",
    "email": "user@example.com",
    "name": "Test User",
    "createdAt": "2026-01-24T10:30:00Z"
  }
}
```

#### 2. Login

```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "password": "SecurePass123!"
  }' \
  -c cookies.txt
```

#### 3. Get User Info (with auth)

```bash
curl -X GET http://localhost:3000/api/auth/me \
  -b cookies.txt
```

#### 4. Create Topic

```bash
curl -X POST http://localhost:3000/api/topics \
  -H "Content-Type: application/json" \
  -b cookies.txt \
  -d '{
    "title": "MongoDB Basics",
    "description": "Learn MongoDB fundamentals"
  }'
```

**Response** (201):
```json
{
  "topic": {
    "_id": "507f1f77bcf86cd799439012",
    "userId": "507f1f77bcf86cd799439011",
    "title": "MongoDB Basics",
    "description": "Learn MongoDB fundamentals",
    "createdAt": "2026-01-24T10:31:00Z"
  }
}
```

#### 5. List Topics

```bash
curl -X GET http://localhost:3000/api/topics \
  -b cookies.txt
```

#### 6. Get Presigned Upload URL

```bash
curl -X POST http://localhost:3000/api/uploads/presign \
  -H "Content-Type: application/json" \
  -b cookies.txt \
  -d '{
    "topicId": "507f1f77bcf86cd799439012",
    "fileName": "notes.pdf",
    "mimeType": "application/pdf"
  }'
```

**Response** (200):
```json
{
  "uploadUrl": "https://bucket.s3.us-east-1.amazonaws.com/topics/...?X-Amz-Signature=...",
  "key": "topics/507f1f77bcf86cd799439012/1706089800-abc123.pdf",
  "storagePath": "r2://hoyahacks-gem/topics/...",
  "filename": "1706089800-abc123.pdf"
}
```

#### 7. Upload File to R2 (using presigned URL)

```bash
# Save the uploadUrl from step 6
curl -X PUT "UPLOAD_URL_FROM_STEP_6" \
  -H "Content-Type: application/pdf" \
  --data-binary @notes.pdf
```

#### 8. Save File Metadata

```bash
curl -X POST http://localhost:3000/api/topics/507f1f77bcf86cd799439012/files \
  -H "Content-Type: application/json" \
  -b cookies.txt \
  -d '{
    "originalName": "notes.pdf",
    "filename": "1706089800-abc123.pdf",
    "mimeType": "application/pdf",
    "size": 102400,
    "key": "topics/507f1f77bcf86cd799439012/1706089800-abc123.pdf",
    "storagePath": "r2://hoyahacks-gem/topics/507f1f77bcf86cd799439012/1706089800-abc123.pdf"
  }'
```

#### 9. List Files for Topic

```bash
curl -X GET http://localhost:3000/api/topics/507f1f77bcf86cd799439012/files \
  -b cookies.txt
```

#### 10. Download File

```bash
curl -X GET http://localhost:3000/api/files/FILE_ID/download \
  -b cookies.txt
```

**Response** (200):
```json
{
  "downloadUrl": "https://bucket.s3.us-east-1.amazonaws.com/topics/...?X-Amz-Signature=...",
  "originalName": "notes.pdf"
}
```

#### 11. Delete File

```bash
curl -X DELETE http://localhost:3000/api/files/FILE_ID \
  -b cookies.txt
```

### Testing with Postman

1. Download [Postman](https://www.postman.com/downloads/)
2. Import collection from workspace (if available)
3. Set up environment variables:
   - `BASE_URL`: http://localhost:3000
   - `EMAIL`: user@example.com
   - `PASSWORD`: SecurePass123!

4. Create requests in order:
   - Register
   - Login
   - Create Topic
   - Upload File
   - List Files
   - Download File
   - Delete File

## Troubleshooting

### MongoDB Connection Error

```
Error: connect ECONNREFUSED
```

**Solution**:
1. Check `MONGODB_URI` is correct
2. Verify IP address whitelist in MongoDB Atlas:
   - Go to Security → Network Access
   - Add 0.0.0.0/0 (allows all IPs - for dev only!)
   - For production, add specific IPs only

### R2 Authentication Error

```
InvalidAccessKeyId: The AWS Access Key Id you provided does not exist
```

**Solution**:
1. Verify `R2_ACCESS_KEY_ID` is correct (no spaces)
2. Verify `R2_SECRET_ACCESS_KEY` is correct (no spaces)
3. Generate new API token and try again

### JWT Token Expires Immediately

```
Error: jwt expired
```

**Solution**:
1. Check server time is in sync (NTP)
2. Check `JWT_SECRET` hasn't changed (invalidates all tokens)
3. Clear browser cookies and re-login

### File Upload Fails (Presigned URL)

```
403 Forbidden: Access Denied
```

**Solution**:
1. Check presigned URL hasn't expired (5 minute window)
2. Verify file upload preserves Content-Type header
3. Check R2 bucket policies allow uploads

## Development Workflow

### Run Development Server

```bash
npm run dev
```

Server runs at `http://localhost:3000` with hot-reload.

### Build for Production

```bash
npm run build
npm run start
```

### Type Checking

```bash
npx tsc --noEmit
```

Checks for TypeScript errors without emitting files.

### Linting

```bash
npx eslint src/
```

Checks code style and common errors.

## Deployment

### Vercel (Recommended for Next.js)

1. Push code to GitHub
2. Go to [Vercel](https://vercel.com)
3. Import project from Git
4. Add environment variables:
   - `MONGODB_URI`
   - `JWT_SECRET` (change to production value!)
   - `R2_ENDPOINT`, `R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY`, `R2_BUCKET`
5. Deploy

### Docker

Create `Dockerfile` in `/web`:

```dockerfile
FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci --only=production

COPY .next ./
COPY public ./public

ENV NODE_ENV=production
EXPOSE 3000

CMD ["npm", "start"]
```

Build and run:
```bash
docker build -t hoyahacks:latest .
docker run -p 3000:3000 \
  -e MONGODB_URI=... \
  -e JWT_SECRET=... \
  -e R2_ENDPOINT=... \
  hoyahacks:latest
```

## Security Checklist

- [ ] Change `JWT_SECRET` in production (use 32+ random characters)
- [ ] Enable HTTPS in production (required for httpOnly cookies)
- [ ] Restrict MongoDB IP whitelist to specific IPs
- [ ] Use separate MongoDB/R2 credentials for production
- [ ] Enable MongoDB authentication (not just IP whitelist)
- [ ] Set up error logging and monitoring
- [ ] Enable CORS properly (not `*` in production)
- [ ] Use environment-specific configs
- [ ] Rotate API tokens regularly
- [ ] Enable audit logging for file operations

## Next Steps

1. ✅ Install dependencies
2. ✅ Set up MongoDB Atlas
3. ✅ Set up Cloudflare R2
4. ✅ Create `.env.local`
5. ✅ Verify connections (test files)
6. ✅ Build and test locally
7. ➡️ Create frontend pages (register, login, dashboard)
8. ➡️ Deploy to production

---

**Last Updated**: January 24, 2026
