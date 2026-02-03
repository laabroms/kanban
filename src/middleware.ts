import { NextRequest, NextResponse } from 'next/server';
import { validateRequest } from '@/lib/auth';

export async function middleware(request: NextRequest) {
  // Apply authentication to all API routes except login/setup
  if (request.nextUrl.pathname.startsWith('/api/')) {
    // Allow login and setup routes without authentication
    if (
      request.nextUrl.pathname === '/api/auth/login' ||
      request.nextUrl.pathname === '/api/auth/setup' ||
      request.nextUrl.pathname === '/api/auth/status'
    ) {
      return NextResponse.next();
    }

    // Validate authentication for all other API routes
    const auth = await validateRequest(request);
    if (!auth.valid) {
      return auth.error!;
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: '/api/:path*',
};
