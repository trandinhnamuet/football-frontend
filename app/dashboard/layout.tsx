import type { Metadata } from 'next';
import { SITE_NAME } from '../lib/seo';

// page.tsx là client component nên metadata (preview khi chia sẻ link) đặt ở đây.
export const metadata: Metadata = {
  title: `Dashboard | ${SITE_NAME}`,
  description: 'Thống kê chi tiết Lon Fanta FC: thành tích mùa giải, bàn thắng, kiến tạo và phong độ từng thành viên.',
  alternates: { canonical: '/dashboard' },
  openGraph: {
    type: 'website',
    title: `Dashboard | ${SITE_NAME}`,
    description: 'Thống kê chi tiết Lon Fanta FC: thành tích mùa giải, bàn thắng, kiến tạo và phong độ từng thành viên.',
    url: '/dashboard',
    siteName: SITE_NAME,
    locale: 'vi_VN',
  },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
