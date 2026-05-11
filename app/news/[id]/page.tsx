import Link from 'next/link';
import { notFound } from 'next/navigation';
import Header from '../../components/Header';
import Footer from '../../components/Footer';
import { Article, FANTA, fmtDate } from '../../lib/types';

const BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
const BLACK = '#0a0a0a';
const INK = '#f4f1ea';
const MUTED = '#a09b94';

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

  return (
    <div style={{ background: BLACK, color: INK, fontFamily: '"Space Grotesk", system-ui, sans-serif', minHeight: '100vh' }}>
      <Header />
      <main style={{ maxWidth: 800, margin: '0 auto', padding: '48px 24px 80px' }}>
        <div style={{ fontSize: 12, color: FANTA, letterSpacing: '0.2em', fontWeight: 700, textTransform: 'uppercase', marginBottom: 24 }}>
          <Link href="/news" style={{ color: MUTED, textDecoration: 'none' }}>← Tin tức</Link>
        </div>

        {article.tag && (
          <div style={{ display: 'inline-block', background: FANTA, color: BLACK, padding: '4px 12px', fontFamily: 'Anton, sans-serif', fontSize: 13, letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 16 }}>
            {article.tag}
          </div>
        )}

        <h1 style={{ fontFamily: 'Anton, sans-serif', fontSize: 'clamp(36px, 5vw, 64px)', lineHeight: 1.0, letterSpacing: '0.01em', textTransform: 'uppercase', marginBottom: 16 }}>
          {article.title}
        </h1>

        <div style={{ fontSize: 13, color: MUTED, letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: 32 }}>
          {fmtDate(article.published_at)}
        </div>

        {article.image_url && (
          <img
            src={`${BASE}${article.image_url}`}
            alt={article.title}
            style={{ width: '100%', maxHeight: 500, objectFit: 'cover', marginBottom: 40 }}
          />
        )}

        {article.excerpt && (
          <p style={{ fontSize: 18, lineHeight: 1.7, color: '#d8d3cb', borderLeft: `4px solid ${FANTA}`, paddingLeft: 20, marginBottom: 32, fontStyle: 'italic' }}>
            {article.excerpt}
          </p>
        )}

        <div
          style={{ fontSize: 16, lineHeight: 1.8, color: '#d8d3cb' }}
          dangerouslySetInnerHTML={{ __html: article.content }}
        />
      </main>
      <Footer />
    </div>
  );
}
