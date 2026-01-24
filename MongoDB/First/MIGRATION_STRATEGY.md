# MongoDB + Authentication Migration Strategy

## Executive Summary

This document outlines the migration strategy from localStorage-only storage to a hybrid MongoDB + localStorage system for the StudyToks application.

## Architecture Overview

```
┌─────────────┐         ┌──────────────────┐
│   Browser   │         │   MongoDB Atlas  │
│             │         │                  │
│ localStorage│◄──────► │  Mongoose Schemas│
│  (offline)  │ (sync)  │                  │
└─────────────┘         └──────────────────┘
      │
      └──────────────────────┐
                             │
                        ┌────▼─────────┐
                        │ API Routes   │
                        │ (Next.js App │
                        │  Router)     │
                        └──────────────┘
```

## Implementation Strategy: Dual-Write Pattern

The app uses a **dual-write strategy** for maximum reliability:

1. **Immediate Local Write**: Data is saved to localStorage immediately for instant UX
2. **Background Cloud Sync**: API call syncs to MongoDB in the background
3. **Fallback Mechanism**: If API fails, app continues working with local data
4. **Eventual Consistency**: When connection restored, data syncs automatically

### Benefits
- ✅ Works offline
- ✅ Instant user feedback (no waiting for API)
- ✅ Graceful degradation (continues without MongoDB)
- ✅ Multi-device sync when online

## Phase 1: Foundation (Current - Completed)

### Dependencies Installed
```bash
- mongoose@^8.0.0       # MongoDB ODM
- jsonwebtoken@^9.0.0   # JWT authentication
- bcryptjs@^2.4.3       # Password hashing
- next-auth@^4.24.0     # Authentication middleware
```

### New Files Created

#### Database Connection
- `src/lib/mongodb.ts` - MongoDB connection pooling

#### Mongoose Schemas
- `src/lib/models/User.ts` - User document structure
- `src/lib/models/Deck.ts` - Study deck structure
- `src/lib/models/StudySession.ts` - Session tracking

#### API Routes (Next.js App Router)
```
src/app/api/
├── auth/route.ts          # POST: signup, signin, guest login
├── users/route.ts         # GET: profile, PUT: update profile
├── decks/route.ts         # GET: list, POST: create
├── decks/[id]/route.ts    # PUT: update, DELETE: remove
└── sessions/route.ts      # GET: list, POST: create session
```

#### API Client
- `src/lib/api.ts` - Hybrid storage client with fallback logic

#### Configuration
- `.env.example` - Environment template
- `.env.local` - Development environment (git-ignored)
- `MONGODB_SETUP.md` - Setup instructions

### Updated Components
- `src/app/account/page.tsx` - Integrated hybrid storage API

## Phase 2: Testing (Next Steps)

### Unit Tests to Add
```typescript
// Test hybrid storage fallback
- authAPI.guestLogin() // Should fallback to localStorage
- deckAPI.getDecks()   // Should handle offline gracefully
- hybridStorage.saveUser() // Should dual-write
```

### Integration Tests
```bash
# Test with MongoDB connected
- User can sign up/in
- Decks persist across page refresh
- Sessions track correctly

# Test with MongoDB offline
- App continues working with localStorage
- Sync error appears but doesn't break app
- Data syncs when online
```

## Phase 3: Migration Path for Existing Users

### Option A: Automatic Migration (Recommended)
```typescript
// On first load with updated code:
// 1. Check localStorage for existing data
// 2. If user exists, create DB account
// 3. Upload all local data to MongoDB
// 4. Continue with hybrid storage
```

### Option B: Manual Migration
Users can optionally:
1. Export all data (blue button in account)
2. Create new account with MongoDB
3. Import data via admin UI (to be built)

### Option C: Coexistence Period
```
Week 1-2: Both systems work in parallel
Week 3-4: Migrate 50% of users
Week 4-6: Gradual rollout, monitor performance
```

## File Structure

