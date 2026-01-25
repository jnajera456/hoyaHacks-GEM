import { connectDB } from '@/lib/mongodb';
import { User } from '@/lib/models/User';
import {
  comparePassword,
  generateToken,
  setTokenCookie,
} from '@/lib/auth';
import { NextRequest, NextResponse } from 'next/server';

/**
 * POST /api/auth/login - Login user
 * Body: { email, password }
 * Returns: { user: { id, email, name } }
 * Sets: httpOnly auth_token cookie
 */
export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json();

    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email and password are required' },
        { status: 400 }
      );
    }

    await connectDB();

    const user = await User.findOne({ email: email.toLowerCase() });

    if (!user) {
      return NextResponse.json(
        { error: 'Invalid email or password' },
        { status: 401 }
      );
    }

    const passwordMatch = await comparePassword(password, user.passwordHash);

    if (!passwordMatch) {
      return NextResponse.json(
        { error: 'Invalid email or password' },
        { status: 401 }
      );
    }

    const token = generateToken(user._id.toString());

    const response = NextResponse.json(
      {
        user: {
          id: user._id.toString(),
          email: user.email,
          name: user.name,
        },
      },
      { status: 200 }
    );

    if (process.env.NODE_ENV !== 'production') {
      console.log('login success for', user.email);
    }
    setTokenCookie(response, token);
    return response;
  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
