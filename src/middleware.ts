// ─────────────────────────────────────────────────────────────
// middleware.ts — route guard for the admin area. Verifies the signed
// session cookie set by /api/auth/login. Protects /api/admin/* (401
// JSON when unauthenticated) and the exact /dashboard route (redirect
// to /dashboard/login?next=…). /dashboard/login itself is public; the
// rest of the public site is untouched.
// ─────────────────────────────────────────────────────────────
import { NextRequest, NextResponse } from 'next/server';
import { SESSION_COOKIE, verifySessionToken } from './lib/auth';

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Allow unauthenticated access to the login page itself.
  if (pathname === '/dashboard/login') {
    return NextResponse.next();
  }

  const token = request.cookies.get(SESSION_COOKIE)?.value;
  const authorized = token ? await verifySessionToken(token) : false;

  if (!authorized) {
    // API routes return 401 JSON; pages redirect to /dashboard/login.
    if (pathname.startsWith('/api/')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const loginUrl = request.nextUrl.clone();
    loginUrl.pathname = '/dashboard/login';
    loginUrl.search = `?next=${encodeURIComponent(pathname)}`;
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/api/admin/:path*', '/dashboard'],
};