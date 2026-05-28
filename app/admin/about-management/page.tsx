'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import AdminGuard from '../../components/AdminGuard';
import { FANTA } from '../../lib/types';
import { api } from '../../lib/api';

const BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
const CARD = 'var(--card)';
const INK = 'var(--ink)';
const MUTED = 'var(--muted)';
const KEY = 'lffc_admin_pw';

type AboutData = {
  id: number;
  banner_image_url: string;
  content_vi: string;
  content_en: string;
  updated_at: string;
};

export default function AboutManagementPage() {
  const [password, setPassword] = useState('');
  const [authed, setAuthed] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [bannerUrl, setBannerUrl] = useState('');
  const [contentVi, setContentVi] = useState('');
  const [contentEn, setContentEn] = useState('');
  const [uploading, setUploading] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const saved = localStorage.getItem(KEY);
    if (saved) {
      setPassword(saved);
      loadData(saved);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function loadData(pw: string) {
    setLoading(true);
    setError('');
    try {
      const data: AboutData = await api.getAboutPage();
      setBannerUrl(data.banner_image_url || '');
      setContentVi(data.content_vi || '');
      setContentEn(data.content_en || '');
      setAuthed(true);
      localStorage.setItem(KEY, pw);
    } catch {
      setError('Không thể tải dữ liệu. Kiểm tra mật khẩu?');
    } finally {
      setLoading(false);
    }
  }

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    await loadData(password);
  }

  async function handleUploadBanner(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    setError('');
    try {
      const { url } = await api.uploadAboutBanner(file, password);
      setBannerUrl(url);
      setSuccess('Tải ảnh banner thành công!');
      setTimeout(() => setSuccess(''), 3000);
    } catch {
      setError('Tải ảnh thất bại.');
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');
    try {
      await api.updateAboutPage({ banner_image_url: bannerUrl, content_vi: contentVi, content_en: contentEn }, password);
      setSuccess('Đã lưu thành công!');
      setTimeout(() => setSuccess(''), 3000);
    } catch {
      setError('Lưu thất bại.');
    } finally {
      setLoading(false);
    }
  }

  const inputStyle: React.CSSProperties = {
    background: 'var(--alt-bg)',
    border: '1px solid #333',
    color: INK,
    padding: '10px 14px',
    fontSize: 15,
    width: '100%',
    boxSizing: 'border-box',
  };

  const textareaStyle: React.CSSProperties = {
    ...inputStyle,
    minHeight: 220,
    resize: 'vertical',
    fontFamily: 'monospace',
  };

  const labelStyle: React.CSSProperties = {
    fontSize: 12,
    color: FANTA,
    letterSpacing: '0.15em',
    textTransform: 'uppercase',
    fontWeight: 700,
    display: 'block',
    marginBottom: 8,
  };

  if (!authed) {
    return (
      <AdminGuard>
        <div style={{ minHeight: '100vh', background: 'var(--bg)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <form onSubmit={handleLogin} style={{ background: CARD, padding: 40, width: '100%', maxWidth: 400 }}>
            <h2 style={{ fontFamily: 'Anton, sans-serif', fontSize: 28, textTransform: 'uppercase', marginBottom: 24, color: INK }}>
              ADMIN — TRANG GIỚI THIỆU
            </h2>
            {error && <p style={{ color: '#f55', fontSize: 14, marginBottom: 16 }}>{error}</p>}
            <label style={labelStyle}>Mật khẩu Admin</label>
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              style={inputStyle}
              autoFocus
            />
            <button type="submit" style={{ marginTop: 20, background: FANTA, color: '#0a0a0a', padding: '12px 28px', fontFamily: 'Anton, sans-serif', fontSize: 16, letterSpacing: '0.06em', textTransform: 'uppercase', border: 'none', cursor: 'pointer', width: '100%' }}>
              {loading ? 'Đang tải...' : 'Đăng nhập'}
            </button>
          </form>
        </div>
      </AdminGuard>
    );
  }

  return (
    <AdminGuard>
      <div style={{ minHeight: '100vh', background: 'var(--bg)', color: INK, padding: '40px 24px' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto' }}>
          {/* Header */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 32 }}>
            <div>
              <div style={{ fontSize: 12, color: FANTA, letterSpacing: '0.2em', textTransform: 'uppercase', fontWeight: 700, marginBottom: 4 }}>Admin</div>
              <h1 style={{ fontFamily: 'Anton, sans-serif', fontSize: 36, textTransform: 'uppercase', margin: 0 }}>Trang Giới Thiệu</h1>
            </div>
            <div style={{ display: 'flex', gap: 12 }}>
              <Link href="/about" target="_blank" style={{ color: FANTA, textDecoration: 'none', fontSize: 14, fontWeight: 700 }}>
                Xem trang →
              </Link>
              <Link href="/admin" style={{ color: MUTED, textDecoration: 'none', fontSize: 14 }}>
                ← Quay lại Admin
              </Link>
            </div>
          </div>

          {error && <p style={{ color: '#f55', fontSize: 14, marginBottom: 16 }}>{error}</p>}
          {success && <p style={{ color: '#4f4', fontSize: 14, marginBottom: 16 }}>{success}</p>}

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 32 }}>
            {/* Left: Form */}
            <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
              {/* Banner image */}
              <div style={{ background: CARD, padding: 24 }}>
                <label style={labelStyle}>Ảnh Banner</label>
                <div style={{ marginBottom: 12 }}>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleUploadBanner}
                    style={{ display: 'none' }}
                    id="banner-file"
                  />
                  <label htmlFor="banner-file" style={{ display: 'inline-block', background: '#222', color: INK, padding: '10px 20px', cursor: 'pointer', fontSize: 14, letterSpacing: '0.05em' }}>
                    {uploading ? 'Đang tải lên...' : 'Chọn ảnh banner'}
                  </label>
                </div>
                <label style={{ ...labelStyle, color: MUTED }}>URL hiện tại</label>
                <input
                  type="text"
                  value={bannerUrl}
                  onChange={e => setBannerUrl(e.target.value)}
                  style={inputStyle}
                  placeholder="/uploads/about/..."
                />
              </div>

              {/* Content VI */}
              <div style={{ background: CARD, padding: 24 }}>
                <label style={labelStyle}>Nội dung (Tiếng Việt) — HTML</label>
                <textarea
                  value={contentVi}
                  onChange={e => setContentVi(e.target.value)}
                  style={textareaStyle}
                  placeholder="<p>Nội dung bằng tiếng Việt...</p>"
                />
              </div>

              {/* Content EN */}
              <div style={{ background: CARD, padding: 24 }}>
                <label style={labelStyle}>Nội dung (English) — HTML</label>
                <textarea
                  value={contentEn}
                  onChange={e => setContentEn(e.target.value)}
                  style={textareaStyle}
                  placeholder="<p>Content in English...</p>"
                />
              </div>

              <button type="submit" disabled={loading} style={{ background: FANTA, color: '#0a0a0a', padding: '14px 32px', fontFamily: 'Anton, sans-serif', fontSize: 18, letterSpacing: '0.06em', textTransform: 'uppercase', border: 'none', cursor: loading ? 'not-allowed' : 'pointer' }}>
                {loading ? 'Đang lưu...' : 'Lưu'}
              </button>
            </form>

            {/* Right: Preview */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
              <div style={{ background: CARD, padding: 24 }}>
                <div style={{ fontSize: 12, color: FANTA, letterSpacing: '0.15em', textTransform: 'uppercase', fontWeight: 700, marginBottom: 16 }}>Xem trước banner</div>
                {bannerUrl ? (
                  <div style={{ position: 'relative', width: '100%', aspectRatio: '16/9', overflow: 'hidden' }}>
                    <img
                      src={bannerUrl.startsWith('/uploads') ? `${BASE}${bannerUrl}` : bannerUrl}
                      alt="Banner preview"
                      style={{ width: '100%', height: '100%', objectFit: 'cover', filter: 'blur(4px) brightness(0.4)', transform: 'scale(1.06)' }}
                    />
                    <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <span style={{ fontFamily: 'Anton, sans-serif', fontSize: 32, color: '#fff', textTransform: 'uppercase', letterSpacing: '0.02em' }}>Lon Fanta FC</span>
                    </div>
                  </div>
                ) : (
                  <div style={{ width: '100%', aspectRatio: '16/9', background: '#111', display: 'flex', alignItems: 'center', justifyContent: 'center', color: MUTED, fontSize: 14 }}>
                    Chưa có ảnh
                  </div>
                )}
              </div>

              <div style={{ background: CARD, padding: 24 }}>
                <div style={{ fontSize: 12, color: FANTA, letterSpacing: '0.15em', textTransform: 'uppercase', fontWeight: 700, marginBottom: 16 }}>Xem trước nội dung (VI)</div>
                {contentVi ? (
                  <div dangerouslySetInnerHTML={{ __html: contentVi }} style={{ fontSize: 15, lineHeight: 1.7, color: MUTED }} />
                ) : (
                  <p style={{ color: MUTED, fontSize: 14 }}>Chưa có nội dung</p>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </AdminGuard>
  );
}
