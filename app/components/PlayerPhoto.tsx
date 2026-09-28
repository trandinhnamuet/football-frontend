'use client';

import { useEffect, useState } from 'react';
import { Player, FANTA } from '../lib/types';
import { DEFAULT_PLAYER_AVATAR_URL } from '../lib/assets';

const BASE = (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001').replace(/\/$/, '');

/**
 * Ảnh cầu thủ trên trang Đội hình: hiện trọn ảnh (contain) trên nền mờ, bấm
 * vào thì mở to toàn màn hình. Ảnh mặc định (chưa có ảnh thật) thì không mở.
 */
export default function PlayerPhoto({ p }: { p: Player }) {
  const src = p.zoom_image_url || p.image_url;
  const url = src ? `${BASE}${src}` : DEFAULT_PLAYER_AVATAR_URL;
  const name = `${p.first_name} ${p.last_name}`;
  const [open, setOpen] = useState(false);

  // Esc để đóng, khoá cuộn trang khi đang xem ảnh to.
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setOpen(false); };
    window.addEventListener('keydown', onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', onKey);
      document.body.style.overflow = prev;
    };
  }, [open]);

  return (
    <>
      <div
        onClick={src ? () => setOpen(true) : undefined}
        role={src ? 'button' : undefined}
        aria-label={src ? `Xem ảnh ${name}` : undefined}
        title={src ? 'Bấm để xem ảnh to' : undefined}
        style={{ position: 'relative', width: '100%', aspectRatio: '3/4', background: '#0a0a0a', overflow: 'hidden', cursor: src ? 'zoom-in' : 'default' }}
      >
        {src && (
          <div style={{ position: 'absolute', inset: 0, backgroundImage: `url(${url})`, backgroundSize: 'cover', backgroundPosition: 'center', filter: 'blur(22px)', transform: 'scale(1.15)' }} />
        )}
        <img
          src={url}
          alt={name}
          style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'contain', display: 'block' }}
        />
        {src && (
          <div style={{ position: 'absolute', right: 10, bottom: 10, background: 'rgba(0,0,0,0.55)', color: '#fff', fontSize: 14, lineHeight: 1, padding: '6px 8px', borderRadius: 2, pointerEvents: 'none' }}>⤢</div>
        )}
      </div>

      {open && (
        <div
          onClick={() => setOpen(false)}
          style={{
            position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.94)', zIndex: 1000,
            display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 16,
          }}
        >
          <div onClick={e => e.stopPropagation()} style={{ width: '100%', maxWidth: 960, display: 'flex', flexDirection: 'column', gap: 10, maxHeight: '100%' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12 }}>
              <div style={{ color: '#fff', fontFamily: 'Anton, sans-serif', fontSize: 20, letterSpacing: '0.04em', textTransform: 'uppercase' }}>
                <span style={{ color: FANTA }}>#{p.num}</span> {name}
              </div>
              <button
                onClick={() => setOpen(false)}
                aria-label="Đóng"
                style={{ background: 'none', border: '1px solid rgba(255,255,255,0.25)', color: '#fff', fontSize: 22, cursor: 'pointer', padding: '2px 12px', lineHeight: 1.3 }}
              >
                ×
              </button>
            </div>
            <img
              src={url}
              alt={name}
              style={{ width: '100%', maxHeight: 'calc(100vh - 110px)', objectFit: 'contain', display: 'block' }}
            />
          </div>
        </div>
      )}
    </>
  );
}
