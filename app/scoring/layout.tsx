import type { Metadata } from 'next';
import { SITE_NAME } from '../lib/seo';

// page.tsx là client component nên metadata (preview khi chia sẻ link) đặt ở đây.
export const metadata: Metadata = {
  title: `Cách tính điểm | ${SITE_NAME}`,
  description: 'Cách tính điểm cầu thủ Lon Fanta FC: bàn thắng, kiến tạo, ra sân và bảng xếp hạng thành viên.',
  alternates: { canonical: '/scoring' },
  openGraph: {
    type: 'website',
    title: `Cách tính điểm | ${SITE_NAME}`,
    description: 'Cách tính điểm cầu thủ Lon Fanta FC: bàn thắng, kiến tạo, ra sân và bảng xếp hạng thành viên.',
    url: '/scoring',
    siteName: SITE_NAME,
    locale: 'vi_VN',
  },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
