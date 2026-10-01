import type { Metadata } from 'next';
import { SITE_NAME } from '../lib/seo';

// page.tsx là client component nên metadata (preview khi chia sẻ link) đặt ở đây.
export const metadata: Metadata = {
  title: `Giới thiệu | ${SITE_NAME}`,
  description: 'Câu chuyện Lon Fanta FC — đội bóng phong trào Hà Nội: lịch sử, tinh thần #ĐamMêBấtTận và những con người làm nên đội bóng.',
  alternates: { canonical: '/about' },
  openGraph: {
    type: 'website',
    title: `Giới thiệu | ${SITE_NAME}`,
    description: 'Câu chuyện Lon Fanta FC — đội bóng phong trào Hà Nội: lịch sử, tinh thần #ĐamMêBấtTận và những con người làm nên đội bóng.',
    url: '/about',
    siteName: SITE_NAME,
    locale: 'vi_VN',
  },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
