# E2E Verification Guide

## ✅ Implementation Complete

All cookie-based authentication and MongoDB persistence features have been implemented. The system now:

1. **Uses cookie-based JWT auth** across all endpoints (no more Authorization headers)
2. **Persists all decks to MongoDB** with automatic retrieval
3. **Automatically bootstraps DB** collections and indexes on first request
4. **Removes sessionStorage dependencies** - DB is single source of truth
5. **Handles edge cases** with clear error messages

---

## 🧪 E2E Test Flows

### Flow 1: Happy Path (Complete User Journey)

#### Step 1: Sign Up
```bash
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"name":"Test User","email":"test@example.com","password":"password123"}' \
  -c cookies.txt -v
```
✅ Expected: 201 status, `auth_token` cookie set, user object returned

#### Step 2: Verify Session
```bash
curl http://localhost:3000/api/auth/me \
  -b cookies.txt -v
```
✅ Expected: Returns `{ user: { id, name, email } }`

#### Step 3: Generate Deck
```bash
curl -X POST http://localhost:3000/api/generate \
  -H "Content-Type: application/json" \
  -b cookies.txt \
  -d '{"text":"Photosynthesis is the process plants use to convert light into energy"}' \
  > generated.json
```
✅ Expected: Returns `{ success: true, deck: {...}, materials: [...], savedDeckId: "..." }`
✅ Check console: "✅ Database bootstrap complete" on first request

#### Step 4: List Decks
```bash
curl http://localhost:3000/api/decks \
  -b cookies.txt | jq
```
✅ Expected: 
```json
{
  "decks": [{
    "id": "...",
    "deckId": "deck_...",
    "title": "...",
    "createdAt": "...",
    "deck": { "id": "...", "title": "...", "materials": [...] }
  }]
}
```

#### Step 5: Fetch Deck by ID
```bash
# Extract ID from previous response
DECK_ID=$(cat generated.json | jq -r '.savedDeckId')
curl http://localhost:3000/api/decks/$DECK_ID \
  -b cookies.txt | jq
```
✅ Expected: Returns full deck payload

#### Step 6: UI Navigation
1. Open http://localhost:3000/account
2. ✅ Should show 1 deck in history
3. Click "Study" button
4. ✅ Should navigate to `/results?id=...`
5. ✅ Results page should load deck from DB (check Network tab - no sessionStorage access)

#### Step 7: Logout
```bash
curl -X POST http://localhost:3000/api/auth/logout \
  -b cookies.txt -c cookies.txt -v
```
✅ Expected: Cookie cleared

#### Step 8: Verify Auth Required
```bash
curl http://localhost:3000/api/decks \
  -b cookies.txt -v
```
✅ Expected: 401 Unauthorized

---

### Flow 2: Edge Case - Deleted Deck

```bash
# Login
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password123"}' \
  -c cookies.txt

# Generate deck
RESPONSE=$(curl -X POST http://localhost:3000/api/generate \
  -H "Content-Type: application/json" \
  -b cookies.txt \
  -d '{"text":"Test content"}')
DECK_ID=$(echo $RESPONSE | jq -r '.savedDeckId')

# Delete deck
curl -X DELETE http://localhost:3000/api/decks/$DECK_ID \
  -b cookies.txt -v

# Try to fetch deleted deck
curl http://localhost:3000/api/decks/$DECK_ID \
  -b cookies.txt -v
```
✅ Expected: 404 Not Found

**UI Test:**
1. Navigate to `/results?id=$DECK_ID`
2. ✅ Should show alert: "This deck was deleted or does not exist."
3. ✅ Should redirect to `/account`

---

### Flow 3: Unauthorized Access

```bash
# Without cookie
curl http://localhost:3000/api/generate \
  -X POST \
  -H "Content-Type: application/json" \
  -d '{"text":"test"}' -v
```
✅ Expected: 401 Unauthorized

**UI Test:**
1. Open browser in incognito mode
2. Navigate to http://localhost:3000/account
3. ✅ Middleware should redirect to `/login?redirect=/account`

---

### Flow 4: Multi-User Isolation

```bash
# User A
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"name":"Alice","email":"alice@test.com","password":"pass123"}' \
  -c alice.txt

curl -X POST http://localhost:3000/api/generate \
  -H "Content-Type: application/json" \
  -b alice.txt \
  -d '{"text":"Alice content"}' | jq -r '.savedDeckId' > alice_deck.txt

# User B
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"name":"Bob","email":"bob@test.com","password":"pass123"}' \
  -c bob.txt

curl -X POST http://localhost:3000/api/generate \
  -H "Content-Type: application/json" \
  -b bob.txt \
  -d '{"text":"Bob content"}' | jq -r '.savedDeckId' > bob_deck.txt

# Check Alice's decks
curl http://localhost:3000/api/decks -b alice.txt | jq '.decks | length'
# ✅ Expected: 1

# Check Bob's decks
curl http://localhost:3000/api/decks -b bob.txt | jq '.decks | length'
# ✅ Expected: 1

# Try Bob accessing Alice's deck
ALICE_DECK=$(cat alice_deck.txt)
curl http://localhost:3000/api/decks/$ALICE_DECK -b bob.txt -v
# ✅ Expected: 404 (ownership check prevents cross-user access)
```

