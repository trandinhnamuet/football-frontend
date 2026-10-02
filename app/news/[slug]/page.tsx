import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound, permanentRedirect } from 'next/navigation';
import Header from '../../components/Header';
import Footer from '../../components/Footer';
import ShareButtons from '../../components/ShareButtons';
import { FANTA, fmtDate } from '../../lib/types';
import { normalizeProse } from '../../lib/prose';
import { SITE_NAME, SITE_URL, absoluteImage, plainText, truncate } from '../../lib/seo';
import { getArticle } from './article';

const BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
const BLACK = 'var(--bg)';
const INK = 'var(--ink)';
const MUTED = 'var(--muted)';
// Text sitting on a FANTA-orange fill stays dark in both themes — light text on
// orange fails contrast.
const ON_FANTA = '#0a0a0a';

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const article = await getArticle(slug);
  if (!article) return { title: `Không tìm thấy bài viết | ${SITE_NAME}` };

  const description = truncate(article.excerpt?.trim() || plainText(article.content) || article.title);
  const path = `/news/${article.slug || article.id}`;
  // Ảnh preview do ./opengraph-image.ts và ./twitter-image.ts sinh ra (JPEG
  // 1200×630 từ ảnh bìa) — không khai báo `images` ở đây để Next tự gắn.
  return {
    title: `${article.title} | ${SITE_NAME}`,
    description,
    alternates: { canonical: path },
    openGraph: {
      type: 'article',
      title: article.title,
      description,
      url: path,
      siteName: SITE_NAME,
      locale: 'vi_VN',
      publishedTime: article.published_at,
      ...(article.tag ? { section: article.tag } : {}),
    },
    twitter: {
      card: 'summary_large_image',
      title: article.title,
      description,
    },
  };
}

export default async function ArticlePage({ params }: Props) {
  const { slug } = await params;
  const article = await getArticle(slug);
  if (!article) notFound();
  // Link cũ dạng /news/33 → chuyển hẳn (308) sang đường dẫn slug.
  if (article.slug && slug !== article.slug) permanentRedirect(`/news/${article.slug}`);

  // Luôn chia sẻ URL canonical (slug) để crawler lấy đúng ảnh/tiêu đề preview.
  const shareUrl = `${SITE_URL}/news/${article.slug || article.id}`;
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'NewsArticle',
    headline: article.title,
    description: article.excerpt || truncate(plainText(article.content)),
    image: absoluteImage(article.image_url) ? [absoluteImage(article.image_url)] : undefined,
    datePublished: article.published_at,
    mainEntityOfPage: `${SITE_URL}/news/${article.slug || article.id}`,
    publisher: { '@type': 'SportsTeam', name: SITE_NAME, url: SITE_URL },
  };

  return (
    <div style={{ background: BLACK, color: INK, fontFamily: '"Space Grotesk", system-ui, sans-serif', minHeight: '100vh' }}>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, '\\u003c') }} />
      <Header />
      <main className="mob-p-main" style={{ maxWidth: 1200, margin: '0 auto', padding: '48px 48px 80px' }}>
        <div style={{ fontSize: 12, color: FANTA, letterSpacing: '0.2em', fontWeight: 700, textTransform: 'uppercase', marginBottom: 24 }}>
          <Link href="/news" style={{ color: MUTED, textDecoration: 'none' }}>← Tin tức</Link>
        </div>

        {article.tag && (
          <div style={{ display: 'inline-block', background: FANTA, color: ON_FANTA, padding: '4px 12px', fontFamily: 'Anton, sans-serif', fontSize: 13, letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 16 }}>
            {article.tag}
          </div>
        )}

        <h1 style={{ fontFamily: 'Anton, sans-serif', fontSize: 'clamp(36px, 5vw, 64px)', lineHeight: 1.2, letterSpacing: '0.01em', textTransform: 'uppercase', marginBottom: 16 }}>
          {article.title}
        </h1>

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16, marginBottom: 32 }}>
          <div style={{ fontSize: 13, color: MUTED, letterSpacing: '0.12em', textTransform: 'uppercase' }}>
            {fmtDate(article.published_at)}
          </div>
          <ShareButtons url={shareUrl} title={article.title} id={article.id} />
        </div>

        {article.image_url && (
          <img
            src={`${BASE}${article.image_url}`}
            alt={article.title}
            style={{ width: '100%', height: 'auto', display: 'block', marginBottom: 40 }}
          />
        )}

        {article.excerpt && (
          <p style={{ fontSize: 18, lineHeight: 1.7, color: 'var(--prose)', borderLeft: `4px solid ${FANTA}`, paddingLeft: 20, marginBottom: 32, fontStyle: 'italic' }}>
            {article.excerpt}
          </p>
        )}

        <div
          style={{ fontSize: 16, lineHeight: 1.8, color: 'var(--prose)' }}
          dangerouslySetInnerHTML={{ __html: normalizeProse(article.content) }}
        />

        <div style={{ marginTop: 48, paddingTop: 24, borderTop: '1px solid var(--line)' }}>
          <ShareButtons url={shareUrl} title={article.title} id={article.id} />
        </div>
      </main>
      <Footer />
    </div>
  );
}
