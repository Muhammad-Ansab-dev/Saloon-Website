import type { NextConfig } from 'next';

// Baseline security headers applied to every response. CSP is
// intentionally omitted: Next.js injects inline bootstrap scripts and
// a nonce-based policy would need per-request middleware plumbing.
const SECURITY_HEADERS = [
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  { key: 'X-DNS-Prefetch-Control', value: 'on' },
  { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
  { key: 'Strict-Transport-Security', value: 'max-age=63072000; includeSubDomains; preload' },
];

const nextConfig: NextConfig = {
  poweredByHeader: false,
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'res.cloudinary.com' },
    ],
  },
  async headers() {
    return [{ source: '/:path*', headers: SECURITY_HEADERS }];
  },
  experimental: {
    // Allow image uploads up to 30 MB through the auth middleware (default is 10 MB).
    middlewareClientMaxBodySize: '30mb',
  },
};

export default nextConfig;
