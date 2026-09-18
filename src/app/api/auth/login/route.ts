// ─────────────────────────────────────────────────────────────
// POST /api/auth/login  — exchange admin credentials for a signed
//   session cookie. Failures are rate-limited per client IP.
// DELETE /api/auth/login — clear the session cookie (logout).
// Consumed by the dashboard login form.
// ─────────────────────────────────────────────────────────────
import { NextResponse } from 'next/server';
import {
  authenticate,
  clearSessionCookie,
  createSessionToken,
  serializeSessionCookie,
} from '@/lib/auth';
import { getCollection } from '@/lib/store';

const RATE_LIMIT_WINDOW_MS = 60_000;
const RATE_LIMIT_MAX_ATTEMPTS = 8;
const MAX_TRACKED_CLIENTS = 5_000;

const attempts = new Map<string, { count: number; resetAt: number }>();

function clientKey(request: Request): string {
  const forwarded = request.headers.get('x-forwarded-for');
  return forwarded?.split(',')[0]?.trim() || 'unknown';
}

/** Fixed-window limiter. Returns the seconds to wait, or 0 when allowed. */
function rateLimit(key: string): number {
  const now = Date.now();
  const entry = attempts.get(key);
  if (!entry || entry.resetAt <= now) {
    if (attempts.size >= MAX_TRACKED_CLIENTS) {
      for (const [k, v] of attempts) if (v.resetAt <= now) attempts.delete(k);
    }
    attempts.set(key, { count: 1, resetAt: now + RATE_LIMIT_WINDOW_MS });
    return 0;
  }
  if (entry.count >= RATE_LIMIT_MAX_ATTEMPTS) {
    return Math.ceil((entry.resetAt - now) / 1000);
  }
  entry.count += 1;
  return 0;
}

export async function POST(request: Request) {
  const retryAfter = rateLimit(clientKey(request));
  if (retryAfter > 0) {
    return NextResponse.json(
      { error: 'Too many attempts. Please try again shortly.' },
      { status: 429, headers: { 'Retry-After': String(retryAfter) } }
    );
  }

  let body: { username?: string; password?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const username = body.username?.trim() ?? '';
  const password = body.password ?? '';

  // Branch accounts created in the store (Branches tab) are checked
  // alongside the env-var accounts. If the store is unreachable we fall
  // back to env-only so the original accounts still work.
  let storeBranches: { slug: string; username: string; password: string }[] = [];
  try {
    const rows = (await getCollection('branches')) as unknown as {
      slug: string;
      managerUsername: string;
      managerPassword: string;
    }[];
    storeBranches = rows
      .filter((r) => r.slug && r.managerUsername)
      .map((r) => ({ slug: r.slug, username: r.managerUsername, password: r.managerPassword }));
  } catch {
    // Store down → env-var accounts only.
  }

  // Resolve which account matched so the response can point the browser
  // at the right dashboard: superadmin → /dashboard, branch manager → the
  // branch console for that branch.
  const claim = await authenticate(username, password, storeBranches);
  if (!claim) {
    return NextResponse.json({ error: 'Invalid username or password' }, { status: 401 });
  }

  const token = await createSessionToken(claim);
  const redirect = claim.role === 'branch' ? `/dashboard/branch/${claim.branch}` : '/dashboard';
  const res = NextResponse.json({ ok: true, redirect });
  res.headers.set('Set-Cookie', serializeSessionCookie(token));
  return res;
}

export async function DELETE() {
  const res = NextResponse.json({ ok: true });
  res.headers.set('Set-Cookie', clearSessionCookie());
  return res;
}
