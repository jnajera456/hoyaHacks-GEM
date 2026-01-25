# Setup

## Prereqs
- Node.js 18+
- npm
- MongoDB Atlas cluster
- Cloudflare R2 bucket (free tier ok)

## Env vars (.env.local)
```
MONGODB_URI="mongodb+srv://<user>:<pass>@<cluster>.mongodb.net/hoya?retryWrites=true&w=majority"
JWT_SECRET="change-me-32-chars"
R2_ENDPOINT="https://<ACCOUNT_ID>.r2.cloudflarestorage.com"
R2_ACCESS_KEY_ID="<r2-access-key>"
R2_SECRET_ACCESS_KEY="<r2-secret>"
R2_BUCKET="hoyahacks-gem"
```
Notes: endpoint must use the account-level hostname above and region is `auto`. Use R2 "Manage R2 API Tokens" for keys (not Cloudflare user API tokens).

## Install & run
```bash
cd web
npm install
npm run dev
```
Local server: http://localhost:3000

## Quick DB/R2 sanity scripts
- MongoDB: `node testing_db/connecting.ts` (loads .env.local)
- R2: `node testing_db/uplaoding.ts` (direct PUT to R2 using env vars)

## Real upload test (curl)
1) Get presign (requires auth cookie from login/register):
```bash
curl -X POST http://localhost:3000/api/uploads/presign \
  -H "Content-Type: application/json" \
  -b cookies.txt \
  -d '{
    "topicId": "<topicId>",
    "originalName": "notes.pdf",
    "mimeType": "application/pdf",
    "size": 102400
  }'
```
Capture `uploadUrl`, `key`, `bucket`.

2) Upload bytes to R2:
```bash
curl -X PUT "<uploadUrl-from-step1>" \
  -H "Content-Type: application/pdf" \
  --data-binary @notes.pdf
```

3) Save metadata:
```bash
curl -X POST http://localhost:3000/api/topics/<topicId>/files \
  -H "Content-Type: application/json" \
  -b cookies.txt \
  -d '{
    "originalName": "notes.pdf",
    "filename": "<from-presign filename>",
    "mimeType": "application/pdf",
    "size": 102400,
    "key": "<from-presign key>",
    "bucket": "<from-presign bucket>",
    "storagePath": "r2://<bucket>/<key>"
  }'
```

4) Download check:
```bash
curl -X GET http://localhost:3000/api/files/<fileId>/download -b cookies.txt
# Use returned downloadUrl with curl -O
```

5) Delete check:
```bash
curl -X DELETE http://localhost:3000/api/files/<fileId> -b cookies.txt
```

## Deployment tips (demo-focused)
- Keep JWT_SECRET strong even for demos
- Ensure R2 bucket name matches env everywhere
- If SignatureDoesNotMatch appears, re-check endpoint format and that `forcePathStyle` is enabled (already in code)
