import type { Metadata } from 'next';
import HomeClient from './HomeClient';
import { getHomeSummary, homeDescription } from './lib/homeSummary';
import { SITE_NAME, SITE_TAGLINE } from './lib/seo';

// Trang chủ là client component, nên metadata (preview khi dán link lên
// Facebook / Messenger / Zalo) được sinh ở lớp server mỏng này. Mô tả đổi theo
// trận kế tiếp, kết quả gần nhất và thành tích mùa giải.
export const revalidate = 300;

export async function generateMetadata(): Promise<Metadata> {
  const description = homeDescription(await getHomeSummary());
  const title = `${SITE_NAME} | ${SITE_TAGLINE}`;
  return {
    title,
    description,
    alternates: { canonical: '/' },
    // Ảnh og/twitter do app/opengraph-image.tsx & app/twitter-image.tsx sinh.
    openGraph: { type: 'website', title, description, url: '/', siteName: SITE_NAME, locale: 'vi_VN' },
    twitter: { card: 'summary_large_image', title, description },
  };
}

export default function HomePage() {
  return <HomeClient />;
}
