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

