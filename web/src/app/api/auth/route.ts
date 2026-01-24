/**
 * Auth routes have been moved to dedicated endpoints:
 * - POST /api/auth/register - Register new user
 * - POST /api/auth/login - Login user
 * - POST /api/auth/logout - Logout user
 * - GET /api/auth/me - Get authenticated user profile
 *
 * This file is kept for reference only.
 */

import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  return NextResponse.json(
    {
      error:
        'Use dedicated endpoints: POST /api/auth/register, POST /api/auth/login, POST /api/auth/logout',
    },
    { status: 400 }
  );
}
          { status: 400 }
        );
      }

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
    }

    // LOGIN
    if (pathname.includes('/login')) {
      const { email, password } = body;

      if (!email || !password) {
        return NextResponse.json(
          { error: 'Email and password are required' },
          { status: 400 }
        );
      }

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

      setTokenCookie(response, token);
      return response;
    }

    return NextResponse.json({ error: 'Invalid endpoint' }, { status: 400 });
  } catch (error) {
    console.error('Auth error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

      // Generate JWT token
      const token = jwt.sign(
        { userId: user._id.toString(), email: user.email },
        JWT_SECRET,
        { expiresIn: '7d' }
      );

      return NextResponse.json(
        {
          token,
          user: {
            id: user._id.toString(),
            name: user.name,
            email: user.email,
          },
        },
        { status: 201 }
      );
    }

    if (action === 'signin') {
      const user = await User.findOne({ email: email.toLowerCase() });

      if (!user) {
        return NextResponse.json(
          { error: 'Invalid credentials' },
          { status: 401 }
        );
      }

      // Compare provided password with hashed password
      const passwordMatch = await bcryptjs.compare(password, user.password);

      if (!passwordMatch) {
        return NextResponse.json(
          { error: 'Invalid credentials' },
          { status: 401 }
        );
      }

      // Generate JWT token
      const token = jwt.sign(
        { userId: user._id.toString(), email: user.email },
        JWT_SECRET,
        { expiresIn: '7d' }
      );

      return NextResponse.json({
        token,
        user: {
          id: user._id.toString(),
          name: user.name,
          email: user.email,
        },
      });
    }

    return NextResponse.json({ error: 'Invalid action. Use signup or signin' }, { status: 400 });
  } catch (error) {
    console.error('Auth error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

