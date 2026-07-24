import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  images: {
    // Los avatares vienen del CDN de GitHub. `remotePatterns` en vez de `domains`,
    // que quedó deprecado en Next 16.
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'avatars.githubusercontent.com',
        pathname: '/**',
      },
    ],
  },
};

export default nextConfig;
