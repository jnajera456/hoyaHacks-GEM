# Frontend Integration Guide - New Database-First Backend

## Quick Start for Frontend Development

The backend has been completely refactored from hybrid offline-first to online-only database-backed. This document explains what changed and how to update the frontend.

## Major Changes

### ✅ What's Ready
- All 9 API endpoints fully functional
- Database-backed authentication (no offline guests)
- Topic-based content organization
- File metadata tracking
- AI content metadata tracking
- Full TypeScript support

### ❌ What's Not Implemented (Deferred)
- Actual file upload (endpoints ready, just need S3/cloud storage integration)
- Actual AI generation (endpoints ready, just need Gemini integration)
- Frontend pages (out of scope for this refactoring)

## API Usage Changes

### Old Way (Hybrid)
```typescript
import { hybridStorage, deckAPI } from '@/lib/api';

// Get decks (with fallback to localStorage)
const decks = await hybridStorage.getDecks();

// Save deck (dual-write to DB and localStorage)
await hybridStorage.saveDeck(deck);

// Guest login
const guestUser = await authAPI.guestLogin();
```

### New Way (Database-First)
```typescript
import { topicAPI, authAPI, uploadedFileAPI, generatedContentAPI } from '@/lib/api';

// Get topics (direct DB read)
const topics = await topicAPI.list();

// Save topic (DB only)
const newTopic = await topicAPI.create(title, description, subject, tags);

// No guest login - authenticated users only
```

## Component Updates Required

### account/page.tsx

**Remove:**
- All `hybridStorage` imports
- `AlertCircle` icon (no longer needed for offline warnings)
- Guest login UI
- Offline mode UI

**Update:**
```typescript
// OLD
import { hybridStorage, authAPI, userAPI } from '@/lib/api';

// NEW
import { authAPI, userAPI } from '@/lib/api';

// OLD - hybrid fallback logic
try {
  const user = await hybridStorage.getUser();
} catch {
  const user = await userAPI.getProfile();
}

// NEW - direct database read
const user = await userAPI.getProfile();

// OLD - guest login
const user = await authAPI.guestLogin();

// NEW - removed, signup/signin only
// Use authAPI.signup() or authAPI.signin()
```

### Main Study Page

**Remove:**
- All offline data syncing logic
- localStorage save statements for decks
- `STORAGE_MODE` checks
- Sync status indicators

**Update:**
```typescript
// OLD
import { hybridStorage, deckAPI } from '@/lib/api';

// NEW
import { topicAPI } from '@/lib/api';

// OLD
const decks = await hybridStorage.getDecks();
await hybridStorage.saveDeck(newDeck);

// NEW
const topics = await topicAPI.list();
const newTopic = await topicAPI.create(title, description, subject, tags);
await topicAPI.update(topicId, updates);
await topicAPI.delete(topicId);
```

### File Upload Component

**Current status:** Structure ready, implementation needed

```typescript
import { uploadedFileAPI } from '@/lib/api';

// After actual file upload to S3/cloud storage:
const fileMetadata = await uploadedFileAPI.createMetadata(topicId, {
  originalName: 'notes.pdf',
  filename: 'notes-12345.pdf',
  fileType: 'pdf',
  mimeType: 'application/pdf',
  storagePath: 's3://bucket/path/notes-12345.pdf',
  size: 1024576,
  metadata: { pageCount: 15 }
});
```

### AI Generation Component

**Current status:** Structure ready, implementation needed

```typescript
import { generatedContentAPI } from '@/lib/api';

// Record AI generation request:
const content = await generatedContentAPI.create(topicId, {
  contentType: 'short-form-video',
  aiModel: 'gemini',
  status: 'pending', // Will update to 'completed' when done
  generationMetadata: {
    prompt: 'Generate 30-second video about...',
    parameters: { temperature: 0.7 },
    executionTimeMs: 0,
    tokensUsed: 0,
    modelVersion: 'gemini-3-flash-preview'
  }
});

// Later, after generation completes:
await generatedContentAPI.create(topicId, {
  ...content,
  status: 'completed',
  contentPath: 's3://bucket/path/video.mp4',
  generationMetadata: {
    ...generationMetadata,
    executionTimeMs: 45000,
    tokensUsed: 1250
  }
});
```

## API Endpoint Summary

| Endpoint | Method | Purpose | Replaced |
|----------|--------|---------|----------|
| `/api/auth` | POST | Signup/Signin (no guest) | Old auth |
| `/api/users` | GET/PUT | User profile | Old users |
| `/api/topics` | GET/POST | List/create topics | `/api/decks` |
| `/api/topics/[id]` | GET/PUT/DELETE | Manage single topic | `/api/decks/[id]` |
| `/api/topics/[id]/files` | GET/POST | Manage uploaded files | NEW |
| `/api/topics/[id]/generated` | GET/POST | Manage AI content | `/api/sessions` |

