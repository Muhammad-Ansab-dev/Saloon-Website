// ─────────────────────────────────────────────────────────────
// auth.ts — shared auth utilities for the admin area. A successful
// login issues an httpOnly session cookie (HMAC-signed token with an
// expiry and a role claim). Middleware and admin API routes verify
// the cookie and use the claim to scope access:
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
const IS_PRODUCTION = process.env.NODE_ENV === 'production';

const DEV_USERNAME = 'admin';
const DEV_PASSWORD = 'paul123';
const DEV_SECRET = 'dev-secret-change-me';

export const SESSION_COOKIE = 'ph_admin_session';
export const SESSION_TTL_SECONDS = 60 * 60 * 12; // 12h

export type SessionClaim =
  | { role: 'admin'; branch?: never }
  | { role: 'branch'; branch: string };

// Branch slugs map to /dashboard/branch/<slug>. Keep in sync with
// LOCATIONS in salonData.ts.
const BRANCH_SLUGS = ['zurich', 'paris'] as const;

/** Resolve the session secret, or null when unset in production. */
function getSessionSecret(): string | null {
  if (process.env.ADMIN_SECRET) return process.env.ADMIN_SECRET;
  return IS_PRODUCTION ? null : DEV_SECRET;
}

/** Resolve a branch manager account from env vars — returns a blank
 * account in production when not configured (so branch logins fail
 * closed). Shared by the auth layer and the one-time store seed. */
export function branchAccount(slug: string): { slug: string; username: string; password: string } {
  const key = slug.toUpperCase();
  const username = process.env[`BRANCH_${key}_USERNAME`] ?? (IS_PRODUCTION ? '' : slug);
  const password = process.env[`BRANCH_${key}_PASSWORD`] ?? (IS_PRODUCTION ? '' : `${slug}123`);
  return { slug, username, password };
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

/**
 * Verify credentials against every known account (superadmin + all
 * branches). All comparisons always run so timing is uniform and does
 * not reveal which usernames exist. Returns the account's role claim
 * on a match, or null.
 *
 * `extraBranches` carries branch accounts managed in the store
 * (created/edited from the Branches tab). When a slug appears there it
 * overrides any env-var account for that slug — the DB row is the
 * source of truth once a branch exists. Accepting them as a plain
 * argument keeps this module Edge-safe (no pg import).
 */
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

function b64urlEncode(s: string): string {
  return btoa(unescape(encodeURIComponent(s))).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function b64urlDecode(s: string): string {
  const b64 = s.replace(/-/g, '+').replace(/_/g, '/');
  return decodeURIComponent(escape(atob(b64)));
}

/** Create a signed role-bearing session token. */
export async function createSessionToken(claim: SessionClaim): Promise<string> {
  const secret = getSessionSecret();
  if (!secret) throw new Error('ADMIN_SECRET is not configured');
  const expiresAt = Math.floor(Date.now() / 1000) + SESSION_TTL_SECONDS;
  const claimsJson = JSON.stringify(claim.role === 'branch' ? { r: 'branch', b: claim.branch } : { r: 'admin' });
  const payload = b64urlEncode(claimsJson);
  const sig = await hmac(`${expiresAt}.${payload}`, secret);
  return `${expiresAt}.${payload}.${sig}`;
}

/** Verify a token and return its role claim (null when invalid/expired). */
export async function decodeSessionToken(token: string | undefined): Promise<SessionClaim | null> {
  if (!token) return null;
  const secret = getSessionSecret();
  if (!secret) return null;

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

/** Verify a token exists, is signed and unexpired (boolean form). */
export async function verifySessionToken(token: string | undefined): Promise<boolean> {
  return (await decodeSessionToken(token)) !== null;
}

/**
 * Read and decode the session claim from a request, or null. Works for
 * NextRequest (middleware) and Request (route handlers).
 */
export async function sessionFromRequest(
  request: { cookies: { get(name: string): { value?: string } | undefined } }
): Promise<SessionClaim | null> {
  return decodeSessionToken(request.cookies.get(SESSION_COOKIE)?.value);
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