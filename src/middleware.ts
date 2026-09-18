// ─────────────────────────────────────────────────────────────
// middleware.ts — route guard for the admin area. Verifies the signed
// session cookie set by /api/auth/login and checks its role claim:
//   • superadmin ("admin") → /dashboard + every branch console
//   • branch manager      → only /dashboard/branch/<their branch>
// Protects /api/admin/* (401 JSON when unauthenticated; branch-scoped
// in the handlers) and /dashboard routes (redirect to login when
// unauthenticated). A branch manager manually opening /dashboard (or
// another branch's console) is redirected back to their own console.
// ─────────────────────────────────────────────────────────────
import { NextRequest, NextResponse } from 'next/server';
import { sessionFromRequest } from './lib/auth';

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // The login page is always reachable; an already signed-in visitor is
  // sent to the dashboard their account can open.
  if (pathname === '/dashboard/login') {
    const claim = await sessionFromRequest(request);
    if (!claim) return NextResponse.next();
    const home = claim.role === 'branch' ? `/dashboard/branch/${claim.branch}` : '/dashboard';
    return NextResponse.redirect(new URL(home, request.url));
  }

  const claim = await sessionFromRequest(request);

  if (!claim) {
    // API routes return 401 JSON; pages redirect to /dashboard/login.
    if (pathname.startsWith('/api/')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const loginUrl = request.nextUrl.clone();
    loginUrl.pathname = '/dashboard/login';
    loginUrl.search = `?next=${encodeURIComponent(pathname)}`;
    return NextResponse.redirect(loginUrl);
  }

  // Superadmin can open anything in the admin area.
  if (claim.role === 'admin') return NextResponse.next();

  // Branch manager: branch-scoped API calls are fine (handlers filter);
  // page access is restricted to their own branch console.
  if (pathname.startsWith('/api/')) return NextResponse.next();

  if (pathname.startsWith('/dashboard/branch/')) {
    const id = pathname.slice('/dashboard/branch/'.length).split('/')[0];
    if (id === claim.branch) return NextResponse.next();
    return NextResponse.redirect(new URL(`/dashboard/branch/${claim.branch}`, request.url));
  }

  // Every other /dashboard path (including the exact /dashboard superadmin
  // dashboard) belongs to the owner — send the manager to their console.
  return NextResponse.redirect(new URL(`/dashboard/branch/${claim.branch}`, request.url));
}

export const config = {
  matcher: ['/api/admin/:path*', '/dashboard/:path*'],
};