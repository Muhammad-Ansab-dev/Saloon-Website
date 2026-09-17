// ─────────────────────────────────────────────────────────────
// auth.ts — shared auth utilities for the admin area. A successful
// login issues an httpOnly session cookie (HMAC-signed token with an
// expiry); middleware and admin API routes verify the cookie. Uses
// Web Crypto so it runs identically in Node route handlers and the
// Edge middleware runtime.
//
// Config (env): ADMIN_USERNAME, ADMIN_PASSWORD, ADMIN_SECRET.
// Development falls back to admin / paul123 / a fixed dev secret so
// the dashboard is usable on a fresh clone. In production there are
// no fallbacks: missing config means login can never succeed and no
// session token verifies (fail closed).
// ─────────────────────────────────────────────────────────────
const IS_PRODUCTION = process.env.NODE_ENV === 'production';

const DEV_USERNAME = 'admin';
const DEV_PASSWORD = 'paul123';
const DEV_SECRET = 'dev-secret-change-me';

export const SESSION_COOKIE = 'ph_admin_session';
export const SESSION_TTL_SECONDS = 60 * 60 * 12; // 12h

/** Resolve the admin secret, or null when unset in production. */
function getAdminSecret(): string | null {
  if (process.env.ADMIN_SECRET) return process.env.ADMIN_SECRET;
  return IS_PRODUCTION ? null : DEV_SECRET;
}

async function importKey(secret: string): Promise<CryptoKey> {
  const seed = new TextEncoder().encode(secret);
  const digest = await crypto.subtle.digest('SHA-256', seed);
  return crypto.subtle.importKey(
    'raw',
    new Uint8Array(digest),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign', 'verify']
  );
}

async function hmac(data: string, secret: string): Promise<string> {
  const key = await importKey(secret);
  const sig = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(data));
  return Array.from(new Uint8Array(sig))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

/**
 * Constant-time string comparison. Both inputs are SHA-256 hashed
 * first so the compared buffers are always the same length and the
 * loop runs a fixed number of iterations regardless of input.
 */
async function timingSafeEqual(a: string, b: string): Promise<boolean> {
  const enc = new TextEncoder();
  const [da, db] = await Promise.all([
    crypto.subtle.digest('SHA-256', enc.encode(a)),
    crypto.subtle.digest('SHA-256', enc.encode(b)),
  ]);
  const x = new Uint8Array(da);
  const y = new Uint8Array(db);
  let diff = 0;
  for (let i = 0; i < x.length; i++) diff |= x[i] ^ y[i];
  return diff === 0;
}

/** Create a signed session token: expiresAt.sig where sig = HMAC(expiresAt). */
export async function createSessionToken(): Promise<string> {
  const secret = getAdminSecret();
  if (!secret) throw new Error('ADMIN_SECRET is not configured');
  const expiresAt = Math.floor(Date.now() / 1000) + SESSION_TTL_SECONDS;
  const sig = await hmac(String(expiresAt), secret);
  return `${expiresAt}.${sig}`;
}

/** Verify a token string; returns true only if signature + expiry are valid. */
export async function verifySessionToken(token: string | undefined): Promise<boolean> {
  if (!token) return false;
  const secret = getAdminSecret();
  if (!secret) return false;
  const idx = token.lastIndexOf('.');
  if (idx < 0) return false;
  const expiresAt = Number(token.slice(0, idx));
  const sig = token.slice(idx + 1);
  if (!Number.isFinite(expiresAt)) return false;
  if (Date.now() / 1000 > expiresAt) return false;
  const expected = await hmac(String(expiresAt), secret);
  return timingSafeEqual(sig, expected);
}

function cookieAttributes(): string {
  return `Path=/; HttpOnly; SameSite=Lax${IS_PRODUCTION ? '; Secure' : ''}`;
}

/** Cookie serialization for an httpOnly session cookie. */
export function serializeSessionCookie(token: string): string {
  return `${SESSION_COOKIE}=${token}; ${cookieAttributes()}; Max-Age=${SESSION_TTL_SECONDS}`;
}

export function clearSessionCookie(): string {
  return `${SESSION_COOKIE}=; ${cookieAttributes()}; Max-Age=0`;
}

/** Admin credentials check (constant-time); used by the login route. */
export async function validateCredentials(username: string, password: string): Promise<boolean> {
  const expectedUsername = process.env.ADMIN_USERNAME ?? (IS_PRODUCTION ? '' : DEV_USERNAME);
  const expectedPassword = process.env.ADMIN_PASSWORD ?? (IS_PRODUCTION ? '' : DEV_PASSWORD);
  if (!expectedUsername || !expectedPassword) return false;
  const [userOk, passOk] = await Promise.all([
    timingSafeEqual(username, expectedUsername),
    timingSafeEqual(password, expectedPassword),
  ]);
  return userOk && passOk;
}
