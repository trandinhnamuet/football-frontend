import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      { protocol: 'http', hostname: 'localhost', port: '3001', pathname: '/uploads/**' },
      { protocol: 'https', hostname: 'github.com', pathname: '/user-attachments/assets/**' },
      { protocol: 'https', hostname: 'api.lonfantafc.com', pathname: '/uploads/**' },
    ],
  },
};

export default nextConfig;
