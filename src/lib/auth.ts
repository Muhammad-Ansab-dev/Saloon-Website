// ─────────────────────────────────────────────────────────────
// auth.ts — shared auth utilities for the admin area.
// In plain words: this file is the front-door bouncer for the admin
// dashboard. A successful login mints a signed, httpOnly session cookie
// (an HMAC-signed token with an expiry and a role claim); middleware
// and admin API routes then verify that cookie and use its claim to
// scope access:
//
//   role "admin"  → the company owner / superadmin. Full access to
//                   /dashboard and every branch console.
//   role "branch" → a branch manager. Only sees /dashboard/branch/<own>.
//
// Uses Web Crypto so it runs identically in Node route handlers and
// the Edge middleware runtime.
//
// Config (env):
//   ADMIN_USERNAME / ADMIN_PASSWORD / ADMIN_SECRET       → superadmin
//   BRANCH_ZURICH_USERNAME / BRANCH_ZURICH_PASSWORD      → Zurich manager
//   BRANCH_PARIS_USERNAME / BRANCH_PARIS_PASSWORD        → Paris manager
//
// Development fallbacks: admin/paul123, zurich/zurich123,
// paris/paris123. In production there are NO fallbacks: missing config
// means those logins can never succeed and nothing verifies (fail closed).
// ─────────────────────────────────────────────────────────────
// True only in production builds; flips every "fail closed" decision and
// adds the Secure flag to the session cookie.
const IS_PRODUCTION = process.env.NODE_ENV === 'production';

// Development-only login fallbacks (admin/paul123) and signing secret — never
// used in production, where missing env config means logins fail closed.
const DEV_USERNAME = 'admin';
const DEV_PASSWORD = 'paul123';
const DEV_SECRET = 'dev-secret-change-me';

// Session cookie name and lifetime (12 hours) — the cookie header and the
// token's internal expiry share this same value.
export const SESSION_COOKIE = 'ph_admin_session';
export const SESSION_TTL_SECONDS = 60 * 60 * 12; // 12h

// What a verified session is allowed to do: role "admin" is the superadmin
// (owner, no branch binding); role "branch" is a manager scoped to one branch.
export type SessionClaim =
  | { role: 'admin'; branch?: never }
  | { role: 'branch'; branch: string };

// Branch slugs map to /dashboard/branch/<slug>. Keep in sync with
// LOCATIONS in salonData.ts.
const BRANCH_SLUGS = ['zurich', 'paris'] as const;

// Resolve the session secret: production requires ADMIN_SECRET (otherwise
// every login/verify fails closed); development falls back to the hardcoded
// dev secret. Returns null when nothing usable is configured.
function getSessionSecret(): string | null {
  if (process.env.ADMIN_SECRET) return process.env.ADMIN_SECRET;
  return IS_PRODUCTION ? null : DEV_SECRET;
}

// Resolve a branch manager's credentials from env vars
// (BRANCH_<SLUG>_USERNAME / BRANCH_<SLUG>_PASSWORD). In production an
// unconfigured branch comes back as a blank account so that login fails
// closed; in development it falls back to <slug>/<slug>123. Shared by the
// auth layer and the one-time store seed. Params: slug — branch slug such as
// "zurich". Returns the {slug, username, password} account triple.
export function branchAccount(slug: string): { slug: string; username: string; password: string } {
  const key = slug.toUpperCase();
  const username = process.env[`BRANCH_${key}_USERNAME`] ?? (IS_PRODUCTION ? '' : slug);
  const password = process.env[`BRANCH_${key}_PASSWORD`] ?? (IS_PRODUCTION ? '' : `${slug}123`);
  return { slug, username, password };
}

// Turn the session secret into a Web Crypto HMAC key: it is SHA-256 hashed
// first and imported as non-exportable, usable only for signing + verifying.
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

// Sign `data` with the session secret and return the hex HMAC-SHA-256 digest —
// the "fingerprint" that makes the token impossible to forge without the secret.
async function hmac(data: string, secret: string): Promise<string> {
  const key = await importKey(secret);
  const sig = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(data));
  return Array.from(new Uint8Array(sig))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

// Compare two strings in "constant time" so an attacker timing the comparison
// learns nothing about the values. Both inputs are SHA-256 hashed first, so
// the buffers are always the same length and the XOR loop always runs the
// same number of iterations. Returns true only when every byte matches.
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

// Try `username`/`password` against every known account (the superadmin plus
// all branch managers) and return the matching account's role claim — or null
// when nothing matches. Every account is always checked, so timing stays
// uniform and an attacker can't tell which usernames even exist.
// Params: username + password — the attempted login; extraBranches — branch
// accounts managed in the store (Branches tab). A slug listed here overrides
// the env-var account for that slug (the DB row wins once a branch exists).
// Passing them as a plain argument keeps this module Edge-safe (no pg import).
export async function authenticate(
  username: string,
  password: string,
  extraBranches: { slug: string; username: string; password: string }[] = []
): Promise<SessionClaim | null> {
  const adminUser = process.env.ADMIN_USERNAME ?? (IS_PRODUCTION ? '' : DEV_USERNAME);
  const adminPass = process.env.ADMIN_PASSWORD ?? (IS_PRODUCTION ? '' : DEV_PASSWORD);

  const results: { match: boolean; claim: SessionClaim }[] = [
    {
      match:
        (adminUser ? await timingSafeEqual(username, adminUser) : false) &&
        (adminPass ? await timingSafeEqual(password, adminPass) : false),
      claim: { role: 'admin' },
    },
  ];

  // Branch candidates = store-managed accounts (these win) plus env-var
  // accounts whose slug isn't overridden by the store. Each one is checked
  // with a constant-time comparison.
  const dbSlugs = new Set(extraBranches.map((b) => b.slug));
  const envBranches = BRANCH_SLUGS.map(branchAccount).filter((acc) => !dbSlugs.has(acc.slug));
  for (const acc of [...envBranches, ...extraBranches]) {
    const [userOk, passOk] = await Promise.all([
      timingSafeEqual(username, acc.username),
      timingSafeEqual(password, acc.password),
    ]);
    results.push({ match: userOk && passOk, claim: { role: 'branch', branch: acc.slug } });
  }

  return results.find((r) => r.match)?.claim ?? null;
}

