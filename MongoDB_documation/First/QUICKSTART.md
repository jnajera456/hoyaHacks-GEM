# 🚀 Quick Start Guide - MongoDB Implementation

## What's New?

Your project now has a complete backend with MongoDB, authentication, and a hybrid storage system that works offline!

**Time to get running: ~15 minutes**

## Step 1: Get MongoDB (5 min)

Go to [mongodb.com/cloud/atlas](https://www.mongodb.com/cloud/atlas) and:
1. Create a free account
2. Create a cluster (use "Shared" tier - it's free)
3. Create a database user with username & password
4. Copy your connection string

More details in: [`MONGODB_SETUP.md`](./MONGODB_SETUP.md)

## Step 2: Configure Environment (2 min)

```bash
cd web

# Copy the template
cp .env.example .env.local

# Edit .env.local with your values
# Replace MONGODB_URI with your connection string from Atlas
```

Example `.env.local`:
```
MONGODB_URI=mongodb+srv://user:password@cluster0.mongodb.net/studytoks?retryWrites=true&w=majority
JWT_SECRET=your-secret-key-here
NEXT_PUBLIC_STORAGE_MODE=hybrid
NEXT_PUBLIC_API_URL=http://localhost:3000
NODE_ENV=development
```

## Step 3: Run Development Server (1 min)

```bash
# From web/ directory
npm run dev
```

Visit [http://localhost:3000](http://localhost:3000)

## Step 4: Test It! (5 min)

1. **Sign In**
   - Click "Sign In with Demo Account"
   - Refresh page → data still there ✅

2. **Create a Deck**
   - Go to account page
   - You can see your demo data

3. **Test Offline**
   - Open DevTools (F12)
   - Network tab → Offline
   - Create a new deck
   - App still works! ✅
   - Come back online → data syncs ✅

4. **Check Data**
   - Open DevTools → Application → Local Storage
   - See `auth_token` and `studytoks_*` keys

## What Works Now

✅ User authentication (sign up, sign in, guest login)
✅ Profile management
✅ Create/edit/delete study decks
✅ Track study sessions
✅ Works completely offline
✅ Syncs to cloud when online
✅ All data persists across page refreshes

## File Structure

```
web/
├── src/
│   ├── app/
│   │   ├── api/              ← NEW: API endpoints
│   │   │   ├── auth/         ← Login/signup
│   │   │   ├── users/        ← Profile
│   │   │   ├── decks/        ← Deck management
│   │   │   └── sessions/     ← Study tracking
│   │   └── account/          ← Updated to use APIs
│   └── lib/
│       ├── mongodb.ts        ← NEW: DB connection
│       ├── api.ts            ← NEW: Smart API client
│       └── models/           ← NEW: Data schemas
├── .env.local                ← NEW: Your config (keep secret!)
└── MONGODB_SETUP.md          ← NEW: Detailed setup
```

## How It Works - The Smart System

### Hybrid Storage
Your app uses a **dual-write pattern** for maximum reliability:

```
When you save data:
1. Instantly saves to browser (localStorage)
2. Returns to you immediately (no delay)
3. In background, syncs to MongoDB cloud
4. If sync fails? No problem! Uses local copy
5. If you go offline? Works completely fine!
```

### Storage Modes

Change the mode in `.env.local`:

```
NEXT_PUBLIC_STORAGE_MODE=hybrid  ← Recommended (cloud + offline)
NEXT_PUBLIC_STORAGE_MODE=db      ← Cloud only (need internet)
NEXT_PUBLIC_STORAGE_MODE=local   ← Offline only (no cloud)
```

## API Reference

### Sign In
```bash
curl -X POST http://localhost:3000/api/auth \
  -H "Content-Type: application/json" \
  -d '{"action":"guest"}'
```

### Get Your Decks
```bash
curl -X GET http://localhost:3000/api/decks \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### Create a Deck
```bash
curl -X POST http://localhost:3000/api/decks \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Biology",
    "description": "Cell structure",
    "content": {"flashcards": []}
  }'
```

More endpoints in [`MIGRATION_STRATEGY.md`](./MIGRATION_STRATEGY.md#api-endpoints)

## Troubleshooting

### MongoDB Won't Connect
```
Error: "Please define the MONGODB_URI environment variable"

Fix: 
1. Check .env.local exists in web/ directory
2. Check MONGODB_URI is set correctly
3. Check your MongoDB cluster is running
4. Check your IP is whitelisted in MongoDB Atlas
5. Restart dev server: npm run dev
```

### Data Not Appearing
```
1. Try signing out and back in
2. Hard refresh (Ctrl+Shift+R or Cmd+Shift+R)
3. Check browser localStorage (DevTools > Application)
4. Check browser console for errors
```

### Port 3000 Already in Use
```
Kill the process:
lsof -ti:3000 | xargs kill -9

Then restart:
npm run dev
```

## Production Setup

When ready to deploy:

1. **Generate strong JWT secret**
   ```bash
   openssl rand -base64 32
   ```

2. **Use production MongoDB**
   - Create separate MongoDB cluster for production
   - Restrict network access to your server

3. **Set environment variables** in your hosting:
   - Vercel: Settings > Environment Variables
   - Netlify: Build & Deploy > Environment

4. **Deploy**
   ```bash
   npm run build
   npm start
   ```

## Documentation

- 📘 **[MONGODB_SETUP.md](./MONGODB_SETUP.md)** - Detailed MongoDB setup guide
- 📗 **[MIGRATION_STRATEGY.md](./MIGRATION_STRATEGY.md)** - Complete technical documentation
- 📙 **[IMPLEMENTATION_SUMMARY.md](./IMPLEMENTATION_SUMMARY.md)** - Feature overview
- 📕 **[CHANGES.md](./CHANGES.md)** - All files changed/added

## Dependencies Installed

```
✅ mongoose               - MongoDB connection
✅ jsonwebtoken          - User authentication
✅ bcryptjs              - Password hashing
✅ next-auth             - Auth middleware
✅ @types/*              - TypeScript support
```

Run `npm list` to see all packages.

## Next Steps

1. ✅ Get MongoDB running (follow MONGODB_SETUP.md)
2. ✅ Test locally with `npm run dev`
3. ⏳ Add email verification
4. ⏳ Add OAuth (Google/GitHub)
5. ⏳ Deploy to production

## Architecture Overview

```
┌─────────────────────────────────┐
│  Your App (Browser)             │
│  - Sign in                      │
│  - Create/edit decks            │
│  - Track study sessions         │
└──────────────┬──────────────────┘
               │
        ┌──────┴──────┐
        │             │
        ▼             ▼
┌──────────────┐  ┌───────────────────┐
│ localStorage │  │  Next.js API      │
│  (instant)   │  │  (/api/*)         │
└──────────────┘  └─────────┬─────────┘
                            │
                            ▼
                    ┌───────────────────┐
                    │  MongoDB Atlas    │
                    │  (cloud storage)  │
                    └───────────────────┘
```

## What Each API Does

| Route | Purpose | Example |
|-------|---------|---------|
| `/api/auth` | Login/signup | `POST { action: "guest" }` |
| `/api/users` | Your profile | `GET` your data |
| `/api/decks` | Study materials | `GET` all decks, `POST` new deck |
| `/api/sessions` | Study history | `GET` past sessions |

## Key Features Explained

### 🔐 Authentication
- Sign in with demo account
- Guest login creates temporary account
- Passwords securely hashed

### ☁️ Cloud Sync
- Automatic background sync to MongoDB
- Works without internet
- Syncs when you come back online

### 📱 Multi-Device
- Sign in on another device
- Your data is there!
- Uses cloud storage

### 🚀 Performance
- Instant UI updates (localStorage)
- Background cloud sync
- No waiting for network

### 🛡️ Reliability
- If MongoDB down → uses localStorage
- If offline → works completely
- If sync fails → tries again later

## Common Questions

**Q: Do I need MongoDB to develop?**
A: No! It works offline with localStorage. MongoDB is optional for cloud sync.

**Q: Is my data safe?**
A: Yes! Passwords are hashed, data requires authentication token, MongoDB has backups.

**Q: How much does MongoDB cost?**
A: Free tier includes 512MB storage. Perfect for getting started!

**Q: Can I use a different database?**
A: Yes, but would need to rewrite the models and API routes.

**Q: Is this production-ready?**
A: Yes! But review the security checklist in MIGRATION_STRATEGY.md first.

## Getting Help

1. Check the error message in browser console (F12)
2. Read relevant documentation:
   - Setup issues → MONGODB_SETUP.md
   - API issues → MIGRATION_STRATEGY.md
   - Feature overview → IMPLEMENTATION_SUMMARY.md
3. Check code comments in `src/lib/api.ts`

## Ready to Roll! 🎉

```bash
# Do this:
1. Follow MONGODB_SETUP.md (5-10 min)
2. Add to .env.local
3. npm run dev
4. Open http://localhost:3000
5. Test it out!
```

## Summary

✅ **Backend ready to go**
✅ **5 API endpoints working**
✅ **Offline support included**
✅ **TypeScript type-safe**
✅ **Production ready**

You now have a professional backend with:
- User authentication
- MongoDB cloud storage
- Offline-first support
- Hybrid sync strategy
- Type safety
- Error handling

Time to build! 🚀
