'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import AdminGuard from '../../components/AdminGuard';
import { FANTA } from '../../lib/types';
import { api } from '../../lib/api';

const BLACK = 'var(--bg)';
const CARD = 'var(--card)';
const INK = 'var(--ink)';
const MUTED = 'var(--muted)';
const KEY = 'lffc_admin_pw';

function toYoutubeEmbed(url: string): string {
  if (!url) return '';
  if (url.includes('youtube.com/embed/')) return url;
  const shortMatch = url.match(/youtu\.be\/([A-Za-z0-9_-]{11})/);
  if (shortMatch) return `https://www.youtube.com/embed/${shortMatch[1]}`;
  const watchMatch = url.match(/[?&]v=([A-Za-z0-9_-]{11})/);
  if (watchMatch) return `https://www.youtube.com/embed/${watchMatch[1]}`;
  return url;
}

export default function VideoHighlightAdminPage() {
  const [password, setPassword] = useState('');
  const [authed, setAuthed] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [youtubeUrl, setYoutubeUrl] = useState('');
  const [title, setTitle] = useState('');
  const [titleEn, setTitleEn] = useState('');
  const [isActive, setIsActive] = useState(true);
  const [channelUrl, setChannelUrl] = useState('');

  const [previewEmbed, setPreviewEmbed] = useState('');

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
      const data = await api.getVideoHighlight();
      setYoutubeUrl(data.youtube_url || '');
      setTitle(data.title || '');
      setTitleEn(data.title_en || '');
      setIsActive(data.is_active ?? true);
      setChannelUrl(data.channel_url || 'https://www.youtube.com/@fclonfanta');
      setPreviewEmbed(toYoutubeEmbed(data.youtube_url || ''));
      setAuthed(true);
      localStorage.setItem(KEY, pw);
    } catch (e: any) {
      setError('Sai mật khẩu hoặc lỗi kết nối');
      setAuthed(false);
    } finally {
      setLoading(false);
    }
  }

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    await loadData(password);
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');
    try {
      await api.updateVideoHighlight(
        { youtube_url: youtubeUrl, title, title_en: titleEn, is_active: isActive, channel_url: channelUrl },
        password,
      );
      setPreviewEmbed(toYoutubeEmbed(youtubeUrl));
      setSuccess('Đã lưu thành công!');
    } catch (e: any) {
      setError(e.message || 'Lỗi lưu dữ liệu');
    } finally {
      setLoading(false);
    }
  }

  const inputStyle: React.CSSProperties = {
    width: '100%',
    background: 'var(--alt-bg)',
    border: `1px solid ${FANTA}44`,
    color: INK,
    padding: '12px 16px',
    fontFamily: '"Space Grotesk", system-ui, sans-serif',
    fontSize: 15,
    outline: 'none',
    boxSizing: 'border-box',
  };

  const labelStyle: React.CSSProperties = {
    fontSize: 11,
    color: FANTA,
    letterSpacing: '0.15em',
    textTransform: 'uppercase' as const,
    fontWeight: 700,
    display: 'block',
    marginBottom: 8,
  };

  return (
    <AdminGuard>
      <div style={{ background: BLACK, color: INK, fontFamily: '"Space Grotesk", system-ui, sans-serif', minHeight: '100vh' }}>
        <header style={{ padding: '48px 48px 0', borderBottom: `1px solid ${FANTA}33` }}>
          <div style={{ marginBottom: 24 }}>
            <Link href="/admin" style={{ color: FANTA, fontSize: 13, letterSpacing: '0.1em', textTransform: 'uppercase', textDecoration: 'none', fontWeight: 700 }}>
              ← Quay lại Admin
            </Link>
          </div>
          <h1 style={{ fontFamily: 'Anton, sans-serif', fontSize: 'clamp(40px, 6vw, 80px)', lineHeight: 0.92, letterSpacing: '0.01em', textTransform: 'uppercase', margin: '0 0 24px' }}>
            VIDEO <span style={{ color: FANTA }}>HIGHLIGHT</span>
          </h1>
        </header>

        <main style={{ padding: '48px' }}>
          {!authed ? (
            <form onSubmit={handleLogin} style={{ maxWidth: 400 }}>
              <label style={labelStyle}>Mật khẩu Admin</label>
              <input
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="Nhập mật khẩu..."
                style={inputStyle}
                required
              />
              {error && <div style={{ color: '#e05252', fontSize: 13, marginTop: 8 }}>{error}</div>}
              <button
                type="submit"
                disabled={loading}
                style={{ marginTop: 16, background: FANTA, color: '#0a0a0a', border: 'none', padding: '14px 32px', fontFamily: 'Anton, sans-serif', fontSize: 16, letterSpacing: '0.06em', textTransform: 'uppercase', cursor: 'pointer' }}
              >
                {loading ? 'Đang tải...' : 'Đăng nhập'}
              </button>
            </form>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 40, alignItems: 'start' }}>
              {/* Form */}
              <div>
                <form onSubmit={handleSave} style={{ background: CARD, padding: 32, border: `2px solid ${FANTA}44` }}>
                  <h2 style={{ fontFamily: 'Anton, sans-serif', fontSize: 28, textTransform: 'uppercase', letterSpacing: '0.02em', margin: '0 0 28px', color: FANTA }}>
                    Cài đặt Video
                  </h2>

                  <div style={{ marginBottom: 20 }}>
                    <label style={labelStyle}>YouTube URL</label>
                    <input
                      type="url"
                      value={youtubeUrl}
                      onChange={e => setYoutubeUrl(e.target.value)}
                      placeholder="https://www.youtube.com/watch?v=..."
                      style={inputStyle}
                    />
                    <div style={{ fontSize: 12, color: MUTED, marginTop: 6 }}>
                      Hỗ trợ: youtube.com/watch?v=... hoặc youtu.be/...
                    </div>
                  </div>

                  <div style={{ marginBottom: 20 }}>
                    <label style={labelStyle}>Kênh YouTube (video đề xuất)</label>
                    <input
                      type="url"
                      value={channelUrl}
                      onChange={e => setChannelUrl(e.target.value)}
                      placeholder="https://www.youtube.com/@fclonfanta"
                      style={inputStyle}
                    />
                    <div style={{ fontSize: 12, color: MUTED, marginTop: 6 }}>
                      Danh sách video mới nhất từ kênh này sẽ hiện ở cột "Video đề xuất" trên trang chủ.
                    </div>
                  </div>

                  <div style={{ marginBottom: 20 }}>
                    <label style={labelStyle}>Tiêu đề (Tiếng Việt)</label>
                    <input
                      type="text"
                      value={title}
                      onChange={e => setTitle(e.target.value)}
                      placeholder="VD: Highlight trận đấu tuần 10"
                      style={inputStyle}
                    />
                  </div>

                  <div style={{ marginBottom: 20 }}>
                    <label style={labelStyle}>Tiêu đề (Tiếng Anh)</label>
                    <input
                      type="text"
                      value={titleEn}
                      onChange={e => setTitleEn(e.target.value)}
                      placeholder="e.g. Match Highlight Week 10"
                      style={inputStyle}
                    />
                  </div>

                  <div style={{ marginBottom: 28, display: 'flex', alignItems: 'center', gap: 12 }}>
                    <input
                      type="checkbox"
                      id="is_active"
                      checked={isActive}
                      onChange={e => setIsActive(e.target.checked)}
                      style={{ width: 18, height: 18, accentColor: FANTA, cursor: 'pointer' }}
                    />
                    <label htmlFor="is_active" style={{ fontSize: 14, cursor: 'pointer', userSelect: 'none' }}>
                      Hiển thị trên trang chủ
                    </label>
                  </div>

                  {error && <div style={{ color: '#e05252', fontSize: 13, marginBottom: 12 }}>{error}</div>}
                  {success && <div style={{ color: '#4caf50', fontSize: 13, marginBottom: 12 }}>{success}</div>}

                  <button
                    type="submit"
                    disabled={loading}
                    style={{ background: FANTA, color: '#0a0a0a', border: 'none', padding: '16px 40px', fontFamily: 'Anton, sans-serif', fontSize: 18, letterSpacing: '0.06em', textTransform: 'uppercase', cursor: 'pointer', width: '100%' }}
                  >
                    {loading ? 'Đang lưu...' : 'Lưu thay đổi'}
                  </button>
                </form>
              </div>

              {/* Preview */}
              <div>
                <div style={{ fontSize: 11, color: FANTA, letterSpacing: '0.15em', fontWeight: 700, textTransform: 'uppercase', marginBottom: 16 }}>
                  Xem trước
                </div>
                {previewEmbed ? (
                  <div style={{ position: 'relative', width: '100%', aspectRatio: '16/9', background: '#0a0a0a', borderLeft: `4px solid ${FANTA}` }}>
                    <iframe
                      src={previewEmbed}
                      title="Preview"
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      allowFullScreen
                      style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', border: 'none' }}
                    />
                  </div>
                ) : (
                  <div style={{ background: CARD, aspectRatio: '16/9', display: 'flex', alignItems: 'center', justifyContent: 'center', color: MUTED, fontSize: 14, borderLeft: `4px solid ${FANTA}44` }}>
                    Chưa có video. Nhập URL YouTube và lưu để xem trước.
                  </div>
                )}
                {(title || titleEn) && (
                  <div style={{ marginTop: 16, fontFamily: 'Anton, sans-serif', fontSize: 20, textTransform: 'uppercase', letterSpacing: '0.02em' }}>
                    {title || titleEn}
                  </div>
                )}
                <div style={{ marginTop: 12, fontSize: 12, color: MUTED }}>
                  Trạng thái: <span style={{ color: isActive ? '#4caf50' : '#e05252', fontWeight: 700 }}>{isActive ? 'Hiển thị' : 'Ẩn'}</span>
                </div>
              </div>
            </div>
          )}
        </main>
      </div>
    </AdminGuard>
  );
}
