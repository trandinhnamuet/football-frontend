'use client';

import Link from 'next/link';
import Header from '../components/Header';
import Footer from '../components/Footer';
import { useApp } from '../contexts/AppContext';
import { API_BASE } from '../lib/api';
import { RecruitmentPost, FANTA, fmtDate, recruitIsOpen, recruitPositionLabel } from '../lib/types';
import { normalizeProse } from '../lib/prose';

const BLACK = 'var(--bg)';
const CARD = 'var(--card)';
const INK = 'var(--ink)';
const MUTED = 'var(--muted)';
// Text sitting on a FANTA-orange fill stays dark in both themes — light text on
// orange fails contrast.
const ON_FANTA = '#0a0a0a';

const resolveImg = (url: string) => url.startsWith('/uploads') ? `${API_BASE}${url}` : url;

export default function RecruitmentDetail({ post }: { post: RecruitmentPost }) {
  const { lang, t } = useApp();
  const open = recruitIsOpen(post);
  const title = (lang === 'en' && post.title_en) ? post.title_en : post.title;
  const excerpt = (lang === 'en' && post.excerpt_en) ? post.excerpt_en : post.excerpt;
  const content = (lang === 'en' && post.content_en) ? post.content_en : post.content;
  const hasContact = !!(post.contact_name || post.contact_phone || post.contact_link);

  const labelStyle: React.CSSProperties = { fontSize: 11, color: MUTED, letterSpacing: '0.14em', textTransform: 'uppercase', fontWeight: 600, marginBottom: 4 };
  const valueStyle: React.CSSProperties = { fontFamily: 'Anton, sans-serif', fontSize: 20, letterSpacing: '0.02em', textTransform: 'uppercase' };

  return (
    <div style={{ background: BLACK, color: INK, fontFamily: '"Space Grotesk", system-ui, sans-serif', minHeight: '100vh' }}>
      <Header />
      <main className="mob-p-main" style={{ maxWidth: 1200, margin: '0 auto', padding: '48px 48px 80px' }}>
        <div style={{ fontSize: 12, color: MUTED, letterSpacing: '0.2em', fontWeight: 700, textTransform: 'uppercase', marginBottom: 24 }}>
          <Link href="/recruitment" style={{ color: MUTED, textDecoration: 'none' }}>{t('recruit.back')}</Link>
        </div>

        <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap', marginBottom: 16 }}>
          <span style={{ background: open ? FANTA : 'var(--line)', color: open ? ON_FANTA : MUTED, padding: '4px 12px', fontFamily: 'Anton, sans-serif', fontSize: 13, letterSpacing: '0.08em', textTransform: 'uppercase' }}>
            {open ? t('recruit.open') : (post.is_open ? t('recruit.expired') : t('recruit.closed'))}
          </span>
          <span style={{ border: `1px solid ${FANTA}66`, color: FANTA, padding: '3px 12px', fontSize: 12, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase' }}>
            {recruitPositionLabel(post.position, lang)}
          </span>
        </div>

        <h1 style={{ fontFamily: 'Anton, sans-serif', fontSize: 'clamp(36px, 5vw, 64px)', lineHeight: 1.2, letterSpacing: '0.01em', textTransform: 'uppercase', marginBottom: 16 }}>
          {title}
        </h1>

        <div style={{ fontSize: 13, color: MUTED, letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: 32 }}>
          {t('recruit.posted')} {fmtDate(post.published_at)}
        </div>

        {/* Thông số nhanh: vị trí / số lượng / hạn */}
        <div className="mob-grid-1" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, marginBottom: 40 }}>
          <div style={{ background: CARD, padding: '16px 20px', borderLeft: `4px solid ${FANTA}` }}>
            <div style={labelStyle}>{t('recruit.position')}</div>
            <div style={valueStyle}>{recruitPositionLabel(post.position, lang)}</div>
          </div>
          <div style={{ background: CARD, padding: '16px 20px', borderLeft: `4px solid ${FANTA}` }}>
            <div style={labelStyle}>{t('recruit.quantity')}</div>
            <div style={valueStyle}>{post.quantity} {t('recruit.people')}</div>
          </div>
          <div style={{ background: CARD, padding: '16px 20px', borderLeft: `4px solid ${FANTA}` }}>
            <div style={labelStyle}>{t('recruit.deadline')}</div>
            <div style={valueStyle}>{post.expires_at ? fmtDate(post.expires_at) : t('recruit.noDeadline')}</div>
          </div>
        </div>

        {post.image_url && (
          <img
            src={resolveImg(post.image_url)}
            alt={title}
            style={{ width: '100%', height: 'auto', display: 'block', marginBottom: 40 }}
          />
        )}

        {excerpt && (
          <p style={{ fontSize: 18, lineHeight: 1.7, color: 'var(--prose)', borderLeft: `4px solid ${FANTA}`, paddingLeft: 20, marginBottom: 32, fontStyle: 'italic' }}>
            {excerpt}
          </p>
        )}

        {content && (
          <div
            style={{ fontSize: 16, lineHeight: 1.8, color: 'var(--prose)', marginBottom: 48 }}
            dangerouslySetInnerHTML={{ __html: normalizeProse(content) }}
          />
        )}

        {hasContact && (
          <section style={{ background: open ? FANTA : CARD, color: open ? ON_FANTA : INK, padding: '32px', marginTop: 16 }}>
            <div style={{ fontSize: 12, fontWeight: 700, letterSpacing: '0.18em', textTransform: 'uppercase', marginBottom: 12 }}>{t('recruit.contact')}</div>
            {post.contact_name && (
              <div style={{ fontFamily: 'Anton, sans-serif', fontSize: 28, letterSpacing: '0.02em', textTransform: 'uppercase', marginBottom: 16 }}>{post.contact_name}</div>
            )}
            <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
              {post.contact_phone && (
                <a
                  href={`tel:${post.contact_phone.replace(/\s+/g, '')}`}
                  style={{ background: open ? ON_FANTA : FANTA, color: open ? FANTA : ON_FANTA, padding: '14px 24px', textDecoration: 'none', fontFamily: 'Anton, sans-serif', fontSize: 16, letterSpacing: '0.06em', textTransform: 'uppercase' }}
                >
                  📞 {t('recruit.call')} · {post.contact_phone}
                </a>
              )}
              {post.contact_link && (
                <a
                  href={post.contact_link}
                  target="_blank"
                  rel="noreferrer"
                  style={{ background: 'transparent', color: 'inherit', border: `2px solid ${open ? ON_FANTA : FANTA}`, padding: '12px 24px', textDecoration: 'none', fontFamily: 'Anton, sans-serif', fontSize: 16, letterSpacing: '0.06em', textTransform: 'uppercase' }}
                >
                  💬 {t('recruit.message')}
                </a>
              )}
            </div>
          </section>
        )}
      </main>
      <Footer />
    </div>
  );
}
