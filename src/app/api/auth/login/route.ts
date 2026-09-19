// ─────────────────────────────────────────────────────────────
// LOGIN / LOGOUT API ("/api/auth/login") — the door to the dashboard.
// What it does: verifies admin/branch credentials, hands out a signed
// session cookie, and (on DELETE) clears it.
// What it connects to: src/lib/auth.ts (authenticate, session cookies) and
// src/lib/store.ts (to include DB-created branch manager accounts).
// Why it exists: the login form on /dashboard/login posts here; the cookie
// it sets unlocks all of /api/admin/* and /dashboard.
// Security: fail-too-many-guesses are rate-limited per client IP
// (8 attempts per minute), every comparison runs in constant time, and the
// cookie is httpOnly (JavaScript can never read it).
// ─────────────────────────────────────────────────────────────
import { NextResponse } from 'next/server';
import {
  authenticate,
  clearSessionCookie,
  createSessionToken,
  serializeSessionCookie,
} from '@/lib/auth';
import { getCollection } from '@/lib/store';

// Rate limiting: a fixed 60-second window caps login tries per client,
// and we remember at most 5000 clients so the map cannot grow forever.
const RATE_LIMIT_WINDOW_MS = 60_000;
const RATE_LIMIT_MAX_ATTEMPTS = 8;
const MAX_TRACKED_CLIENTS = 5_000;

// In-memory attempt tracker: client key → {count, resetAt}.
const attempts = new Map<string, { count: number; resetAt: number }>();

// Identify the client by IP — the first x-forwarded-for entry when present
// (behind a proxy), otherwise "unknown".
function clientKey(request: Request): string {
  const forwarded = request.headers.get('x-forwarded-for');
  return forwarded?.split(',')[0]?.trim() || 'unknown';
}

// Fixed-window rate limiter. Params: the client key.
// Returns: seconds the caller must wait (0 = allowed).
// Logic: a fresh window stores count 1; once count hits the max, further
// attempts are refused until the window resets.
function rateLimit(key: string): number {
  const now = Date.now();
  const entry = attempts.get(key);
  if (!entry || entry.resetAt <= now) {
    if (attempts.size >= MAX_TRACKED_CLIENTS) {
      // Map is full — drop every expired window before recording a new one.
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

// POST — login. Params: request with {username, password} JSON.
// Returns: {ok:true, redirect} + the session cookie on success, or a
// 401 (bad credentials) / 429 (rate-limited) / 400 (bad body) error.
export async function POST(request: Request) {
  // Block early if this IP has exhausted its attempts for the current window.
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

  // Mint the signed session cookie and send it to the browser (httpOnly).
  const token = await createSessionToken(claim);
  const redirect = claim.role === 'branch' ? `/dashboard/branch/${claim.branch}` : '/dashboard';
  const res = NextResponse.json({ ok: true, redirect });
  res.headers.set('Set-Cookie', serializeSessionCookie(token));
  return res;
}

// DELETE — sign out. Params: none (request ignored).
// Returns: {ok:true} after clearing/expiring the session cookie.
export async function DELETE() {
  const res = NextResponse.json({ ok: true });
  res.headers.set('Set-Cookie', clearSessionCookie());
  return res;
}