```
web/
├── src/
│   ├── app/
│   │   ├── api/                  # NEW - API endpoints
│   │   │   ├── auth/
│   │   │   ├── users/
│   │   │   ├── decks/
│   │   │   │   └── [id]/
│   │   │   └── sessions/
│   │   ├── account/
│   │   │   └── page.tsx         # UPDATED - Uses hybrid API
│   │   ├── home.tsx
│   │   ├── layout.tsx
│   │   └── page.tsx
│   └── lib/
│       ├── mongodb.ts           # NEW - DB connection
│       ├── api.ts               # NEW - Hybrid storage client
│       └── models/              # NEW - Mongoose schemas
│           ├── User.ts
│           ├── Deck.ts
│           └── StudySession.ts
├── .env.example                 # NEW
├── .env.local                   # NEW (git-ignored)
├── MONGODB_SETUP.md             # NEW - Setup guide
└── package.json                 # UPDATED - New deps
```

## API Endpoints

### Authentication `POST /api/auth`

**Sign Up**
```bash
curl -X POST http://localhost:3000/api/auth \
  -H "Content-Type: application/json" \
  -d '{
    "action": "signup",
    "email": "user@example.com",
    "password": "securepass123",
    "name": "John Doe"
  }'
```

**Sign In**
```bash
curl -X POST http://localhost:3000/api/auth \
  -H "Content-Type: application/json" \
  -d '{
    "action": "signin",
    "email": "user@example.com",
    "password": "securepass123"
  }'
```

**Guest Login**
```bash
curl -X POST http://localhost:3000/api/auth \
  -H "Content-Type: application/json" \
  -d '{ "action": "guest" }'
```

### User Profile `GET/PUT /api/users`

**Get Profile** (requires auth)
```bash
curl -X GET http://localhost:3000/api/users \
  -H "Authorization: Bearer YOUR_TOKEN"
```

**Update Profile** (requires auth)
```bash
curl -X PUT http://localhost:3000/api/users \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Updated Name",
    "preferences": {
      "theme": "dark",
      "studyGoal": 45
    }
  }'
```

### Decks `/api/decks`

**List Decks** (requires auth)
```bash
curl -X GET http://localhost:3000/api/decks \
  -H "Authorization: Bearer YOUR_TOKEN"
```

**Create Deck**
```bash
curl -X POST http://localhost:3000/api/decks \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Biology 101",
    "description": "Cell structure",
    "content": {
      "flashcards": [...]
    }
  }'
```

### Study Sessions `/api/sessions`

**List Sessions**
```bash
curl -X GET http://localhost:3000/api/sessions \
  -H "Authorization: Bearer YOUR_TOKEN"
```

**Create Session**
```bash
curl -X POST http://localhost:3000/api/sessions \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "deckId": "deck_123",
    "deckTitle": "Biology 101",
    "duration": 25,
    "score": 85,
    "cardsStudied": 15
  }'
```

## Environment Variables

### Development Setup
```bash
# .env.local

# MongoDB (get from Atlas)
MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/studytoks

# JWT signing key
JWT_SECRET=dev-secret-key-change-in-production

# Storage mode: hybrid, db, or local
NEXT_PUBLIC_STORAGE_MODE=hybrid

# API endpoint
NEXT_PUBLIC_API_URL=http://localhost:3000

# Node environment
NODE_ENV=development
```

### Production Setup
```bash
# Use strong JWT_SECRET
JWT_SECRET=$(openssl rand -base64 32)

# Use production MongoDB URI
MONGODB_URI=mongodb+srv://prod-user:prod-pass@prod-cluster.mongodb.net/studytoks-prod

# Use database-first mode
NEXT_PUBLIC_STORAGE_MODE=db

# Production API
NEXT_PUBLIC_API_URL=https://yourdomain.com

NODE_ENV=production
```

## Fallback & Error Handling

### Storage Mode Selection

**Hybrid Mode** (Recommended)
```typescript
// Try MongoDB → Fallback to localStorage
async getDecks() {
  try {
    return await deckAPI.getDecks(); // DB
  } catch (error) {
    return await getLocalDecks(); // Fallback
  }
}
```

**Error Messages to User**
```
🟡 "Failed to sync. Using offline mode."
🔴 "Connection error. Your changes are saved locally."
🟢 "Synced successfully to cloud."
```

### Graceful Degradation

