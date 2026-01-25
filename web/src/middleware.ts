import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Protected routes that require authentication cookie
const protectedRoutes = ['/account', '/results'];

// Public routes that should redirect if already has auth cookie
const authRoutes = ['/login', '/signup'];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  
  // Allow auth endpoints and static assets to bypass middleware
  if (pathname.startsWith('/api/auth') || pathname.startsWith('/_next') || pathname === '/favicon.ico') {
    return NextResponse.next();
  }
  
  // Check if auth token cookie exists (simple presence check, not verification)
  // Actual JWT verification happens in API routes and client-side hooks
  const hasAuthToken = !!request.cookies.get('auth_token')?.value;

  if (process.env.NODE_ENV !== 'production') {
    console.log('middleware check', { pathname, hasAuthToken });
  }

  // Check if route is protected
  const isProtectedRoute = protectedRoutes.some(route => pathname.startsWith(route));
  const isAuthRoute = authRoutes.some(route => pathname.startsWith(route));

  // Redirect to login if accessing protected route without auth cookie
  if (isProtectedRoute && !hasAuthToken) {
    const url = new URL('/login', request.url);
    url.searchParams.set('redirect', pathname);
    return NextResponse.redirect(url);
  }

  // Redirect to account if accessing auth pages while having auth cookie
  if (isAuthRoute && hasAuthToken) {
    return NextResponse.redirect(new URL('/account', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization)
     * - favicon.ico (favicon)
     * - public folder
     * - api/auth/* (allow auth endpoints)
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
    '/api/:path*',
  ],
};
