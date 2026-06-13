'use client';

import { useEffect, useState, useRef } from 'react';
import Link from 'next/link';
import AdminGuard from '../../components/AdminGuard';
import { BannerSlide, FANTA } from '../../lib/types';
import { api } from '../../lib/api';

const BASE = (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001').replace(/\/$/, '');
const CARD = 'var(--card)';
const INK = 'var(--ink)';
const MUTED = 'var(--muted)';
const KEY = 'lffc_admin_pw';

function resolveSrc(url: string): string {
  if (!url) return '';
  return url.startsWith('/uploads') ? `${BASE}${url}` : url;
}

function getPassword() {
  return typeof window !== 'undefined' ? (localStorage.getItem(KEY) || '') : '';
}

function SlideCard({ slide, onChange, onDelete, onSave, busy }: {
  slide: BannerSlide;
  onChange: (patch: Partial<BannerSlide>) => void;
  onDelete: () => void;
  onSave: () => void;
  busy: boolean;
}) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const { url } = await api.uploadBannerImage(file, getPassword());
      onChange({ image_url: url });
    } catch { /* ignore */ }
    finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = '';
    }
  }

  const inputStyle: React.CSSProperties = {
    width: '100%', background: 'var(--alt-bg)', border: '1px solid #333',
    color: INK, padding: '9px 12px', fontSize: 14, boxSizing: 'border-box',
  };
  const labelStyle: React.CSSProperties = {
    fontSize: 10, color: MUTED, letterSpacing: '0.12em', textTransform: 'uppercase',
    fontWeight: 700, display: 'block', marginBottom: 5,
  };

  return (
    <div style={{ background: CARD, border: `1px solid ${slide.is_active ? FANTA + '55' : 'rgba(255,255,255,0.08)'}`, display: 'grid', gridTemplateColumns: '260px 1fr', gap: 20, padding: 18 }}>
      {/* Image */}
      <div>
        <div style={{ width: '100%', aspectRatio: '16/9', background: '#111', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          {slide.image_url
            ? <img src={resolveSrc(slide.image_url)} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            : <span style={{ color: MUTED, fontSize: 13 }}>Chưa có ảnh</span>}
        </div>
        <input ref={fileRef} type="file" accept="image/*" onChange={handleUpload} style={{ display: 'none' }} id={`f-${slide.id}`} />
        <label htmlFor={`f-${slide.id}`} style={{ display: 'block', textAlign: 'center', marginTop: 8, background: '#222', color: INK, padding: '8px', cursor: 'pointer', fontSize: 13 }}>
          {uploading ? 'Đang tải...' : (slide.image_url ? 'Đổi ảnh' : 'Tải ảnh lên')}
        </label>
      </div>

      {/* Fields */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <div>
            <label style={labelStyle}>Chú thích (VI)</label>
            <input style={inputStyle} value={slide.caption} onChange={e => onChange({ caption: e.target.value })} placeholder="VD: Man of the week" />
          </div>
          <div>
            <label style={labelStyle}>Caption (EN)</label>
            <input style={inputStyle} value={slide.caption_en} onChange={e => onChange({ caption_en: e.target.value })} placeholder="e.g. Man of the week" />
          </div>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 12 }}>
          <div>
            <label style={labelStyle}>Link khi bấm (tuỳ chọn)</label>
            <input style={inputStyle} value={slide.link_url} onChange={e => onChange({ link_url: e.target.value })} placeholder="https://..." />
          </div>
          <div>
            <label style={labelStyle}>Thứ tự</label>
            <input style={inputStyle} type="number" value={slide.sort_order} onChange={e => onChange({ sort_order: +e.target.value })} />
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 'auto' }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', fontSize: 13 }}>
            <input type="checkbox" checked={slide.is_active} onChange={e => onChange({ is_active: e.target.checked })} style={{ width: 16, height: 16, accentColor: FANTA }} />
            Hiển thị công khai
          </label>
          <div style={{ display: 'flex', gap: 8 }}>
            <button onClick={onSave} disabled={busy} style={{ background: FANTA, color: '#0a0a0a', border: 'none', padding: '7px 18px', fontFamily: 'Anton, sans-serif', fontSize: 12, letterSpacing: '0.06em', textTransform: 'uppercase', cursor: 'pointer' }}>
              Lưu
            </button>
            <button onClick={onDelete} disabled={busy} style={{ background: 'rgba(204,68,68,0.12)', color: '#cc4444', border: '1px solid rgba(204,68,68,0.3)', padding: '7px 14px', fontFamily: 'Anton, sans-serif', fontSize: 12, letterSpacing: '0.06em', textTransform: 'uppercase', cursor: 'pointer' }}>
              Xóa
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function BannerSlidesContent() {
  const [slides, setSlides] = useState<BannerSlide[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState('');

  useEffect(() => { load(); }, []);

  async function load() {
    setLoading(true);
    try { setSlides(await api.getBannerSlidesAdmin()); } catch { }
    finally { setLoading(false); }
  }

  function flash(m: string) { setMsg(m); setTimeout(() => setMsg(''), 3000); }

  // Local edit then save individual slide
  function patchLocal(id: number, patch: Partial<BannerSlide>) {
    setSlides(s => s.map(x => x.id === id ? { ...x, ...patch } : x));
  }

  async function saveSlide(slide: BannerSlide) {
    setBusy(true);
    try {
      await api.updateBannerSlide(slide.id, {
        image_url: slide.image_url, caption: slide.caption, caption_en: slide.caption_en,
        link_url: slide.link_url, sort_order: slide.sort_order, is_active: slide.is_active,
      }, getPassword());
      flash('✓ Đã lưu');
    } catch (e: any) { flash('Lỗi: ' + e.message); }
    finally { setBusy(false); }
  }

  async function saveAll() {
    setBusy(true);
    try {
      for (const s of slides) {
        await api.updateBannerSlide(s.id, {
          image_url: s.image_url, caption: s.caption, caption_en: s.caption_en,
          link_url: s.link_url, sort_order: s.sort_order, is_active: s.is_active,
        }, getPassword());
      }
      flash('✓ Đã lưu tất cả thay đổi');
      await load();
    } catch (e: any) { flash('Lỗi: ' + e.message); }
    finally { setBusy(false); }
  }

  async function addSlide() {
    setBusy(true);
    try {
      const created = await api.createBannerSlide({ caption: '', caption_en: '', image_url: '', is_active: true }, getPassword());
      setSlides(s => [created, ...s]);
      flash('✓ Đã thêm ảnh mới — hãy tải ảnh lên');
    } catch (e: any) { flash('Lỗi: ' + e.message); }
    finally { setBusy(false); }
  }

  async function removeSlide(id: number) {
    if (!confirm('Xác nhận xóa ảnh banner này?')) return;
    setBusy(true);
    try {
      await api.deleteBannerSlide(id, getPassword());
      setSlides(s => s.filter(x => x.id !== id));
      flash('✓ Đã xóa');
    } catch (e: any) { flash('Lỗi: ' + e.message); }
    finally { setBusy(false); }
  }

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)', color: INK, fontFamily: '"Space Grotesk", system-ui, sans-serif' }}>
      <header style={{ padding: '40px 48px 24px', borderBottom: `1px solid ${FANTA}33` }}>
        <div style={{ marginBottom: 16 }}>
          <Link href="/admin" style={{ color: FANTA, fontSize: 13, letterSpacing: '0.1em', textTransform: 'uppercase', textDecoration: 'none', fontWeight: 700 }}>
            ← Quay lại Admin
          </Link>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'wrap', gap: 16 }}>
          <div>
            <div style={{ fontSize: 12, color: FANTA, letterSpacing: '0.2em', fontWeight: 700, textTransform: 'uppercase', marginBottom: 8 }}>Quản trị Banner</div>
            <h1 style={{ fontFamily: 'Anton, sans-serif', fontSize: 'clamp(36px, 5vw, 60px)', lineHeight: 0.92, textTransform: 'uppercase', margin: 0 }}>
              BANNER <span style={{ color: FANTA }}>ẢNH CHẠY</span>
            </h1>
            <p style={{ color: MUTED, fontSize: 14, marginTop: 8 }}>Thêm / sửa / xóa ảnh hiển thị dưới header trang chủ (Man of the week, khoảnh khắc...)</p>
          </div>
          <div style={{ display: 'flex', gap: 10 }}>
            <button onClick={addSlide} disabled={busy} style={{ background: 'rgba(255,107,26,0.12)', color: FANTA, border: `1px solid ${FANTA}66`, padding: '12px 22px', fontFamily: 'Anton, sans-serif', fontSize: 15, letterSpacing: '0.04em', textTransform: 'uppercase', cursor: 'pointer' }}>
              + Thêm ảnh
            </button>
            <button onClick={saveAll} disabled={busy} style={{ background: FANTA, color: '#0a0a0a', border: 'none', padding: '12px 26px', fontFamily: 'Anton, sans-serif', fontSize: 15, letterSpacing: '0.04em', textTransform: 'uppercase', cursor: 'pointer' }}>
              Lưu tất cả
            </button>
          </div>
        </div>
      </header>

      <main style={{ padding: '32px 48px 80px' }}>
        {msg && (
          <div style={{ marginBottom: 20, padding: '12px 20px', background: msg.startsWith('✓') ? 'rgba(31,138,91,0.15)' : 'rgba(255,50,50,0.1)', border: `1px solid ${msg.startsWith('✓') ? '#1f8a5b' : '#cc4444'}44`, fontSize: 14 }}>
            {msg}
          </div>
        )}

        {loading ? (
          <div style={{ textAlign: 'center', padding: 60, color: MUTED, fontFamily: 'Anton, sans-serif', fontSize: 24 }}>Đang tải...</div>
        ) : slides.length === 0 ? (
          <div style={{ padding: 60, textAlign: 'center', color: MUTED, background: CARD, fontFamily: 'Anton, sans-serif', fontSize: 20 }}>
            Chưa có ảnh banner. Bấm "+ Thêm ảnh" để bắt đầu.
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {slides.map(s => (
              <SlideCard
                key={s.id}
                slide={s}
                busy={busy}
                onChange={patch => patchLocal(s.id, patch)}
                onSave={() => saveSlide(s)}
                onDelete={() => removeSlide(s.id)}
              />
            ))}
          </div>
        )}
      </main>
    </div>
  );
}

export default function BannerSlidesPage() {
  return <AdminGuard><BannerSlidesContent /></AdminGuard>;
}