| Feature | Online | Offline |
|---------|--------|---------|
| Sign In | ✅ DB | ✅ Demo |
| Create Deck | ✅ Sync | ✅ Local |
| Update Profile | ✅ Sync | ✅ Local |
| View History | ✅ DB | ✅ Local |
| Multi-Device | ✅ Yes | ❌ No |

## Security Considerations

### Authentication Flow
1. User signs in with email/password
2. Server verifies credentials (bcryptjs)
3. Server issues JWT token (7 day expiry)
4. Client stores token in localStorage
5. Client includes token in API Authorization header

### Data Protection
- ✅ Passwords hashed with bcryptjs (10 rounds)
- ✅ JWT signed with secret key
- ✅ API endpoints require token verification
- ✅ MongoDB requires IP whitelist

### Production Checklist
- [ ] Change JWT_SECRET before deploying
- [ ] Use HTTPS/TLS for all connections
- [ ] Enable MongoDB backups
- [ ] Set up API rate limiting
- [ ] Add CORS configuration
- [ ] Monitor for suspicious activity
- [ ] Regular security audits

## Performance Optimization

### Current Optimizations
- Connection pooling via Mongoose
- JWT token caching in localStorage
- IndexedDB as potential future layer

### Future Optimizations
- Add service worker for offline-first PWA
- Implement request batching
- Cache user profiles with stale-while-revalidate
- Stream large data sets
- Add request deduplication

## Rollback Plan

If issues occur:

1. **Data Integrity Check**
   ```bash
   # Verify all user data is in MongoDB
   db.users.count()
   db.decks.count()
   db.studySessions.count()
   ```

2. **Revert to localStorage**
   ```bash
   # Set environment variable
   NEXT_PUBLIC_STORAGE_MODE=local
   
   # Redeploy
   npm run build && npm start
   ```

3. **Restore from MongoDB Backup**
   ```bash
   # MongoDB automatic backups
   # Available in Atlas dashboard
   # Contact MongoDB support if needed
   ```

## Monitoring & Logging

### Metrics to Track
- API response times
- Sync success rate
- Fallback usage rate
- Error frequency by endpoint
- User sign-up/in success rate

### Logging
```typescript
// In API routes
console.log('Deck saved:', deckId, 'duration:', time);
console.error('Sync failed:', error.message);

// In client
if (syncError) {
  console.warn('Using offline mode:', syncError);
}
```

## Testing Checklist

### Unit Tests
- [ ] JWT token generation
- [ ] Password hashing
- [ ] MongoDB connection
- [ ] Hybrid storage fallback

### Integration Tests
- [ ] Sign up → Create deck → Track session
- [ ] Offline → Online sync
- [ ] Multi-device consistency

### Performance Tests
- [ ] API response time < 200ms
- [ ] 1000 concurrent users
- [ ] Large dataset handling (10k+ decks)

## Next Steps

1. **Get MongoDB Atlas Setup** - Follow [MONGODB_SETUP.md](../MONGODB_SETUP.md)
2. **Add Email Verification** - Verify user email addresses
3. **Add OAuth** - Google/GitHub authentication
4. **Add API Rate Limiting** - Prevent abuse
5. **Add Data Export** - User data portability
6. **Add Admin Dashboard** - Monitor users & data
7. **Add Analytics** - Track usage patterns
8. **Add Notifications** - Email/push notifications

## Troubleshooting

### MongoDB Connection Failed
- Check `.env.local` has correct `MONGODB_URI`
- Verify MongoDB cluster is running
- Confirm IP is whitelisted in Atlas
- Check network connectivity

### User Can't Sign In
- Check `JWT_SECRET` is set
- Verify user exists in MongoDB
- Check browser console for errors
- Clear cookies & cache

### Data Not Syncing
- Check network tab in DevTools
- Look for API error responses
- Verify token hasn't expired
- Try manual page refresh

## References

- [MongoDB Atlas Documentation](https://docs.mongodb.com/cloud/atlas/)
- [Mongoose Documentation](https://mongoosejs.com/)
- [Next.js API Routes](https://nextjs.org/docs/api-routes/introduction)
- [JWT Best Practices](https://tools.ietf.org/html/rfc7519)
- [bcryptjs Security](https://github.com/dcodeIO/bcrypt.js)
