// ─────────────────────────────────────────────────────────────
// auth.ts — shared auth utilities for the admin area. A successful
// login issues an httpOnly session cookie (HMAC-signed token with an
// expiry); middleware and admin API routes verify the cookie. Uses
// Web Crypto so it runs identically in Node route handlers and the
// Edge middleware runtime.
//   creds from env: ADMIN_USERNAME, ADMIN_PASSWORD, ADMIN_SECRET
// ─────────────────────────────────────────────────────────────
export const ADMIN_USERNAME = process.env.ADMIN_USERNAME ?? 'admin';
export const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD ?? 'paul123';
export const ADMIN_SECRET = process.env.ADMIN_SECRET ?? 'dev-secret-change-me';

export const SESSION_COOKIE = 'ph_admin_session';
export const SESSION_TTL_SECONDS = 60 * 60 * 12; // 12h

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

/** Create a signed session token: expiresAt.sig where sig = HMAC(expiresAt). */
export async function createSessionToken(): Promise<string> {
  const expiresAt = Math.floor(Date.now() / 1000) + SESSION_TTL_SECONDS;
  const sig = await hmac(String(expiresAt), ADMIN_SECRET);
  return `${expiresAt}.${sig}`;
}

/** Verify a token string; returns true only if signature + expiry are valid. */
export async function verifySessionToken(token: string | undefined): Promise<boolean> {
  if (!token) return false;
  const idx = token.lastIndexOf('.');
  if (idx < 0) return false;
  const expiresAt = Number(token.slice(0, idx));
  const sig = token.slice(idx + 1);
  if (!Number.isFinite(expiresAt)) return false;
  if (Date.now() / 1000 > expiresAt) return false;
  const expected = await hmac(String(expiresAt), ADMIN_SECRET);
  return sig === expected;
}

/** Cookie serialization for an httpOnly session cookie. */
export function serializeSessionCookie(token: string): string {
  return `${SESSION_COOKIE}=${token}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${SESSION_TTL_SECONDS}`;
}

export function clearSessionCookie(): string {
  return `${SESSION_COOKIE}=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0`;
}

/** Admin credentials check (constant-time-ish); used by the login route. */
export function validateCredentials(username: string, password: string): boolean {
  const u = username === ADMIN_USERNAME;
  const p = password === ADMIN_PASSWORD;
  return u && p;
}