## Authentication Flow

**Old flow:**
```
Guest login → localStorage
      ↓
   Signup → both localStorage + MongoDB
      ↓
   Sync in background
```

**New flow:**
```
Signup → MongoDB
   ↓
Token stored in localStorage
   ↓
Signin → Database read
   ↓
Each request uses token from localStorage
```

## Data Structure Changes

### Old Deck Model
```typescript
{
  id: "deck_123",
  userId: "user_123",
  title: "Chapter 3",
  flashcards: [...],
  stats: { timesStudied: 5, averageScore: 87 }
}
```

### New Topic Model
```typescript
{
  id: "507f...",
  userId: "507f...", // ObjectId ref
  title: "Chapter 3",
  description: "...",
  subject: "Biology",
  tags: ["chapter-3"],
  createdAt: Date,
  updatedAt: Date
}
```

**Key differences:**
- MongoDB ObjectId instead of custom strings
- No embedded flashcards (now in separate GeneratedContent/UploadedFile)
- No stats (moved to GeneratedContent)
- Simplified, focus on organization

### New UploadedFile Model
```typescript
{
  id: ObjectId,
  userId: ObjectId,
  topicId: ObjectId,
  originalName: "Chapter 3 Notes.pdf",
  filename: "notes-123.pdf",
  fileType: "pdf",
  mimeType: "application/pdf",
  storagePath: "s3://bucket/...",
  size: 2048576,
  metadata: { pageCount: 15 }
}
```

### New GeneratedContent Model
```typescript
{
  id: ObjectId,
  userId: ObjectId,
  topicId: ObjectId,
  contentType: "short-form-video",
  aiModel: "gemini",
  status: "completed",
  contentPath: "s3://bucket/video.mp4",
  generationMetadata: {
    prompt: "...",
    executionTimeMs: 45000,
    tokensUsed: 1250
  },
  contentMetadata: {
    duration: 30
  }
}
```

## Multi-Device Consistency

**Important:** With the database-first approach, data is immediately consistent across devices.

```typescript
// Device A
const topic = await topicAPI.create('New Topic');

// Device B (immediately sees it)
const topics = await topicAPI.list(); // includes 'New Topic'
```

No sync delay, no conflict handling needed.

## Token Management

Tokens are stored in localStorage (read-through cache):

```typescript
// After signup/signin, token is auto-stored
setToken(data.token); // Inside authAPI

// Every API call uses it
const token = getToken(); // Retrieved automatically

// On logout, token is cleared
authAPI.logout(); // Clears token
```

## Error Handling

**Old way (with fallback):**
```typescript
try {
  const data = await deckAPI.getDecks();
} catch {
  // Fall back to localStorage
  const data = localStorage.getItem('decks');
}
```

**New way (direct, no fallback):**
```typescript
try {
  const topics = await topicAPI.list();
} catch (error) {
  // Offline? No internet? Show error to user
  console.error('Failed to load topics:', error.message);
  // Options: Show offline banner, retry, etc.
}
```

## Testing Checklist

- [ ] Signup creates user in MongoDB
- [ ] Signin retrieves user and sets token
- [ ] Topic create/read/update/delete works
- [ ] File metadata endpoints respond correctly
- [ ] Generated content endpoints respond correctly
- [ ] User can only see their own data
- [ ] Token expiration handled (shows error)
- [ ] Multi-device consistency verified
- [ ] No offline support (expected)
- [ ] No guest login (expected)

## Troubleshooting

**Error: "Unauthorized"**
- Token expired or invalid
- Call `authAPI.logout()` and redirect to login
- Token not being sent in Authorization header

**Error: "Topic not found"**
- Topic doesn't exist
- User doesn't own this topic (user-scoped check)
- Check topicId is valid ObjectId

**Error: "Internal server error"**
- Server-side error, check backend logs
- Check MongoDB connection
- Check environment variables (JWT_SECRET, MONGODB_URI)

## Performance Optimization

**localStorage as read-through cache:**

```typescript
// Optional: Cache topics locally for faster UI renders
const cachedTopics = localStorage.getItem('topics_cache');
if (cachedTopics) {
  setTopics(JSON.parse(cachedTopics)); // Show cached first
}

// Then fetch fresh from DB
const topics = await topicAPI.list();
setTopics(topics);
localStorage.setItem('topics_cache', JSON.stringify(topics));
```

**Note:** Cache is optional, never used as source of truth.

## Summary

✅ **Fully online, database-backed**  
✅ **User-scoped data access**  
✅ **No guest login support**  
✅ **No offline functionality**  
✅ **Multi-device consistency via DB reads**  
✅ **All endpoints ready for integration**  
✅ **Build passing, TypeScript verified**  

Ready for frontend development!
