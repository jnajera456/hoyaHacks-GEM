# MongoDB Migration & Setup Guide

## Overview
This project uses a hybrid storage strategy that combines MongoDB Atlas for persistent, cloud storage with localStorage for offline-first functionality.

## Prerequisites

1. **MongoDB Atlas Account**: Create a free account at [mongodb.com/cloud/atlas](https://www.mongodb.com/cloud/atlas)
2. **Node.js**: v16+ installed
3. **npm**: v7+ installed

## Setup Steps

### 1. Create MongoDB Atlas Cluster

1. Go to [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
2. Create a free account and sign in
3. Create a new project (or use default)
4. Create a new cluster:
   - Select "Create" on the Clusters page
   - Choose "Shared Clusters" (Free tier)
   - Select your preferred cloud provider and region (AWS, Google Cloud, or Azure)
   - Click "Create Cluster" and wait for initialization (5-10 minutes)

### 2. Configure Database Access

1. In Atlas, go to "Database Access"
2. Click "Add New Database User"
3. Create a username and password (save these!)
4. Assign "Built-in Role": `Atlas admin`
5. Click "Add User"

### 3. Set Up Network Access

1. In Atlas, go to "Network Access"
2. Click "Add IP Address"
3. Select "Allow Access from Anywhere" (or specify your IP for security)
4. Click "Confirm"

### 4. Get Connection String

1. In Atlas, go to "Clusters" and click "Connect" on your cluster
2. Select "Connect your application"
3. Choose "Node.js" driver
4. Copy the connection string
5. Replace `<username>` and `<password>` with your credentials
6. Replace `myFirstDatabase` with `studytoks`

Example:
```
mongodb+srv://user:password@cluster0.mongodb.net/studytoks?retryWrites=true&w=majority
```

### 5. Configure Environment Variables

1. Copy `.env.example` to `.env.local`:
   ```bash
   cp .env.example .env.local
   ```

2. Update `.env.local` with your values:
   ```
   MONGODB_URI=mongodb+srv://username:password@cluster0.mongodb.net/studytoks?retryWrites=true&w=majority
   JWT_SECRET=change-this-to-a-random-secret-in-production
   NEXT_PUBLIC_STORAGE_MODE=hybrid
   NEXT_PUBLIC_API_URL=http://localhost:3000
   NODE_ENV=development
   ```

### 6. Install Dependencies

```bash
cd web
npm install
```

### 7. Run Development Server

```bash
npm run dev
```

Visit [http://localhost:3000](http://localhost:3000) to test the app.

## Storage Strategy

### Hybrid Mode (Recommended)
- **Default**: `NEXT_PUBLIC_STORAGE_MODE=hybrid`
- Tries MongoDB first, falls back to localStorage
- Best for development and production
- Works offline

### Database Only Mode
- `NEXT_PUBLIC_STORAGE_MODE=db`
- Requires MongoDB connection
- Better for production with reliable internet

### Local Storage Only Mode
- `NEXT_PUBLIC_STORAGE_MODE=local`
- Uses browser localStorage only
- Good for offline demos
- Data lost when localStorage is cleared

## API Endpoints

### Authentication
- `POST /api/auth` - Sign up, sign in, or login as guest
  ```json
  // Sign up
  { "action": "signup", "email": "user@email.com", "password": "pass", "name": "John" }
  
  // Sign in
  { "action": "signin", "email": "user@email.com", "password": "pass" }
  
  // Guest login
  { "action": "guest" }
  ```

### Users
- `GET /api/users` - Get user profile (requires auth)
- `PUT /api/users` - Update user profile (requires auth)

### Decks
- `GET /api/decks` - Get all user decks (requires auth)
- `POST /api/decks` - Create new deck (requires auth)
- `PUT /api/decks/[id]` - Update deck (requires auth)
- `DELETE /api/decks/[id]` - Delete deck (requires auth)

### Study Sessions
- `GET /api/sessions` - Get all study sessions (requires auth)
- `POST /api/sessions` - Create new session (requires auth)

## File Structure

```
web/
├── src/
│   ├── app/
│   │   ├── api/                 # API route handlers
│   │   │   ├── auth/            # Authentication routes
│   │   │   ├── users/           # User profile routes
│   │   │   ├── decks/           # Deck CRUD routes
│   │   │   └── sessions/        # Study session routes
│   │   └── account/             # Account page component
│   └── lib/
│       ├── mongodb.ts           # MongoDB connection
│       ├── api.ts               # API client with hybrid storage
│       └── models/
│           ├── User.ts          # User schema
│           ├── Deck.ts          # Deck schema
│           └── StudySession.ts  # Session schema
├── .env.example                 # Example env variables
├── .env.local                   # Local env variables (git-ignored)
└── package.json
```

## Troubleshooting

### MongoDB Connection Error
- Check MONGODB_URI in .env.local
- Verify credentials are correct
- Ensure IP is whitelisted in MongoDB Atlas Network Access
- Check Network tab in browser dev tools for API errors

### Data Not Syncing
- Check browser console for errors
- Verify MongoDB is running and connection is valid
- Try refreshing the page
- Check localStorage (DevTools > Application > Local Storage)

### Offline/Fallback Mode
- App will use localStorage automatically if MongoDB is unavailable
- Check browser console for warnings about sync failures
- Data will sync to MongoDB when connection is restored

## Deployment Considerations

### Production Setup
1. Use a strong JWT_SECRET
2. Restrict MongoDB Network Access to specific IPs
3. Use environment-specific databases
4. Enable MongoDB backups
5. Consider using MongoDB compression for production

### Vercel/Netlify Deployment
1. Add environment variables to hosting platform
2. MongoDB Atlas IP whitelist must include hosting provider IPs
3. Deploy and test thoroughly

## Next Steps

1. Test sign-in and sign-up functionality
2. Create and save study decks
3. Track study sessions
4. Verify data persists across sessions
5. Test offline functionality by disabling network

## Security Notes

- Never commit `.env.local` or credentials to git
- Change JWT_SECRET in production
- Use HTTPS in production
- Validate all user input on the server
- Keep dependencies updated: `npm audit fix`

## Support

For MongoDB issues: [MongoDB Docs](https://docs.mongodb.com/)
For Next.js issues: [Next.js Docs](https://nextjs.org/docs)
