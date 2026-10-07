import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      { protocol: 'http', hostname: 'localhost', port: '3001', pathname: '/uploads/**' },
      { protocol: 'https', hostname: 'github.com', pathname: '/user-attachments/assets/**' },
      { protocol: 'https', hostname: 'api.lonfantafc.com', pathname: '/uploads/**' },
    ],
  },
  // Trang quản trị / tài khoản không được lên Google. Dùng noindex thay vì chặn ở
  // robots.txt — bị chặn crawl thì Google không đọc được noindex và vẫn có thể
  // hiện URL trong kết quả tìm kiếm.
  async headers() {
    const noindex = [{ key: 'X-Robots-Tag', value: 'noindex, nofollow' }];
    return ['/admin', '/admin/:path*', '/account', '/account/:path*', '/login'].map(source => ({ source, headers: noindex }));
  },
};

export default nextConfig;
