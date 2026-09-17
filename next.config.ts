import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'res.cloudinary.com' },
    ],
  },
  experimental: {
    // Allow image uploads up to 30 MB through the auth middleware (default is 10 MB).
    middlewareClientMaxBodySize: '30mb',
  },
};

export default nextConfig;