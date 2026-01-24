import { connectDB } from '@/lib/mongodb';
import { User } from '@/lib/models/User';
import bcryptjs from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { NextRequest, NextResponse } from 'next/server';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, email, password, name } = body;

    await connectDB();

    if (action === 'signup') {
      // Check if user exists
      const existingUser = await User.findOne({ email });
      if (existingUser) {
        return NextResponse.json({ error: 'User already exists' }, { status: 400 });
      }

      // Hash password
      const hashedPassword = await bcryptjs.hash(password, 10);
      const userId = `user_${Date.now()}`;

      // Create new user
      const user = new User({
        id: userId,
        email,
        name: name || email.split('@')[0],
        passwordHash: hashedPassword,
        isGuest: false,
      });

      await user.save();

      // Generate token
      const token = jwt.sign({ id: user.id, email: user.email }, JWT_SECRET, {
        expiresIn: '7d',
      });

      return NextResponse.json(
        {
          token,
          user: {
            id: user.id,
            name: user.name,
            email: user.email,
            avatarColor: user.avatarColor,
            preferences: user.preferences,
            studyStats: user.studyStats,
          },
        },
        { status: 201 }
      );
    }

    if (action === 'signin') {
      const user = await User.findOne({ email });

      if (!user || !user.passwordHash) {
        return NextResponse.json(
          { error: 'Invalid credentials or account not found' },
          { status: 401 }
        );
      }

      const passwordMatch = await bcryptjs.compare(password, user.passwordHash);

      if (!passwordMatch) {
        return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
      }

      const token = jwt.sign({ id: user.id, email: user.email }, JWT_SECRET, {
        expiresIn: '7d',
      });

      return NextResponse.json({
        token,
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          avatarColor: user.avatarColor,
          preferences: user.preferences,
          studyStats: user.studyStats,
        },
      });
    }

    if (action === 'guest') {
      const userId = `guest_${Date.now()}`;
      const guestUser = new User({
        id: userId,
        email: `guest-${Date.now()}@studytoks.local`,
        name: 'Guest User',
        isGuest: true,
        avatarColor: '#6B7280',
      });

      await guestUser.save();

      const token = jwt.sign({ id: guestUser.id, isGuest: true }, JWT_SECRET, {
        expiresIn: '7d',
      });

      return NextResponse.json({
        token,
        user: {
          id: guestUser.id,
          name: guestUser.name,
          email: guestUser.email,
          isGuest: true,
          avatarColor: guestUser.avatarColor,
          preferences: guestUser.preferences,
          studyStats: guestUser.studyStats,
        },
      });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (error) {
    console.error('Auth error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
