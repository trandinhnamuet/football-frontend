'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import Header from '../components/Header';
import Footer from '../components/Footer';
import { useApp } from '../contexts/AppContext';
import { api, API_BASE } from '../lib/api';
import { RecruitmentPost, FANTA, fmtDate, recruitIsOpen, recruitPositionLabel } from '../lib/types';

const BLACK = 'var(--bg)';
const CARD = 'var(--card)';
const INK = 'var(--ink)';
const MUTED = 'var(--muted)';
// Text sitting on a FANTA-orange fill stays dark in both themes — light text on
// orange fails contrast.
const ON_FANTA = '#0a0a0a';

const resolveImg = (url: string) => url.startsWith('/uploads') ? `${API_BASE}${url}` : url;

function RecruitCard({ post, lang, t }: { post: RecruitmentPost; lang: 'vi' | 'en'; t: (k: string) => string }) {
  const open = recruitIsOpen(post);
  const title = (lang === 'en' && post.title_en) ? post.title_en : post.title;
  const excerpt = (lang === 'en' && post.excerpt_en) ? post.excerpt_en : post.excerpt;

  return (
    <Link
      href={`/recruitment/${post.slug || post.id}`}
      style={{
        textDecoration: 'none', color: 'inherit', background: CARD, display: 'block', overflow: 'hidden',
        borderLeft: `4px solid ${open ? FANTA : 'var(--line)'}`, opacity: open ? 1 : 0.6,
      }}
    >
      {post.image_url && (
        <div style={{
          aspectRatio: '16/7', backgroundImage: `url(${resolveImg(post.image_url)})`,
          backgroundSize: 'cover', backgroundPosition: 'center',
        }} />
      )}
      <div style={{ padding: 20 }}>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap', marginBottom: 12 }}>
          <span style={{ background: open ? FANTA : 'var(--line)', color: open ? ON_FANTA : MUTED, padding: '3px 10px', fontFamily: 'Anton, sans-serif', fontSize: 11, letterSpacing: '0.08em', textTransform: 'uppercase' }}>
            {open ? t('recruit.open') : (post.is_open ? t('recruit.expired') : t('recruit.closed'))}
          </span>
          <span style={{ border: `1px solid ${FANTA}66`, color: FANTA, padding: '2px 10px', fontSize: 11, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase' }}>
            {recruitPositionLabel(post.position, lang)}
            {post.quantity > 1 ? ` × ${post.quantity}` : ''}
          </span>
        </div>
        <h3 style={{ fontFamily: 'Anton, sans-serif', fontSize: 24, lineHeight: 1.2, letterSpacing: '0.01em', textTransform: 'uppercase', margin: '0 0 8px' }}>
          {title}
        </h3>
        {excerpt && <p style={{ color: 'var(--prose)', fontSize: 13, lineHeight: 1.55, margin: '0 0 14px' }}>{excerpt}</p>}
        <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, fontSize: 11, color: MUTED, letterSpacing: '0.1em', textTransform: 'uppercase' }}>
          <span>{t('recruit.posted')} {fmtDate(post.published_at)}</span>
          <span>{t('recruit.deadline')}: {post.expires_at ? fmtDate(post.expires_at) : t('recruit.noDeadline')}</span>
        </div>
        <div style={{ marginTop: 14, color: FANTA, fontSize: 12, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase' }}>
          {t('recruit.detail')}
        </div>
      </div>
    </Link>
  );
}

export default function RecruitmentList({ initialPosts }: { initialPosts: RecruitmentPost[] }) {
  const { lang, t } = useApp();
  const [posts, setPosts] = useState<RecruitmentPost[]>(initialPosts);

  // Refresh on the client so an admin edit shows up before the 60s ISR window.
  useEffect(() => {
    api.getRecruitmentPosts().then(setPosts).catch(() => {});
  }, []);

  const openPosts = posts.filter(recruitIsOpen);
  const closedPosts = posts.filter(p => !recruitIsOpen(p));

  return (
    <div style={{ background: BLACK, color: INK, fontFamily: '"Space Grotesk", system-ui, sans-serif', minHeight: '100vh' }}>
      <Header />
      <main className="mob-p-main" style={{ padding: '48px 48px 80px' }}>
        <div style={{ marginBottom: 40 }}>
          <div style={{ fontSize: 12, color: FANTA, letterSpacing: '0.2em', fontWeight: 700, textTransform: 'uppercase', marginBottom: 24 }}>
            <Link href="/" style={{ color: MUTED, textDecoration: 'none' }}>{t('recruit.backHome')}</Link>
            {' '}/ {t('recruit.label')}
          </div>
          <h1 style={{ fontFamily: 'Anton, sans-serif', fontSize: 'clamp(56px, 8vw, 96px)', lineHeight: 0.92, letterSpacing: '0.01em', textTransform: 'uppercase', margin: 0 }}>
            {t('recruit.title1')} <span style={{ color: FANTA }}>{t('recruit.title2')}</span>
          </h1>
          <p style={{ color: MUTED, fontSize: 15, marginTop: 28, maxWidth: 560, lineHeight: 1.6 }}>{t('recruit.subtitle')}</p>
          <p style={{ color: FANTA, fontSize: 13, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', marginTop: 12 }}>
            {openPosts.length} {t('recruit.countOpen')}
          </p>
        </div>

        {openPosts.length === 0 ? (
          <div style={{ padding: '80px 40px', textAlign: 'center', background: CARD, borderLeft: `4px solid ${FANTA}` }}>
            <div style={{ fontFamily: 'Anton, sans-serif', fontSize: 28, color: MUTED, textTransform: 'uppercase', lineHeight: 1.2 }}>{t('recruit.noData')}</div>
          </div>
        ) : (
          <div className="mob-news-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 20 }}>
            {openPosts.map(p => <RecruitCard key={p.id} post={p} lang={lang} t={t} />)}
          </div>
        )}

        {closedPosts.length > 0 && (
          <div style={{ marginTop: 64 }}>
            <div style={{ fontSize: 12, color: MUTED, letterSpacing: '0.2em', fontWeight: 700, textTransform: 'uppercase', marginBottom: 20, paddingBottom: 10, borderBottom: '1px solid var(--line)' }}>
              {t('recruit.closedSection')}
            </div>
            <div className="mob-news-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 20 }}>
              {closedPosts.map(p => <RecruitCard key={p.id} post={p} lang={lang} t={t} />)}
            </div>
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
}
