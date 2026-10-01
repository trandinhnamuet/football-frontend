import type { Metadata } from 'next';
import { SITE_NAME } from '../lib/seo';

// page.tsx là client component nên metadata (preview khi chia sẻ link) đặt ở đây.
export const metadata: Metadata = {
  title: `Ảnh | ${SITE_NAME}`,
  description: 'Album ảnh các trận đấu, buổi chia đội và những khoảnh khắc đáng nhớ của Lon Fanta FC.',
  alternates: { canonical: '/gallery' },
  openGraph: {
    type: 'website',
    title: `Ảnh | ${SITE_NAME}`,
    description: 'Album ảnh các trận đấu, buổi chia đội và những khoảnh khắc đáng nhớ của Lon Fanta FC.',
    url: '/gallery',
    siteName: SITE_NAME,
    locale: 'vi_VN',
  },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
