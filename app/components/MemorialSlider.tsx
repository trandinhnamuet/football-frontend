'use client';

import { useEffect, useState } from 'react';
import { MemorialPost, FANTA, fmtDate } from '../lib/types';
import { api } from '../lib/api';
import { useApp } from '../contexts/AppContext';

const BASE = (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001').replace(/\/$/, '');
const PAGE_SIZE = 4;

function resolveImg(url: string | null | undefined): string {
  if (!url) return '';
  return url.startsWith('/uploads') ? `${BASE}${url}` : url;
}

export default function MemorialSlider() {
  const { t, lang } = useApp();
  const [posts, setPosts] = useState<MemorialPost[]>([]);
  const [page, setPage] = useState(0);
  const [slideClass, setSlideClass] = useState('slide-from-right');
  const [animKey, setAnimKey] = useState(0);

  useEffect(() => {
    api.getMemorialPosts().then(setPosts).catch(() => {});
  }, []);

  const totalPages = Math.max(1, Math.ceil(posts.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages - 1);
  const visible = posts.slice(safePage * PAGE_SIZE, (safePage + 1) * PAGE_SIZE);

  function go(dir: 'next' | 'prev') {
    const cls = dir === 'next' ? 'slide-from-right' : 'slide-from-left';
    setSlideClass(cls);
    setAnimKey(k => k + 1);
    setPage(p =>
      dir === 'next'
        ? (p + 1) % totalPages
        : (p - 1 + totalPages) % totalPages,
    );
  }

  useEffect(() => {
    if (totalPages <= 1) return;
    const timer = setInterval(() => go('next'), 5000);
    return () => clearInterval(timer);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [totalPages]);

  if (posts.length === 0) return null;

  return (
    <section
      className="mob-p-section"
      style={{
        aspectRatio: '1920 / 850',
        padding: '28px 48px',
        background: 'var(--bg)',
        borderTop: `1px solid ${FANTA}33`,
        display: 'flex',
        flexDirection: 'column',
        boxSizing: 'border-box',
        overflow: 'hidden',
      }}
    >
      {/* Header — compact so cards get most of the height */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexShrink: 0,
          marginBottom: 14,
        }}
      >
        <div>
          <div style={{ fontSize: 11, color: FANTA, letterSpacing: '0.2em', fontWeight: 700, textTransform: 'uppercase' }}>
            {t('sections.s05')}
          </div>
          <h2 style={{ fontFamily: 'Anton, sans-serif', fontSize: 'clamp(28px, 3vw, 44px)', lineHeight: 0.95, textTransform: 'uppercase', margin: '6px 0 0' }}>
            {t('memorial.title')}
          </h2>
        </div>
        {totalPages > 1 && (
          <div style={{ display: 'flex', gap: 8 }}>
            <button
              onClick={() => go('prev')}
              style={{ background: 'rgba(255,107,26,0.1)', border: `1px solid ${FANTA}44`, color: FANTA, width: 40, height: 40, fontFamily: 'Anton, sans-serif', fontSize: 18, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
            >‹</button>
            <button
              onClick={() => go('next')}
              style={{ background: 'rgba(255,107,26,0.1)', border: `1px solid ${FANTA}44`, color: FANTA, width: 40, height: 40, fontFamily: 'Anton, sans-serif', fontSize: 18, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
            >›</button>
          </div>
        )}
      </div>

      {/* Cards — 2 columns × 2 rows, fills all remaining vertical space */}
      <div
        key={animKey}
        className={`${slideClass} mob-memorial-grid`}
        style={{
          flex: 1,
          minHeight: 0,
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gridTemplateRows: '1fr 1fr',
          gap: 12,
        }}
      >
        {visible.map(post => {
          const title = lang === 'en' && post.title_en ? post.title_en : post.title;
          const excerpt = lang === 'en' && post.excerpt_en ? post.excerpt_en : post.excerpt;
          const tag = lang === 'en' && post.tag_en ? post.tag_en : post.tag;
          return (
            <div
              key={post.id}
              style={{ background: 'var(--card)', display: 'flex', flexDirection: 'column', borderLeft: `4px solid ${FANTA}`, overflow: 'hidden' }}
            >
              {/* Image — 58% of card height */}
              <div style={{ flex: '0 0 58%', background: '#0a0a0a', position: 'relative', overflow: 'hidden' }}>
                {post.image_url ? (
                  <>
                    <div style={{ position: 'absolute', inset: 0, backgroundImage: `url(${resolveImg(post.image_url)})`, backgroundSize: 'cover', backgroundPosition: 'center', filter: 'blur(14px)', transform: 'scale(1.1)' }} />
                    <div style={{ position: 'absolute', inset: 0, backgroundImage: `url(${resolveImg(post.image_url)})`, backgroundSize: 'contain', backgroundPosition: 'center', backgroundRepeat: 'no-repeat' }} />
                  </>
                ) : (
                  <div style={{ position: 'absolute', inset: 0, backgroundImage: 'repeating-linear-gradient(135deg, transparent 0 14px, rgba(255,107,26,0.06) 14px 15px)' }} />
                )}
                {tag && (
                  <div style={{ position: 'absolute', top: 10, left: 10, zIndex: 2, background: FANTA, color: '#0a0a0a', padding: '3px 10px', fontFamily: 'Anton, sans-serif', fontSize: 11, letterSpacing: '0.08em', textTransform: 'uppercase' }}>
                    {tag}
                  </div>
                )}
              </div>

              {/* Content — fills remaining 42% */}
              <div style={{ flex: 1, padding: '14px 16px', display: 'flex', flexDirection: 'column', gap: 6, overflow: 'hidden' }}>
                <div style={{ fontSize: 11, color: 'var(--muted)', letterSpacing: '0.12em', textTransform: 'uppercase', flexShrink: 0 }}>
                  {fmtDate(post.published_at)}
                </div>
                <h3 style={{ fontFamily: 'Anton, sans-serif', fontSize: 'clamp(15px, 1.4vw, 20px)', lineHeight: 1.05, letterSpacing: '0.01em', textTransform: 'uppercase', margin: 0, flexShrink: 0 }}>
                  {title}
                </h3>
                {excerpt && (
                  <p style={{ color: 'var(--muted)', fontSize: 13, lineHeight: 1.5, margin: 0, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                    {excerpt}
                  </p>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Dots */}
      {totalPages > 1 && (
        <div style={{ display: 'flex', justifyContent: 'center', gap: 6, paddingTop: 10, flexShrink: 0 }}>
          {Array.from({ length: totalPages }, (_, i) => (
            <button
              key={i}
              onClick={() => {
                setSlideClass(i > safePage ? 'slide-from-right' : 'slide-from-left');
                setAnimKey(k => k + 1);
                setPage(i);
              }}
              style={{ width: i === safePage ? 20 : 6, height: 6, background: i === safePage ? FANTA : 'var(--line)', border: 'none', cursor: 'pointer', transition: 'all 0.3s', padding: 0 }}
            />
          ))}
        </div>
      )}
    </section>
  );
}
