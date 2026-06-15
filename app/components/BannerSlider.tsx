'use client';

import { useEffect, useState, useCallback } from 'react';
import { BannerSlide, FANTA } from '../lib/types';
import { api } from '../lib/api';
import { useApp } from '../contexts/AppContext';

const BASE = (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001').replace(/\/$/, '');

function resolveSrc(url: string): string {
  if (!url) return '';
  return url.startsWith('/uploads') ? `${BASE}${url}` : url;
}

export default function BannerSlider() {
  const { t, lang } = useApp();
  const [slides, setSlides] = useState<BannerSlide[]>([]);
  const [idx, setIdx] = useState(0);

  useEffect(() => {
    api.getBannerSlidesPublic().then(setSlides).catch(() => {});
  }, []);

  const total = slides.length;

  const go = useCallback((next: number) => {
    if (total === 0) return;
    setIdx(((next % total) + total) % total);
  }, [total]);

  // Auto-advance
  useEffect(() => {
    if (total <= 1) return;
    const timer = setInterval(() => setIdx(i => (i + 1) % total), 4500);
    return () => clearInterval(timer);
  }, [total]);

  if (total === 0) return null;

  const caption = (s: BannerSlide) => (lang === 'en' && s.caption_en ? s.caption_en : s.caption);

  return (
    <section
      aria-label={t('banner.moments')}
      style={{ position: 'relative', background: '#0a0a0a', borderBottom: `1px solid ${FANTA}33`, overflow: 'hidden' }}
    >
      {/* Track */}
      <div
        className="banner-track"
        style={{
          display: 'flex',
          transform: `translateX(-${idx * 100}%)`,
          transition: 'transform 0.6s cubic-bezier(0.4,0,0.2,1)',
        }}
      >
        {slides.map(s => {
          const inner = (
            <div style={{ position: 'relative', width: '100%', height: '100%' }}>
              {/* Blurred background image */}
              {s.image_url && (
                <img
                  src={resolveSrc(s.image_url)}
                  alt=""
                  style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', display: 'block', filter: 'blur(10px)', zIndex: 0 }}
                />
              )}
              {/* Main image with contain — sits on top, allows blurred bg to show through empty space */}
              <img
                src={resolveSrc(s.image_url)}
                alt={caption(s) || 'Banner'}
                style={{ position: 'absolute', inset: 0, zIndex: 1, width: '100%', height: '100%', objectFit: 'contain', display: 'block' }}
              />
              {/* gradient + caption */}
              {caption(s) && (
                <>
                  <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(0,0,0,0.75) 0%, rgba(0,0,0,0) 45%)', pointerEvents: 'none' }} />
                  <div className="banner-caption" style={{ position: 'absolute', left: 0, bottom: 0, padding: '0 48px 64px', maxWidth: '90%' }}>
                    <span style={{ display: 'inline-block', background: FANTA, color: '#0a0a0a', fontFamily: 'Anton, sans-serif', fontSize: 12, letterSpacing: '0.16em', textTransform: 'uppercase', padding: '6px 14px', marginBottom: 16 }}>
                      {t('banner.moments')}
                    </span>
                    <div style={{ fontFamily: 'Anton, sans-serif', color: '#fff', fontSize: 'clamp(48px, 6vw, 80px)', lineHeight: 0.95, textTransform: 'uppercase', letterSpacing: '0.01em', textShadow: '0 4px 24px rgba(0,0,0,0.8)' }}>
                      {caption(s)}
                    </div>
                  </div>
                </>
              )}
            </div>
          );
          return (
            <div
              key={s.id}
              className="banner-slide"
              style={{ flex: '0 0 100%', width: '100%', aspectRatio: '1920 / 850', background: '#0a0a0a' }}
            >
              {s.link_url
                ? <a href={s.link_url} target="_blank" rel="noopener noreferrer" style={{ display: 'block', width: '100%', height: '100%' }}>{inner}</a>
                : inner}
            </div>
          );
        })}
      </div>

      {total > 1 && (
        <>
          {/* Arrows */}
          <button
            onClick={() => go(idx - 1)}
            aria-label="Previous"
            className="banner-arrow"
            style={{ left: 16 }}
          >‹</button>
          <button
            onClick={() => go(idx + 1)}
            aria-label="Next"
            className="banner-arrow"
            style={{ right: 16 }}
          >›</button>

          {/* Dots */}
          <div style={{ position: 'absolute', bottom: 14, left: '50%', transform: 'translateX(-50%)', display: 'flex', gap: 7, zIndex: 3 }}>
            {slides.map((s, i) => (
              <button
                key={s.id}
                onClick={() => go(i)}
                aria-label={`Slide ${i + 1}`}
                style={{
                  width: i === idx ? 26 : 8, height: 8, borderRadius: 4,
                  background: i === idx ? FANTA : 'rgba(255,255,255,0.5)',
                  border: 'none', cursor: 'pointer', padding: 0, transition: 'all 0.3s',
                }}
              />
            ))}
          </div>
        </>
      )}
    </section>
  );
}