---

### Flow 5: Empty State

```bash
# New user with no decks
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"name":"New User","email":"new@test.com","password":"pass123"}' \
  -c new.txt

curl http://localhost:3000/api/decks -b new.txt
```
✅ Expected: `{ "decks": [] }`

**UI Test:**
1. Login as new user with no decks
2. Navigate to http://localhost:3000/account
3. ✅ Should show empty state with BookOpen icon
4. ✅ Should show "No saved decks yet" message
5. ✅ Should show "Create Your First Deck" button linking to `/`

---

## 🔍 Manual UI Verification Checklist

### Login Flow
- [ ] Navigate to `/login`
- [ ] Enter credentials
- [ ] Successful login redirects to `/` (or redirect param)
- [ ] Cookie persists across page refresh

### Generate Flow
- [ ] Upload file or paste text at `/`
- [ ] Click "Generate Study Materials"
- [ ] Loading state appears
- [ ] Results redirect to `/results?id=<savedDeckId>`
- [ ] Deck renders correctly
- [ ] No console errors

### Account Page
- [ ] `/account` shows user name/email in header
- [ ] Decks tab shows all saved decks
- [ ] Each deck shows:
  - Title
  - Material count
  - Type badges (flashcards, quizzes, etc.)
  - Created date
  - Study/Export/Delete buttons
- [ ] "Study" navigates to `/results?id=...`
- [ ] "Delete" prompts confirmation, then removes deck
- [ ] "Export" downloads JSON file

### Results Page
- [ ] Loads deck from DB via `id` param
- [ ] No sessionStorage fallback used
- [ ] If `id` missing or invalid, redirects to `/account`
- [ ] Flashcard flip works
- [ ] Multiple choice selection works
- [ ] Match game interaction works
- [ ] Navigation between materials works

### Logout
- [ ] Click "Sign Out" on `/account`
- [ ] Redirects to `/login`
- [ ] Cookie cleared
- [ ] Accessing `/account` redirects to login

---

## 🗄️ Database Verification

### Check MongoDB Collections
```javascript
// In MongoDB shell or Compass
use test  // or your DB name from MONGODB_URI

// Users collection
db.users.find().pretty()
// ✅ Should have unique index on email

// Generated decks collection  
db.generateddecks.find().pretty()
// ✅ Should have indexes on userId, deckId, createdAt

// List indexes
db.generateddecks.getIndexes()
```

### Bootstrap Endpoint
```bash
curl http://localhost:3000/api/admin/bootstrap -b cookies.txt | jq
```
✅ Expected:
```json
{
  "message": "Bootstrap complete",
  "database": "test",
  "collections": ["users", "topics", "uploadedfiles", ...]
}
```

---

## 🐛 Known Issues & Notes

1. **sessionStorage for immediate viewing:** `home.tsx` still sets `sessionStorage.currentDeck` for UX smoothness, but results page ONLY uses DB.

2. **First-request bootstrap:** Console will log "✅ Database bootstrap complete" on the first authenticated API request.

3. **R2 integration:** File uploads work; `r2Key` and `topicId` fields in GeneratedDeck schema exist but are not yet populated by generate endpoint.

4. **Preferences:** Account page preferences (theme, notifications, etc.) are local-only; not persisted to User model yet.

---

## 📋 Post-Verification Cleanup

Once E2E passes:
- [ ] Remove `NEXT_PUBLIC_STORAGE_MODE` from `.env.local` if present
- [ ] Remove any unused localStorage/sessionStorage calls (search for `localStorage.getItem('deck')`)
- [ ] Optional: Add Sentry or error tracking for production
- [ ] Optional: Link deck `topicId` and `r2Key` during generate
- [ ] Document MongoDB URI format in README

---

## 🚀 Quick Start for Testing

```bash
# Terminal 1: Ensure MongoDB is running (or use cloud URI)
# Check .env.local has:
# MONGODB_URI=mongodb://localhost:27017/test  # or cloud URI
# JWT_SECRET=<random-secret>
# GEMINI_API_KEY=<your-key>

# Terminal 2: Run dev server
cd web
npm run dev

# Terminal 3: Run test commands above
# OR open browser and test UI flows
```

---

**Status:** ✅ All implementation complete. Ready for E2E verification.
