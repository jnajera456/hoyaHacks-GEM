import { connectDB } from '@/lib/mongodb';
import { User } from '@/lib/models/User';
import { getTokenFromRequest, verifyToken } from '@/lib/auth';
import { NextRequest, NextResponse } from 'next/server';

/**
 * GET /api/auth/me - Get authenticated user profile
 * Requires: httpOnly auth_token cookie
 * Returns: { user: { id, email, name } }
 */
export async function GET(request: NextRequest) {
  try {
    const token = getTokenFromRequest(request);

    if (!token) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const decoded = verifyToken(token);

    if (!decoded) {
      return NextResponse.json(
        { error: 'Invalid token' },
        { status: 401 }
      );
    }

    await connectDB();

    const user = await User.findById(decoded.userId);

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      user: {
        id: user._id.toString(),
        email: user.email,
        name: user.name,
      },
    });
  } catch (error) {
    console.error('Get user error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
