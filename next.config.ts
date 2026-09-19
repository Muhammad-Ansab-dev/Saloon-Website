import type { NextConfig } from 'next';

// ─────────────────────────────────────────────────────────────
// NEXT CONFIG — the app's build/runtime settings.
// What it does: defines the baseline security headers sent with every
// response, hides the framework banner, allows Cloudinary images, and lets
// big uploads through the middleware.
// What it connects to: nothing directly — it configures Next.js itself for
// all routes. Cloudinary uploads (images.remotePatterns) pair with
// src/lib/cloudinary.ts.
// Why it exists: security defaults (headers + no poweredBy), sizing limits
// for image uploads, and the allow-list of external image hosts.
// ─────────────────────────────────────────────────────────────
// Baseline security headers applied to every response. CSP is
// intentionally omitted: Next.js injects inline bootstrap scripts and
// a nonce-based policy would need per-request middleware plumbing.
const SECURITY_HEADERS = [
  // Stops browsers from guessing a type other than the one we declare
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  // Blocks the site from being embedded in other pages' iframes
  { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
  // Sends the referrer only within the same origin, trimmed otherwise
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  // Lets browsers race ahead on DNS lookups for linked domains
  { key: 'X-DNS-Prefetch-Control', value: 'on' },
  // Disables camera/mic/geolocation by default across the site
  { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
  // Forces HTTPS for two years (occurs once the site is behind TLS)
  { key: 'Strict-Transport-Security', value: 'max-age=63072000; includeSubDomains; preload' },
];

const nextConfig: NextConfig = {
  // Hide the "Powered by Next.js" banner (a small fingerprinting win)
  poweredByHeader: false,
  images: {
    // Allow <Image> to load pictures served from Cloudinary's CDN
    remotePatterns: [
      { protocol: 'https', hostname: 'res.cloudinary.com' },
    ],
  },
  async headers() {
    // Attach the security headers to every route
    return [{ source: '/:path*', headers: SECURITY_HEADERS }];
  },
  experimental: {
    // Allow image uploads up to 30 MB through the auth middleware (default is 10 MB).
    middlewareClientMaxBodySize: '30mb',
  },
};

export default nextConfig;
