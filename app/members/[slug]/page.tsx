import Link from 'next/link';
import { notFound } from 'next/navigation';
import Header from '../../components/Header';
import Footer from '../../components/Footer';
import { MemorialPost, FANTA, fmtDate } from '../../lib/types';

const BASE = (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001').replace(/\/$/, '');
const BLACK = '#0a0a0a';
const INK = '#f4f1ea';
const MUTED = '#a09b94';

async function getPost(slug: string): Promise<MemorialPost | null> {
  try {
    const res = await fetch(`${BASE}/api/memorial-posts/${encodeURIComponent(slug)}`, { next: { revalidate: 60 } });
    if (!res.ok) return null;
    return res.json();
  } catch { return null; }
}

export default async function MemberPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const post = await getPost(slug);
  if (!post) notFound();

  const resolveImg = (url: string) => url.startsWith('/uploads') ? `${BASE}${url}` : url;

  return (
    <div style={{ background: BLACK, color: INK, fontFamily: '"Space Grotesk", system-ui, sans-serif', minHeight: '100vh' }}>
      <Header />
      <main className="mob-p-main" style={{ maxWidth: 1200, margin: '0 auto', padding: '48px 48px 80px' }}>

        <div style={{ fontSize: 12, color: MUTED, letterSpacing: '0.2em', fontWeight: 700, textTransform: 'uppercase', marginBottom: 24 }}>
          <Link href="/#members" style={{ color: MUTED, textDecoration: 'none' }}>← Giới thiệu thành viên</Link>
        </div>

        {post.tag && (
          <div style={{ display: 'inline-block', background: FANTA, color: BLACK, padding: '4px 12px', fontFamily: 'Anton, sans-serif', fontSize: 13, letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 16 }}>
            {post.tag}
          </div>
        )}

        <h1 style={{ fontFamily: 'Anton, sans-serif', fontSize: 'clamp(36px, 5vw, 64px)', lineHeight: 1.0, letterSpacing: '0.01em', textTransform: 'uppercase', marginBottom: 16 }}>
          {post.title}
        </h1>

        <div style={{ fontSize: 13, color: MUTED, letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: 32 }}>
          {fmtDate(post.published_at)}
        </div>

        {post.image_url && (
          <img
            src={resolveImg(post.image_url)}
            alt={post.title}
            style={{ width: '100%', height: 'auto', display: 'block', marginBottom: 40 }}
          />
        )}

        {post.excerpt && (
          <p style={{ fontSize: 18, lineHeight: 1.7, color: '#d8d3cb', borderLeft: `4px solid ${FANTA}`, paddingLeft: 20, marginBottom: 32, fontStyle: 'italic' }}>
            {post.excerpt}
          </p>
        )}

        {post.content && (
          <div
            style={{ fontSize: 16, lineHeight: 1.8, color: '#d8d3cb' }}
            dangerouslySetInnerHTML={{ __html: post.content }}
          />
        )}
      </main>
      <Footer />
    </div>
  );
}
