import Link from 'next/link';
import Header from '../components/Header';
import Footer from '../components/Footer';
import SyncTrigger from '../components/SyncTrigger';
import { Article, FANTA, fmtDate } from '../lib/types';

const BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
const BLACK = '#0a0a0a';
const CARD = '#1a1a1a';
const INK = '#f4f1ea';
const MUTED = '#a09b94';

async function getArticles(): Promise<Article[]> {
  try {
    const res = await fetch(`${BASE}/api/articles`, { next: { revalidate: 60 } });
    return res.ok ? res.json() : [];
  } catch { return []; }
}

export default async function NewsPage() {
  const articles = await getArticles();

  return (
    <div style={{ background: BLACK, color: INK, fontFamily: '"Space Grotesk", system-ui, sans-serif', minHeight: '100vh' }}>
      <SyncTrigger />
      <Header />
      <main style={{ padding: '48px 48px 80px' }}>
        <div style={{ marginBottom: 40 }}>
          <div style={{ fontSize: 12, color: FANTA, letterSpacing: '0.2em', fontWeight: 700, textTransform: 'uppercase', marginBottom: 8 }}>
            <Link href="/" style={{ color: MUTED, textDecoration: 'none' }}>← Trang chủ</Link>
            {' '}/ Tin tức
          </div>
          <h1 style={{ fontFamily: 'Anton, sans-serif', fontSize: 'clamp(56px, 8vw, 96px)', lineHeight: 0.92, letterSpacing: '0.01em', textTransform: 'uppercase', margin: 0 }}>
            TIN TỨC <span style={{ color: FANTA }}>& BÀO</span>
          </h1>
          <p style={{ color: MUTED, fontSize: 15, marginTop: 12 }}>{articles.length} bài viết</p>
        </div>

        {articles.length === 0 ? (
          <div style={{ padding: '80px 40px', textAlign: 'center', background: CARD, borderLeft: `4px solid ${FANTA}` }}>
            <div style={{ fontFamily: 'Anton, sans-serif', fontSize: 32, color: MUTED, textTransform: 'uppercase' }}>Chưa có bài viết nào</div>
            <Link href="/admin/news-management" style={{ display: 'inline-block', marginTop: 20, background: FANTA, color: BLACK, padding: '14px 28px', textDecoration: 'none', fontFamily: 'Anton, sans-serif', fontSize: 16, letterSpacing: '0.06em', textTransform: 'uppercase' }}>
              + Viết bài đầu tiên
            </Link>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 20 }}>
            {articles.map(article => (
              <Link key={article.id} href={`/news/${article.id}`} style={{ textDecoration: 'none', color: 'inherit', background: CARD, overflow: 'hidden', display: 'block' }}>
                <div style={{
                  aspectRatio: '16/9',
                  background: '#2a1a0a',
                  backgroundImage: article.image_url ? `url(${BASE}${article.image_url})` : 'repeating-linear-gradient(135deg, transparent 0 14px, rgba(0,0,0,0.18) 14px 15px)',
                  backgroundSize: 'cover', backgroundPosition: 'center',
                  position: 'relative',
                }}>
                  {article.tag && (
                    <div style={{ position: 'absolute', top: 12, left: 12, background: FANTA, color: BLACK, padding: '3px 10px', fontFamily: 'Anton, sans-serif', fontSize: 11, letterSpacing: '0.08em', textTransform: 'uppercase' }}>
                      {article.tag}
                    </div>
                  )}
                </div>
                <div style={{ padding: '20px' }}>
                  <div style={{ fontSize: 11, color: MUTED, letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: 6 }}>{fmtDate(article.published_at)}</div>
                  <h3 style={{ fontFamily: 'Anton, sans-serif', fontSize: 22, lineHeight: 1.1, letterSpacing: '0.01em', textTransform: 'uppercase', marginBottom: 8 }}>{article.title}</h3>
                  {article.excerpt && <p style={{ color: '#d8d3cb', fontSize: 13, lineHeight: 1.55, margin: 0 }}>{article.excerpt}</p>}
                </div>
              </Link>
            ))}
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
}
