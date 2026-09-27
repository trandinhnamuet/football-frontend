'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useApp } from '../contexts/AppContext';
import { api } from '../lib/api';
import { RecruitmentPost, FANTA, recruitIsOpen, recruitPositionLabel } from '../lib/types';

// Text sitting on a FANTA-orange fill stays dark in both themes — light text on
// orange fails contrast.
const ON_FANTA = '#0a0a0a';

/**
 * Dải thông báo tuyển quân trên trang chủ. Chỉ render khi có ít nhất một tin
 * đang mở — không có tin thì biến mất hoàn toàn, không chiếm chỗ.
 */
export default function RecruitmentBanner() {
  const { lang, t } = useApp();
  const [posts, setPosts] = useState<RecruitmentPost[]>([]);

  useEffect(() => {
    api.getRecruitmentPosts()
      .then(all => setPosts(all.filter(recruitIsOpen)))
      .catch(() => {});
  }, []);

  if (posts.length === 0) return null;

  const title = (p: RecruitmentPost) => (lang === 'en' && p.title_en) ? p.title_en : p.title;

  return (
    <section
      className="mob-p-section"
      style={{
        padding: '22px 48px',
        background: FANTA,
        color: ON_FANTA,
        borderTop: '1px solid rgba(0,0,0,0.15)',
        borderBottom: '1px solid rgba(0,0,0,0.15)',
      }}
    >
      <div className="mob-stack mob-align-start" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 20, flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
          <div style={{ fontFamily: 'Anton, sans-serif', fontSize: 22, letterSpacing: '0.06em', textTransform: 'uppercase', whiteSpace: 'nowrap' }}>
            📣 {t('recruit.homeStrip')}
          </div>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {posts.slice(0, 4).map(p => (
              <Link
                key={p.id}
                href={`/recruitment/${p.slug || p.id}`}
                style={{
                  background: ON_FANTA, color: FANTA, textDecoration: 'none',
                  padding: '6px 12px', fontSize: 12, fontWeight: 700,
                  letterSpacing: '0.08em', textTransform: 'uppercase',
                }}
              >
                {recruitPositionLabel(p.position, lang)}
                {p.quantity > 1 ? ` ×${p.quantity}` : ''}
                <span style={{ opacity: 0.7, fontWeight: 600 }}> · {title(p)}</span>
              </Link>
            ))}
            {posts.length > 4 && (
              <span style={{ fontSize: 12, fontWeight: 700, alignSelf: 'center' }}>+{posts.length - 4}</span>
            )}
          </div>
        </div>
        <Link
          href="/recruitment"
          style={{
            color: ON_FANTA, textDecoration: 'none', fontFamily: 'Anton, sans-serif',
            fontSize: 16, letterSpacing: '0.06em', textTransform: 'uppercase',
            borderBottom: `2px solid ${ON_FANTA}`, whiteSpace: 'nowrap',
          }}
        >
          {t('recruit.homeCta')}
        </Link>
      </div>
    </section>
  );
}
