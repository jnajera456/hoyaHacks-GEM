import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import { ensureDbIndexes } from '@/lib/dbInit';
import mongoose from 'mongoose';
import { getTokenFromRequest, verifyToken } from '@/lib/auth';

/**
 * GET /api/admin/bootstrap
 * Requires authentication cookie. Initializes collections/indexes and returns DB info.
 */
export async function GET(request: NextRequest) {
  try {
    const token = getTokenFromRequest(request);
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const decoded = verifyToken(token);
    if (!decoded) return NextResponse.json({ error: 'Invalid token' }, { status: 401 });

    const conn = await connectDB();
    await ensureDbIndexes();

    const db = mongoose.connection.db;
    if (!db) {
      return NextResponse.json({ error: 'Database not connected' }, { status: 500 });
    }
    
    const collections = await db.listCollections().toArray();

    return NextResponse.json({
      database: db.databaseName,
      collections: collections.map(c => c.name).sort(),
      message: 'Bootstrap complete: collections/indexes ensured',
    });
  } catch (error) {
    console.error('Bootstrap error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
