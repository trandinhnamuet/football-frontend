'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import Header from '../components/Header';
import Footer from '../components/Footer';
import { FANTA } from '../lib/types';
import { api } from '../lib/api';
import { useApp } from '../contexts/AppContext';

const BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

type AboutData = {
  id: number;
  banner_image_url: string;
  content_vi: string;
  content_en: string;
  updated_at: string;
};

export default function AboutPage() {
  const { t, lang } = useApp();
  const [data, setData] = useState<AboutData | null>(null);

  useEffect(() => {
    api.getAboutPage().then(setData).catch(() => {});
  }, []);

  const content = data ? (lang === 'en' ? data.content_en : data.content_vi) : '';
  const bannerUrl = data?.banner_image_url ? `${BASE}${data.banner_image_url}` : null;

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)', color: 'var(--ink)' }}>
      <Header />

      {/* Banner */}
      <div style={{ position: 'relative', width: '100%', height: 'clamp(280px, 40vw, 520px)', overflow: 'hidden' }}>
        {bannerUrl ? (
          <>
            <img
              src={bannerUrl}
              alt="Banner"
              style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', filter: 'blur(4px) brightness(0.4)', transform: 'scale(1.06)' }}
            />
            <img
              src={bannerUrl}
              alt=""
              aria-hidden
              style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', opacity: 0.15 }}
            />
          </>
        ) : (
          <div style={{ position: 'absolute', inset: 0, background: '#111' }} />
        )}
        <div style={{ position: 'relative', zIndex: 1, height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 12 }}>
          <div style={{ fontSize: 12, color: FANTA, letterSpacing: '0.2em', fontWeight: 700, textTransform: 'uppercase' }}>{t('sections.s01')}</div>
          <h1 style={{ fontFamily: 'Anton, sans-serif', fontSize: 'clamp(48px, 6vw, 96px)', lineHeight: 0.9, textTransform: 'uppercase', letterSpacing: '0.01em', color: '#fff', textAlign: 'center', padding: '0 24px' }}>
            Lon Fanta FC
          </h1>
        </div>
      </div>

      {/* Body */}
      <main style={{ maxWidth: 860, margin: '0 auto', padding: '64px 32px' }}>
        <Link href="/" style={{ fontSize: 13, color: FANTA, textDecoration: 'none', letterSpacing: '0.1em', textTransform: 'uppercase', fontWeight: 700 }}>
          {t('about.backHome')}
        </Link>

        <h2 style={{ fontFamily: 'Anton, sans-serif', fontSize: 'clamp(36px, 4vw, 56px)', textTransform: 'uppercase', marginTop: 32, marginBottom: 32 }}>
          {t('about.title')}
        </h2>

        {content ? (
          <div
            className="about-content"
            dangerouslySetInnerHTML={{ __html: content }}
            style={{ fontSize: 17, lineHeight: 1.75, color: 'var(--muted)' }}
          />
        ) : (
          <p style={{ fontSize: 17, lineHeight: 1.75, color: 'var(--muted)' }}>{t('about.noContent')}</p>
        )}
      </main>

      <Footer />
    </div>
  );
}
