import Link from 'next/link';
import { notFound } from 'next/navigation';
import Header from '../../components/Header';
import Footer from '../../components/Footer';
import { Article, FANTA, fmtDate, isAnnouncement, announcementIsActive } from '../../lib/types';
import { normalizeProse } from '../../lib/prose';

const BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
const BLACK = 'var(--bg)';
const INK = 'var(--ink)';
const MUTED = 'var(--muted)';
// Text sitting on a FANTA-orange fill stays dark in both themes — light text on
// orange fails contrast.
const ON_FANTA = '#0a0a0a';

async function getArticle(id: string): Promise<Article | null> {
  try {
    const res = await fetch(`${BASE}/api/articles/${id}`, { next: { revalidate: 60 } });
    if (!res.ok) return null;
    return res.json();
  } catch { return null; }
}

export default async function ArticlePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const article = await getArticle(id);
  if (!article) notFound();
  const announcement = isAnnouncement(article);
  const active = announcementIsActive(article);

  return (
    <div style={{ background: BLACK, color: INK, fontFamily: '"Space Grotesk", system-ui, sans-serif', minHeight: '100vh' }}>
      <Header />
      <main className="mob-p-main" style={{ maxWidth: 1200, margin: '0 auto', padding: '48px 48px 80px' }}>
        <div style={{ fontSize: 12, color: FANTA, letterSpacing: '0.2em', fontWeight: 700, textTransform: 'uppercase', marginBottom: 24 }}>
          {announcement
            ? <Link href="/announcements" style={{ color: MUTED, textDecoration: 'none' }}>← Thông báo</Link>
            : <Link href="/news" style={{ color: MUTED, textDecoration: 'none' }}>← Tin tức</Link>}
        </div>

        <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap', marginBottom: 16 }}>
          {announcement && (
            <span style={{ background: active ? FANTA : 'var(--line)', color: active ? ON_FANTA : MUTED, padding: '4px 12px', fontFamily: 'Anton, sans-serif', fontSize: 13, letterSpacing: '0.08em', textTransform: 'uppercase' }}>
              📢 Thông báo{active ? '' : ' · Đã hết hạn'}
            </span>
          )}
          {article.tag && (
            <span style={{ background: announcement ? 'transparent' : FANTA, color: announcement ? FANTA : ON_FANTA, border: announcement ? `1px solid ${FANTA}66` : 'none', padding: '4px 12px', fontFamily: 'Anton, sans-serif', fontSize: 13, letterSpacing: '0.08em', textTransform: 'uppercase' }}>
              {article.tag}
            </span>
          )}
        </div>

        <h1 style={{ fontFamily: 'Anton, sans-serif', fontSize: 'clamp(36px, 5vw, 64px)', lineHeight: 1.2, letterSpacing: '0.01em', textTransform: 'uppercase', marginBottom: 16 }}>
          {article.title}
        </h1>

        <div style={{ fontSize: 13, color: MUTED, letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: 32 }}>
          {fmtDate(article.published_at)}
          {announcement && article.expires_at && <span> · Hiệu lực đến {fmtDate(article.expires_at)}</span>}
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
      </main>
      <Footer />
    </div>
  );
}
