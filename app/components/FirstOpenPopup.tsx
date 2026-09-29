'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Article, Match, FANTA, fmtDate, daysUntil, pitchLabel, kitColorHex } from '../lib/types';
import { useApp } from '../contexts/AppContext';
import { useAuth } from '../contexts/AuthContext';
import { smoothScrollToHash } from '../lib/scroll';

const BASE = (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001').replace(/\/$/, '');

/**
 * Popup hiện ngay khi mở app trên điện thoại (đã đăng nhập): thông báo quan
 * trọng mới nhất (nếu có) + trận kế tiếp với đối thủ, giờ, sân và màu áo.
 *
 * "Mở lần đầu" = tài liệu được tải mới (mở app từ màn hình chính, gõ URL,
 * reload). Cờ nằm ở cấp module nên: điều hướng trong app (Link) không hiện
 * lại, còn app bị hệ điều hành đóng rồi mở lại thì tài liệu mới → hiện lại.
 */
let shownThisDocument = false;

interface Props {
  ready: boolean;
  nextMatch: Match | null;
  important: Article | null;
}

function resolveImg(url: string | null | undefined): string {
  if (!url) return '';
  return url.startsWith('/uploads') ? `${BASE}${url}` : url;
}

export default function FirstOpenPopup({ ready, nextMatch, important }: Props) {
  const { t, lang } = useApp();
  const { user, loading } = useAuth();
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!ready || loading || !user || shownThisDocument) return;
    if (!window.matchMedia('(max-width: 768px)').matches) return;
    if (!nextMatch && !important) return;
    shownThisDocument = true;
    // Để trang vẽ xong một nhịp rồi mới trượt sheet lên.
    const t = setTimeout(() => setOpen(true), 250);
    return () => clearTimeout(t);
  }, [ready, loading, user, nextMatch, important]);

  // Khoá cuộn nền + Esc để đóng khi popup đang mở.
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setOpen(false); };
    window.addEventListener('keydown', onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener('keydown', onKey);
    };
  }, [open]);

  if (!open) return null;

  const shortName = user?.player?.last_name || user?.display_name || user?.username || '';
  const kitHex = kitColorHex(nextMatch?.kit_color);
  const d = nextMatch ? daysUntil(nextMatch.date) : 0;
  const countdown = d <= 0 ? t('schedule.countdownToday') : `${d} ${t('schedule.countdownDays')}`;
  const impTitle = important ? (lang === 'en' && important.title_en ? important.title_en : important.title) : '';
  const impExcerpt = important ? (lang === 'en' && important.excerpt_en ? important.excerpt_en : important.excerpt) : '';

  function close() { setOpen(false); }
  function goSchedule() {
    close();
    // Đợi body hết khoá cuộn rồi mới cuộn.
    setTimeout(() => smoothScrollToHash('#schedule'), 30);
  }

  return (
    <div className="first-open-backdrop" onClick={close} role="dialog" aria-modal="true" aria-label={t('popup.nextMatch')}>
      <div className="first-open-sheet" onClick={e => e.stopPropagation()}>
        <div className="first-open-grip" />
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
          <div style={{ fontSize: 12, color: 'var(--muted)', letterSpacing: '0.14em', textTransform: 'uppercase', fontWeight: 700 }}>
            {t('popup.hello')} <span style={{ color: FANTA }}>{shortName}</span>
          </div>
          <button onClick={close} aria-label={t('popup.close')} style={{ background: 'none', border: '1px solid var(--line)', color: 'var(--muted)', fontSize: 20, lineHeight: 1, padding: '4px 10px', cursor: 'pointer' }}>×</button>
        </div>

        {important && (
          <Link href={`/news/${important.id}`} onClick={close} className="first-open-important" style={{ display: 'block', textDecoration: 'none', color: 'inherit', background: 'rgba(255,107,26,0.1)', border: `1px solid ${FANTA}`, padding: '14px 16px', marginBottom: 14 }}>
            <div style={{ display: 'inline-block', background: FANTA, color: '#0a0a0a', fontFamily: 'Anton, sans-serif', fontSize: 11, letterSpacing: '0.12em', textTransform: 'uppercase', padding: '3px 8px', marginBottom: 8 }}>
              ! {t('news.important')}
            </div>
            <div style={{ fontFamily: 'Anton, sans-serif', fontSize: 18, lineHeight: 1.25, textTransform: 'uppercase', letterSpacing: '0.01em' }}>{impTitle}</div>
            {impExcerpt && (
              <div style={{ fontSize: 13, color: 'var(--muted)', marginTop: 6, lineHeight: 1.5, display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{impExcerpt}</div>
            )}
            <div style={{ fontSize: 12, color: FANTA, fontWeight: 700, marginTop: 8, letterSpacing: '0.06em', textTransform: 'uppercase' }}>{t('news.readMore')}</div>
          </Link>
        )}

        {nextMatch ? (
          <div style={{ background: 'var(--card)', borderLeft: `4px solid ${FANTA}`, overflow: 'hidden' }}>
            {nextMatch.image_url && (
              <div style={{ aspectRatio: '16/7', background: '#0a0a0a', backgroundImage: `url(${resolveImg(nextMatch.image_url)})`, backgroundSize: 'contain', backgroundRepeat: 'no-repeat', backgroundPosition: 'center' }} />
            )}
            <div style={{ padding: '14px 16px 16px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 10 }}>
                <div style={{ fontFamily: 'Anton, sans-serif', fontSize: 12, color: FANTA, letterSpacing: '0.14em', textTransform: 'uppercase' }}>▶ {t('popup.nextMatch')} · {t('hero.week')} {nextMatch.week}</div>
                <div style={{ fontFamily: 'Anton, sans-serif', fontSize: 13, color: FANTA, background: 'rgba(255,107,26,0.12)', padding: '3px 8px', whiteSpace: 'nowrap' }}>⏱ {countdown}</div>
              </div>
              <div style={{ fontFamily: 'Anton, sans-serif', fontSize: 26, lineHeight: 1.05, textTransform: 'uppercase', marginTop: 10 }}>
                <span style={{ color: FANTA }}>Lon Fanta</span> <span style={{ color: 'var(--muted)', fontSize: 16 }}>{t('schedule.vs')}</span> {nextMatch.opponent}
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px 12px', marginTop: 14 }}>
                <div>
                  <div style={{ fontSize: 10, color: 'var(--muted)', letterSpacing: '0.12em', textTransform: 'uppercase' }}>{fmtDate(nextMatch.date)}</div>
                  <div style={{ fontFamily: 'Anton, sans-serif', fontSize: 32, color: FANTA, lineHeight: 1, marginTop: 2 }}>{nextMatch.time || '17:30'}</div>
                </div>
                <div>
                  <div style={{ fontSize: 10, color: 'var(--muted)', letterSpacing: '0.12em', textTransform: 'uppercase' }}>📍 {t('schedule.venue')}</div>
                  <div style={{ fontFamily: 'Anton, sans-serif', fontSize: 18, lineHeight: 1.1, marginTop: 4, textTransform: 'uppercase' }}>{nextMatch.venue || '—'}</div>
                  <div style={{ fontSize: 11, color: 'var(--muted)', marginTop: 2 }}>{pitchLabel(nextMatch.pitch_size, lang)}</div>
                </div>
                <div style={{ gridColumn: '1 / -1', display: 'flex', alignItems: 'center', gap: 10, paddingTop: 10, borderTop: '1px solid var(--line)' }}>
                  <div style={{ fontSize: 10, color: 'var(--muted)', letterSpacing: '0.12em', textTransform: 'uppercase' }}>{t('schedule.kit')}</div>
                  {kitHex && <span aria-hidden style={{ width: 18, height: 18, background: kitHex, border: '1px solid rgba(128,128,128,0.5)', flexShrink: 0 }} />}
                  <div style={{ fontFamily: 'Anton, sans-serif', fontSize: 20, textTransform: 'uppercase', letterSpacing: '0.02em', color: nextMatch.kit_color ? 'var(--ink)' : 'var(--muted)' }}>
                    {nextMatch.kit_color || t('schedule.kitUnset')}
                  </div>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div style={{ color: 'var(--muted)', fontSize: 14, padding: '12px 0' }}>{t('popup.noMatch')}</div>
        )}

        <div style={{ display: 'flex', gap: 10, marginTop: 16 }}>
          {nextMatch && (
            <button onClick={goSchedule} style={{ flex: 1, background: FANTA, color: '#0a0a0a', border: 'none', padding: '13px', fontFamily: 'Anton, sans-serif', fontSize: 15, letterSpacing: '0.06em', textTransform: 'uppercase', cursor: 'pointer' }}>
              {t('popup.viewSchedule')}
            </button>
          )}
          <button onClick={close} style={{ flex: nextMatch ? 0.6 : 1, background: 'transparent', color: 'var(--ink)', border: '1px solid var(--line)', padding: '13px', fontFamily: 'Anton, sans-serif', fontSize: 15, letterSpacing: '0.06em', textTransform: 'uppercase', cursor: 'pointer' }}>
            {t('popup.close')}
          </button>
        </div>
      </div>
    </div>
  );
}
