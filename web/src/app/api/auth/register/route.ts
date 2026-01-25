import { connectDB } from '@/lib/mongodb';
import { User } from '@/lib/models/User';
import {
  hashPassword,
  generateToken,
  setTokenCookie,
} from '@/lib/auth';
import { NextRequest, NextResponse } from 'next/server';

/**
 * POST /api/auth/register - Register a new user
 * Body: { email, password, name? }
 * Returns: { user: { id, email, name } }
 * Sets: httpOnly auth_token cookie
 */
export async function POST(request: NextRequest) {
  try {
    const { email, password, name } = await request.json();

    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email and password are required' },
        { status: 400 }
      );
    }

    await connectDB();

    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return NextResponse.json(
        { error: 'User already exists' },
        { status: 400 }
      );
    }

    const passwordHash = await hashPassword(password);
    const user = new User({
      email: email.toLowerCase(),
      name: name || '',
      passwordHash,
    });

    await user.save();
    const token = generateToken(user._id.toString());

    const response = NextResponse.json(
      {
        user: {
          id: user._id.toString(),
          email: user.email,
          name: user.name,
        },
      },
      { status: 201 }
    );

    setTokenCookie(response, token);
    return response;
  } catch (error) {
    console.error('Register error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
