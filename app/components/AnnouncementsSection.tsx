'use client';

import { useEffect, useRef, useState } from 'react';
import { Announcement, FANTA } from '../lib/types';
import { api } from '../lib/api';
import { useApp } from '../contexts/AppContext';
import { useSwipe } from '../lib/useSwipe';

const BASE = (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001').replace(/\/$/, '');
const GAP = 16;

function resolveSrc(url: string): string {
  if (!url) return '';
  return url.startsWith('/uploads') ? `${BASE}${url}` : url;
}

/**
 * Thông báo ngắn ngay dưới banner: mỗi thẻ là ảnh + đoạn text, không có trang
 * chi tiết. Kéo ngang (chạm hoặc chuột) hoặc bấm mũi tên để xem thông báo khác.
 * Desktop hiện 3 thẻ, tablet 2, mobile 1 thẻ và hé thẻ kế tiếp.
 */
export default function AnnouncementsSection() {
  const { t, lang } = useApp();
  const [items, setItems] = useState<Announcement[]>([]);
  const [idx, setIdx] = useState(0);
  const [width, setWidth] = useState(0);
  const viewport = useRef<HTMLDivElement>(null);

  useEffect(() => {
    api.getAnnouncementsPublic().then(setItems).catch(() => {});
  }, []);

  useEffect(() => {
    const el = viewport.current;
    if (!el) return;
    const ro = new ResizeObserver(() => setWidth(el.clientWidth));
    ro.observe(el);
    setWidth(el.clientWidth);
    return () => ro.disconnect();
  }, [items.length]);

  const total = items.length;
  const mobile = width > 0 && width < 640;
  const perView = width >= 1000 ? 3 : width >= 640 ? 2 : 1;
  const itemW = mobile ? width * 0.86 : (width - GAP * (perView - 1)) / perView;
  const step = itemW + GAP;
  const maxIdx = Math.max(0, mobile ? total - 1 : total - perView);
  const safeIdx = Math.min(idx, maxIdx);
  // Thẻ cuối nằm sát mép phải thay vì để trống phía sau.
  const maxOffset = Math.max(0, total * step - GAP - width);

  const go = (n: number) => setIdx(Math.max(0, Math.min(maxIdx, n)));
  const { dx, dragging, handlers } = useSwipe({
    onPrev: () => go(safeIdx - 1),
    onNext: () => go(safeIdx + 1),
    threshold: 0.12,
  });

  if (total === 0) return null;

  const atStart = safeIdx === 0;
  const atEnd = safeIdx >= maxIdx;
  // Kéo quá hai đầu thì bị "ghì" lại, cho cảm giác đã hết.
  const drag = (atStart && dx > 0) || (atEnd && dx < 0) ? dx * 0.3 : dx;
  const offset = Math.min(safeIdx * step, maxOffset) - drag;
  const text = (a: Announcement) => (lang === 'en' && a.text_en ? a.text_en : a.text);

  const arrow = (dir: 'prev' | 'next', disabled: boolean) => (
    <button
      onClick={() => go(dir === 'prev' ? safeIdx - 1 : safeIdx + 1)}
      disabled={disabled}
      aria-label={dir === 'prev' ? 'Previous' : 'Next'}
      className="ann-arrow"
      style={{ opacity: disabled ? 0.3 : 1, cursor: disabled ? 'default' : 'pointer' }}
    >{dir === 'prev' ? '‹' : '›'}</button>
  );

  return (
    <section id="announcements" className="mob-p-section ann-section" style={{ padding: '56px 48px', borderBottom: `1px solid ${FANTA}33` }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 24, gap: 16 }}>
        <div>
          <div style={{ fontSize: 12, color: FANTA, letterSpacing: '0.2em', fontWeight: 700, textTransform: 'uppercase' }}>{t('announcements.label')}</div>
          <h2 style={{ fontFamily: 'Anton, sans-serif', fontSize: 'clamp(36px, 4.5vw, 56px)', lineHeight: 1, textTransform: 'uppercase', marginTop: 12 }}>{t('announcements.title')}</h2>
        </div>
        {maxIdx > 0 && (
          <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
            {arrow('prev', atStart)}
            {arrow('next', atEnd)}
          </div>
        )}
      </div>

      <div ref={viewport} style={{ overflow: 'hidden' }}>
        <div
          {...(maxIdx > 0 ? handlers : {})}
          style={{
            display: 'flex',
            gap: GAP,
            transform: `translateX(${-offset}px)`,
            transition: dragging ? 'none' : 'transform 0.45s cubic-bezier(0.4,0,0.2,1)',
            touchAction: 'pan-y',
            userSelect: 'none',
            cursor: maxIdx > 0 ? (dragging ? 'grabbing' : 'grab') : undefined,
          }}
        >
          {items.map(a => (
            <article
              key={a.id}
              style={{ flex: `0 0 ${itemW || 300}px`, background: 'var(--card)', borderLeft: `4px solid ${FANTA}`, overflow: 'hidden' }}
            >
              {a.image_url && (
                <div style={{ position: 'relative', aspectRatio: '4 / 3', background: '#0a0a0a', overflow: 'hidden' }}>
                  {/* Nền mờ từ chính ảnh, ảnh chính giữ nguyên không bị cắt */}
                  <img src={resolveSrc(a.image_url)} alt="" draggable={false} style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', filter: 'blur(16px) brightness(0.5)', transform: 'scale(1.1)' }} />
                  <img src={resolveSrc(a.image_url)} alt={text(a).slice(0, 80)} draggable={false} loading="lazy" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'contain' }} />
                </div>
              )}
              <p style={{ margin: 0, padding: '16px 18px 18px', fontSize: 15, lineHeight: 1.55, color: 'var(--prose)', whiteSpace: 'pre-line' }}>
                {text(a)}
              </p>
            </article>
          ))}
        </div>
      </div>

      {maxIdx > 0 && (
        <div style={{ display: 'flex', justifyContent: 'center', gap: 6, marginTop: 18 }}>
          {Array.from({ length: maxIdx + 1 }, (_, i) => (
            <button
              key={i}
              onClick={() => go(i)}
              aria-label={`${i + 1}`}
              style={{ width: i === safeIdx ? 20 : 6, height: 6, background: i === safeIdx ? FANTA : 'var(--line)', border: 'none', cursor: 'pointer', transition: 'all 0.3s', padding: 0 }}
            />
          ))}
        </div>
      )}
    </section>
  );
}
