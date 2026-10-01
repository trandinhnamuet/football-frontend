'use client';

import { useEffect, useState, useRef } from 'react';
import Link from 'next/link';
import AdminGuard from '../../components/AdminGuard';
import { Announcement, FANTA } from '../../lib/types';
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

function SlideCard({ slide, onChange, onDelete, onSave, onMoveUp, onMoveDown, isFirst, isLast, busy }: {
  slide: Announcement;
  onChange: (patch: Partial<Announcement>) => void;
  onDelete: () => void;
  onSave: () => void;
  onMoveUp: () => void;
  onMoveDown: () => void;
  isFirst: boolean;
  isLast: boolean;
  busy: boolean;
}) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const { url } = await api.uploadAnnouncementImage(file, getPassword());
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
    <div style={{ background: CARD, border: `1px solid ${slide.is_active ? FANTA + '55' : 'var(--line)'}`, display: 'grid', gridTemplateColumns: '260px 1fr', gap: 20, padding: 18 }}>
      {/* Image */}
      <div>
        <div style={{ width: '100%', aspectRatio: '4/3', background: '#111', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          {slide.image_url
            ? <img src={resolveSrc(slide.image_url)} alt="" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
            : <span style={{ color: MUTED, fontSize: 13 }}>Chưa có ảnh</span>}
        </div>
        <input ref={fileRef} type="file" accept="image/*" onChange={handleUpload} style={{ display: 'none' }} id={`f-${slide.id}`} />
        <label htmlFor={`f-${slide.id}`} style={{ display: 'block', textAlign: 'center', marginTop: 8, background: '#222', color: INK, padding: '8px', cursor: 'pointer', fontSize: 13 }}>
          {uploading ? 'Đang tải...' : (slide.image_url ? 'Đổi ảnh' : 'Tải ảnh lên')}
        </label>
        {/* Reorder controls */}
        <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
          <button onClick={onMoveUp} disabled={busy || isFirst} title="Di chuyển lên"
            style={{ flex: 1, background: isFirst ? 'var(--hover-bg)' : 'rgba(255,107,26,0.12)', color: isFirst ? MUTED : FANTA, border: `1px solid ${isFirst ? 'var(--line)' : FANTA + '55'}`, padding: '7px', cursor: isFirst ? 'default' : 'pointer', fontFamily: 'Anton, sans-serif', fontSize: 14, opacity: isFirst ? 0.5 : 1 }}>
            ↑ Lên
          </button>
          <button onClick={onMoveDown} disabled={busy || isLast} title="Di chuyển xuống"
            style={{ flex: 1, background: isLast ? 'var(--hover-bg)' : 'rgba(255,107,26,0.12)', color: isLast ? MUTED : FANTA, border: `1px solid ${isLast ? 'var(--line)' : FANTA + '55'}`, padding: '7px', cursor: isLast ? 'default' : 'pointer', fontFamily: 'Anton, sans-serif', fontSize: 14, opacity: isLast ? 0.5 : 1 }}>
            ↓ Xuống
          </button>
        </div>
      </div>

      {/* Fields */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        <div>
          <label style={labelStyle}>Nội dung (VI)</label>
          <textarea style={{ ...inputStyle, minHeight: 90, resize: 'vertical', fontFamily: 'inherit' }} value={slide.text} onChange={e => onChange({ text: e.target.value })} placeholder="VD: Tối thứ 3 nghỉ đá do sân bảo trì, hẹn anh em tuần sau!" />
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '3fr 1fr', gap: 12 }}>
          <div>
            <label style={labelStyle}>Content (EN, tuỳ chọn)</label>
            <textarea style={{ ...inputStyle, minHeight: 60, resize: 'vertical', fontFamily: 'inherit' }} value={slide.text_en} onChange={e => onChange({ text_en: e.target.value })} placeholder="English version" />
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

function AnnouncementsContent() {
  const [slides, setSlides] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState('');

  useEffect(() => { load(); }, []);

  async function load() {
    setLoading(true);
    try { setSlides(await api.getAnnouncementsAdmin()); } catch { }
    finally { setLoading(false); }
  }

  function flash(m: string) { setMsg(m); setTimeout(() => setMsg(''), 3000); }

  // Local edit then save individual slide
  function patchLocal(id: number, patch: Partial<Announcement>) {
    setSlides(s => s.map(x => x.id === id ? { ...x, ...patch } : x));
  }

  async function saveSlide(slide: Announcement) {
    setBusy(true);
    try {
      await api.updateAnnouncement(slide.id, {
        image_url: slide.image_url, text: slide.text, text_en: slide.text_en,
        sort_order: slide.sort_order, is_active: slide.is_active,
      }, getPassword());
      flash('✓ Đã lưu');
    } catch (e: any) { flash('Lỗi: ' + e.message); }
    finally { setBusy(false); }
  }

  async function saveAll() {
    setBusy(true);
    try {
      for (const s of slides) {
        await api.updateAnnouncement(s.id, {
          image_url: s.image_url, text: s.text, text_en: s.text_en,
          sort_order: s.sort_order, is_active: s.is_active,
        }, getPassword());
      }
      flash('✓ Đã lưu tất cả thay đổi');
      await load();
    } catch (e: any) { flash('Lỗi: ' + e.message); }
    finally { setBusy(false); }
  }

  // Move a slide up/down: swap array order, normalize sort_order, persist all
  async function moveSlide(index: number, dir: 'up' | 'down') {
    const target = dir === 'up' ? index - 1 : index + 1;
    if (target < 0 || target >= slides.length) return;

    const reordered = [...slides];
    [reordered[index], reordered[target]] = [reordered[target], reordered[index]];
    // Normalize sort_order to match the new array positions
    const normalized = reordered.map((s, i) => ({ ...s, sort_order: i }));
    setSlides(normalized);

    setBusy(true);
    try {
      const pw = getPassword();
      await Promise.all(
        normalized.map(s => api.updateAnnouncement(s.id, { sort_order: s.sort_order }, pw)),
      );
      flash('✓ Đã đổi thứ tự');
    } catch (e: any) { flash('Lỗi: ' + e.message); await load(); }
    finally { setBusy(false); }
  }

  async function addSlide() {
    setBusy(true);
    try {
      const created = await api.createAnnouncement({ text: '', text_en: '', image_url: '', is_active: true }, getPassword());
      setSlides(s => [created, ...s]);
      flash('✓ Đã thêm thông báo mới — tải ảnh và nhập nội dung rồi bấm Lưu');
    } catch (e: any) { flash('Lỗi: ' + e.message); }
    finally { setBusy(false); }
  }

  async function removeSlide(id: number) {
    if (!confirm('Xác nhận xóa thông báo này?')) return;
    setBusy(true);
    try {
      await api.deleteAnnouncement(id, getPassword());
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
            <div style={{ fontSize: 12, color: FANTA, letterSpacing: '0.2em', fontWeight: 700, textTransform: 'uppercase', marginBottom: 16 }}>Quản trị Thông báo</div>
            <h1 style={{ fontFamily: 'Anton, sans-serif', fontSize: 'clamp(36px, 5vw, 60px)', lineHeight: 0.92, textTransform: 'uppercase', margin: 0 }}>
              THÔNG <span style={{ color: FANTA }}>BÁO</span>
            </h1>
            <p style={{ color: MUTED, fontSize: 14, marginTop: 18 }}>Thông báo ngắn (ảnh + đoạn text) hiện ngay dưới banner trang chủ, kéo ngang để xem. Không có trang chi tiết.</p>
          </div>
          <div style={{ display: 'flex', gap: 10 }}>
            <button onClick={addSlide} disabled={busy} style={{ background: 'rgba(255,107,26,0.12)', color: FANTA, border: `1px solid ${FANTA}66`, padding: '12px 22px', fontFamily: 'Anton, sans-serif', fontSize: 15, letterSpacing: '0.04em', textTransform: 'uppercase', cursor: 'pointer' }}>
              + Thêm thông báo
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
            Chưa có thông báo. Bấm "+ Thêm thông báo" để bắt đầu.
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {slides.map((s, i) => (
              <SlideCard
                key={s.id}
                slide={s}
                busy={busy}
                isFirst={i === 0}
                isLast={i === slides.length - 1}
                onChange={patch => patchLocal(s.id, patch)}
                onSave={() => saveSlide(s)}
                onDelete={() => removeSlide(s.id)}
                onMoveUp={() => moveSlide(i, 'up')}
                onMoveDown={() => moveSlide(i, 'down')}
              />
            ))}
          </div>
        )}
      </main>
    </div>
  );
}

export default function AnnouncementsAdminPage() {
  return <AdminGuard><AnnouncementsContent /></AdminGuard>;
}