// ── Token format ──────────────────────────────────────────────
// New tokens:   <expiresAt>.<base64url(claims)>.<hmac(expiresAt.claims)>
// Legacy tokens (pre-branching, still accepted): <expiresAt>.<hmac(expiresAt)>
// — treated as role "admin" so existing sessions keep working.

// Encode a string as URL-safe base64 (no "+"/"/"/"=" characters), the
// encoding used for the JSON claims inside the token.
function b64urlEncode(s: string): string {
  return btoa(unescape(encodeURIComponent(s))).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

// Reverse of b64urlEncode: decode URL-safe base64 back to the raw string.
function b64urlDecode(s: string): string {
  const b64 = s.replace(/-/g, '+').replace(/_/g, '/');
  return decodeURIComponent(escape(atob(b64)));
}

// Build a signed token for a role claim: <expiry>.<claims>.<signature>. The
// signature covers expiry + claims together, so the token can neither be
// edited nor replayed past its expiry. Params: claim — the role to encode
// ("admin" or a branch slug). Returns the fully signed token string.
export async function createSessionToken(claim: SessionClaim): Promise<string> {
  const secret = getSessionSecret();
  if (!secret) throw new Error('ADMIN_SECRET is not configured');
  const expiresAt = Math.floor(Date.now() / 1000) + SESSION_TTL_SECONDS;
  // Claims are serialised with short keys (r = role, b = branch) to keep the
  // resulting cookie small.
  const claimsJson = JSON.stringify(claim.role === 'branch' ? { r: 'branch', b: claim.branch } : { r: 'admin' });
  const payload = b64urlEncode(claimsJson);
  const sig = await hmac(`${expiresAt}.${payload}`, secret);
  return `${expiresAt}.${payload}.${sig}`;
}

// Read a session token and, once verified, return its role claim — or null
// when the token is missing, malformed, expired, or badly signed.
// Params: token — the raw cookie value (possibly undefined). Returns the
// decoded SessionClaim, or null.
export async function decodeSessionToken(token: string | undefined): Promise<SessionClaim | null> {
  if (!token) return null;
  const secret = getSessionSecret();
  if (!secret) return null;

  // A token is "<expiry>.<payload>.<signature>". Reject it if it has too few
  // parts, a non-numeric expiry, or an expiry that has already passed.
  const parts = token.split('.');
  if (parts.length < 2) return null;
  const expiresAt = Number(parts[0]);
  if (!Number.isFinite(expiresAt)) return null;
  if (Date.now() / 1000 > expiresAt) return null;

  if (parts.length === 2) {
    // Legacy admin token: sig = HMAC(expiresAt). Still treated as the
    // superadmin so existing sessions keep working.
    const expected = await hmac(String(expiresAt), secret);
    return (await timingSafeEqual(parts[1], expected)) ? { role: 'admin' } : null;
  }

  const payload = parts[1];
  const sig = parts.slice(2).join('.');
  const expected = await hmac(`${expiresAt}.${payload}`, secret);
  if (!(await timingSafeEqual(sig, expected))) return null;

  let data: { r?: unknown; b?: unknown };
  try {
    data = JSON.parse(b64urlDecode(payload));
  } catch {
    return null;
  }
  if (data.r === 'admin') return { role: 'admin' };
  if (data.r === 'branch' && typeof data.b === 'string' && data.b.length > 0) {
    return { role: 'branch', branch: data.b.toLowerCase() };
  }
  return null;
}

// Convenience boolean wrapper over decodeSessionToken: is this token valid
// (signed and unexpired)? Returns true/false.
export async function verifySessionToken(token: string | undefined): Promise<boolean> {
  return (await decodeSessionToken(token)) !== null;
}

// Pull the session cookie off an incoming request and decode it. Accepts
// either NextRequest (middleware) or a plain Request (route handlers).
// Returns the role claim, or null when the visitor isn't signed in.
export async function sessionFromRequest(
  request: { cookies: { get(name: string): { value?: string } | undefined } }
): Promise<SessionClaim | null> {
  return decodeSessionToken(request.cookies.get(SESSION_COOKIE)?.value);
}

// The shared cookie options shared by every Set-Cookie we emit: HttpOnly (JS
// can't read it) + SameSite=Lax (CSRF protection), plus Secure on HTTPS in
// production.
function cookieAttributes(): string {
  return `Path=/; HttpOnly; SameSite=Lax${IS_PRODUCTION ? '; Secure' : ''}`;
}

// Turn a signed token into the full Set-Cookie string (name, token, shared
// attributes, and the 12h Max-Age attrs). Used by the login route.
export function serializeSessionCookie(token: string): string {
  return `${SESSION_COOKIE}=${token}; ${cookieAttributes()}; Max-Age=${SESSION_TTL_SECONDS}`;
}

// Returns a Set-Cookie value with Max-Age=0, telling the browser to delete
// the session cookie immediately (used by the logout action).
export function clearSessionCookie(): string {
  return `${SESSION_COOKIE}=; ${cookieAttributes()}; Max-Age=0`;
}