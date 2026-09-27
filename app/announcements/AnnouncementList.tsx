'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import Header from '../components/Header';
import Footer from '../components/Footer';
import { useApp } from '../contexts/AppContext';
import { api } from '../lib/api';
import { Article, FANTA, fmtDate, announcementIsActive, sortAnnouncements } from '../lib/types';

const BLACK = 'var(--bg)';
const CARD = 'var(--card)';
const INK = 'var(--ink)';
const MUTED = 'var(--muted)';
// Text sitting on a FANTA-orange fill stays dark in both themes — light text on
// orange fails contrast.
const ON_FANTA = '#0a0a0a';

function Row({ a, lang, t }: { a: Article; lang: 'vi' | 'en'; t: (k: string) => string }) {
  const active = announcementIsActive(a);
  return (
    <Link
      href={`/news/${a.id}`}
      className="news-card"
      style={{
        textDecoration: 'none', color: 'inherit', background: CARD,
        borderLeft: `4px solid ${active ? FANTA : 'var(--line)'}`, padding: '20px 24px',
        display: 'grid', gridTemplateColumns: 'auto 1fr', gap: 18, alignItems: 'center',
        opacity: active ? 1 : 0.65,
      }}
    >
      <div style={{ fontSize: 22, lineHeight: 1, minWidth: 28, textAlign: 'center' }}>{a.is_pinned && active ? '📌' : '📢'}</div>
      <div style={{ minWidth: 0 }}>
        <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap', fontSize: 11, color: MUTED, letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: 6 }}>
          <span style={{ background: active ? FANTA : 'var(--line)', color: active ? ON_FANTA : MUTED, padding: '2px 8px', fontFamily: 'Anton, sans-serif', letterSpacing: '0.08em' }}>
            {active ? t('announcements.active') : t('announcements.expired')}
          </span>
          <span>{fmtDate(a.published_at)}</span>
          {a.is_pinned && active && <span style={{ color: FANTA, fontWeight: 700 }}>{t('announcements.pinned')}</span>}
          {a.expires_at && <span>{t('announcements.until')} {fmtDate(a.expires_at)}</span>}
          {a.tag && <span style={{ border: `1px solid ${FANTA}66`, color: FANTA, padding: '1px 8px', fontWeight: 700 }}>{lang === 'en' && a.tag_en ? a.tag_en : a.tag}</span>}
        </div>
        <div style={{ fontFamily: 'Anton, sans-serif', fontSize: 22, lineHeight: 1.25, letterSpacing: '0.01em', textTransform: 'uppercase' }}>
          {lang === 'en' && a.title_en ? a.title_en : a.title}
        </div>
        {a.excerpt && <div style={{ color: 'var(--prose)', fontSize: 14, lineHeight: 1.55, marginTop: 6 }}>{lang === 'en' && a.excerpt_en ? a.excerpt_en : a.excerpt}</div>}
      </div>
    </Link>
  );
}

export default function AnnouncementList({ initialItems }: { initialItems: Article[] }) {
  const { lang, t } = useApp();
  const [items, setItems] = useState<Article[]>(initialItems);

  // Refresh on the client so an admin edit shows up before the 60s ISR window.
  useEffect(() => {
    api.getArticles('announcement').then(setItems).catch(() => {});
  }, []);

  const active = sortAnnouncements(items.filter(announcementIsActive));
  const past = items.filter(a => !announcementIsActive(a));

  return (
    <div style={{ background: BLACK, color: INK, fontFamily: '"Space Grotesk", system-ui, sans-serif', minHeight: '100vh' }}>
      <Header />
      <main className="mob-p-main" style={{ maxWidth: 1100, margin: '0 auto', padding: '48px 48px 80px' }}>
        <div style={{ marginBottom: 40 }}>
          <div style={{ fontSize: 12, color: FANTA, letterSpacing: '0.2em', fontWeight: 700, textTransform: 'uppercase', marginBottom: 24 }}>
            <Link href="/" style={{ color: MUTED, textDecoration: 'none' }}>{t('announcements.backHome')}</Link>
            {' '}/ {t('announcements.title')}
          </div>
          <h1 style={{ fontFamily: 'Anton, sans-serif', fontSize: 'clamp(56px, 8vw, 96px)', lineHeight: 0.92, letterSpacing: '0.01em', textTransform: 'uppercase', margin: 0 }}>
            <span style={{ color: FANTA }}>{t('announcements.title')}</span>
          </h1>
          <div style={{ display: 'flex', gap: 20, alignItems: 'center', flexWrap: 'wrap', marginTop: 28 }}>
            <p style={{ color: FANTA, fontSize: 13, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', margin: 0 }}>
              {active.length} {t('announcements.count')}
            </p>
            <Link href="/news" style={{ color: MUTED, fontSize: 13, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', textDecoration: 'none' }}>
              {t('announcements.newsLink')}
            </Link>
          </div>
        </div>

        {active.length === 0 ? (
          <div style={{ padding: '80px 40px', textAlign: 'center', background: CARD, borderLeft: `4px solid ${FANTA}` }}>
            <div style={{ fontFamily: 'Anton, sans-serif', fontSize: 28, color: MUTED, textTransform: 'uppercase', lineHeight: 1.2 }}>{t('announcements.noData')}</div>
          </div>
        ) : (
          <div style={{ display: 'grid', gap: 12 }}>
            {active.map(a => <Row key={a.id} a={a} lang={lang} t={t} />)}
          </div>
        )}

        {past.length > 0 && (
          <div style={{ marginTop: 64 }}>
            <div style={{ fontSize: 12, color: MUTED, letterSpacing: '0.2em', fontWeight: 700, textTransform: 'uppercase', marginBottom: 20, paddingBottom: 10, borderBottom: '1px solid var(--line)' }}>
              {t('announcements.pastSection')}
            </div>
            <div style={{ display: 'grid', gap: 12 }}>
              {past.map(a => <Row key={a.id} a={a} lang={lang} t={t} />)}
            </div>
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
}
