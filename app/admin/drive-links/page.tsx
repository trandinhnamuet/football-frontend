'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import AdminGuard from '../../components/AdminGuard';
import { FANTA } from '../../lib/types';
import { api } from '../../lib/api';
import type { DriveLink } from '../../lib/types';

const BLACK = 'var(--bg)';
const CARD = 'var(--card)';
const INK = 'var(--ink)';
const MUTED = 'var(--muted)';
const LINE = 'var(--line)';

const EMPTY_FORM = { title: '', url: '', description: '', is_public: true, sort_order: 0 };
const KEY = 'lffc_admin_pw';

export default function DriveLinksAdminPage() {
  const [links, setLinks] = useState<DriveLink[]>([]);
  const [password, setPassword] = useState('');
  const [authed, setAuthed] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [form, setForm] = useState({ ...EMPTY_FORM });
  const [editId, setEditId] = useState<number | null>(null);
  const [showForm, setShowForm] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem(KEY);
    if (saved) {
      setPassword(saved);
      loadLinks(saved);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function loadLinks(pw: string) {
    setLoading(true);
    setError('');
    try {
      const data = await api.getDriveLinksAdmin(pw);
      setLinks(data);
      setAuthed(true);
    } catch (e: any) {
      setError('Sai mật khẩu hoặc lỗi kết nối');
      setAuthed(false);
    } finally {
      setLoading(false);
    }
  }

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    await loadLinks(password);
  }

  function openAdd() {
    setForm({ ...EMPTY_FORM });
    setEditId(null);
    setShowForm(true);
  }

  function openEdit(link: DriveLink) {
    setForm({
      title: link.title,
      url: link.url,
      description: link.description || '',
      is_public: link.is_public,
      sort_order: link.sort_order,
    });
    setEditId(link.id);
    setShowForm(true);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const payload = { ...form, sort_order: Number(form.sort_order) };
      if (editId !== null) {
        await api.updateDriveLink(editId, payload, password);
      } else {
        await api.createDriveLink(payload, password);
      }
      setShowForm(false);
      await loadLinks(password);
    } catch (e: any) {
      setError(e.message || 'Lỗi lưu dữ liệu');
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete(id: number) {
    if (!confirm('Xoá link này?')) return;
    setLoading(true);
    try {
      await api.deleteDriveLink(id, password);
      await loadLinks(password);
    } catch (e: any) {
      setError(e.message || 'Lỗi xoá');
    } finally {
      setLoading(false);
    }
  }

  async function togglePublic(link: DriveLink) {
    setLoading(true);
    try {
      await api.updateDriveLink(link.id, { is_public: !link.is_public }, password);
      await loadLinks(password);
    } catch (e: any) {
      setError(e.message || 'Lỗi cập nhật');
    } finally {
      setLoading(false);
    }
  }

  const inputStyle: React.CSSProperties = {
    width: '100%', padding: '10px 12px', background: BLACK,
    border: `1px solid ${FANTA}44`, color: INK, fontSize: 14,
    outline: 'none', fontFamily: 'inherit', boxSizing: 'border-box',
  };

  if (!authed) {
    return (
      <AdminGuard>
        <div style={{ background: BLACK, color: INK, minHeight: '100vh', fontFamily: '"Space Grotesk", system-ui, sans-serif' }}>
          <header style={{ padding: '48px 48px 32px', borderBottom: `1px solid ${FANTA}33` }}>
            <Link href="/admin" style={{ color: FANTA, textDecoration: 'none', fontSize: 14, fontWeight: 600 }}>← Admin</Link>
            <h1 style={{ fontFamily: 'Anton, sans-serif', fontSize: 'clamp(36px, 6vw, 72px)', lineHeight: 0.92, textTransform: 'uppercase', margin: '16px 0 0' }}>
              QUẢN LÝ <span style={{ color: FANTA }}>ẢNH DRIVE</span>
            </h1>
          </header>
          <div style={{ padding: '48px', maxWidth: 400 }}>
            <form onSubmit={handleLogin}>
              <div style={{ marginBottom: 16 }}>
                <label style={{ display: 'block', fontSize: 12, color: FANTA, letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 8 }}>Mật khẩu Admin</label>
                <input type="password" value={password} onChange={e => setPassword(e.target.value)} style={inputStyle} placeholder="Nhập mật khẩu..." required />
              </div>
              {error && <div style={{ color: '#f87171', fontSize: 13, marginBottom: 12 }}>{error}</div>}
              <button type="submit" disabled={loading} style={{ width: '100%', padding: '12px', background: FANTA, color: '#0a0a0a', border: 'none', cursor: 'pointer', fontFamily: 'Anton, sans-serif', fontSize: 16, letterSpacing: '0.04em', textTransform: 'uppercase' }}>
                {loading ? 'Đang đăng nhập...' : 'Đăng nhập'}
              </button>
            </form>
          </div>
        </div>
      </AdminGuard>
    );
  }

  return (
    <AdminGuard>
      <div style={{ background: BLACK, color: INK, minHeight: '100vh', fontFamily: '"Space Grotesk", system-ui, sans-serif' }}>
        {/* Header */}
        <header style={{ padding: '48px 48px 32px', borderBottom: `1px solid ${FANTA}33` }}>
          <Link href="/admin" style={{ color: FANTA, textDecoration: 'none', fontSize: 14, fontWeight: 600 }}>← Admin</Link>
          <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', marginTop: 16, flexWrap: 'wrap', gap: 16 }}>
            <div>
              <h1 style={{ fontFamily: 'Anton, sans-serif', fontSize: 'clamp(36px, 6vw, 72px)', lineHeight: 0.92, textTransform: 'uppercase', margin: 0 }}>
                QUẢN LÝ <span style={{ color: FANTA }}>ẢNH DRIVE</span>
              </h1>
              <p style={{ color: MUTED, fontSize: 14, marginTop: 10 }}>Quản lý danh sách link ảnh Google Drive. Tick public để hiển thị trên trang gallery.</p>
            </div>
            <div style={{ display: 'flex', gap: 12 }}>
              <Link href="/gallery" target="_blank" style={{ padding: '10px 20px', background: 'transparent', border: `1px solid ${FANTA}44`, color: FANTA, textDecoration: 'none', fontSize: 13, fontFamily: 'inherit', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                ↗ Xem Gallery
              </Link>
              <button
                onClick={openAdd}
                style={{ padding: '10px 24px', background: FANTA, color: '#0a0a0a', border: 'none', cursor: 'pointer', fontFamily: 'Anton, sans-serif', fontSize: 15, letterSpacing: '0.04em', textTransform: 'uppercase' }}
              >
                + THÊM LINK
              </button>
            </div>
          </div>
        </header>

        <main style={{ padding: '32px 48px' }}>
          {error && <div style={{ color: '#f87171', fontSize: 14, marginBottom: 16, padding: '12px 16px', background: 'rgba(248,113,113,0.1)', border: '1px solid rgba(248,113,113,0.3)' }}>{error}</div>}

          {/* Info box */}
          <div style={{ background: `${FANTA}15`, border: `1px solid ${FANTA}44`, padding: '12px 16px', marginBottom: 24, borderRadius: 4, fontSize: 13, lineHeight: 1.6 }}>
            <div style={{ color: FANTA, fontWeight: 600, marginBottom: 6 }}>⚠️ Cách lưu link ảnh:</div>
            <div style={{ color: INK }}>
              Lưu <strong>File ID</strong> từ URL Google Drive (ví dụ: <code style={{ background: '#0a0a0a', padding: '2px 4px' }}>1F2aB3cD4eF5gH6iJ7kL8</code>), không phải đường link đầy đủ hoặc folder link.<br/>
              Lý do: Folder link bị chặn bởi CORS (403 Forbidden), chỉ file ID có thể load được trên browser.<br/>
              📌 Lấy File ID từ: <code style={{ background: '#0a0a0a', padding: '2px 4px' }}>drive.google.com/file/d/<strong>FILE_ID_ĐÂY</strong>/view</code>
            </div>
          </div>

          {/* Add / Edit Form */}
          {showForm && (
            <div style={{ background: CARD, border: `2px solid ${FANTA}66`, padding: 32, marginBottom: 32 }}>
              <h2 style={{ fontFamily: 'Anton, sans-serif', fontSize: 22, color: FANTA, textTransform: 'uppercase', margin: '0 0 24px' }}>
                {editId !== null ? 'Chỉnh sửa link' : 'Thêm link mới'}
              </h2>
              <form onSubmit={handleSubmit}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
                  <div>
                    <label style={{ display: 'block', fontSize: 11, color: FANTA, letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 6 }}>Tiêu đề *</label>
                    <input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} style={inputStyle} placeholder="Tên album / ảnh..." required />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: 11, color: FANTA, letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 6 }}>Thứ tự</label>
                    <input type="number" value={form.sort_order} onChange={e => setForm(f => ({ ...f, sort_order: +e.target.value }))} style={inputStyle} />
                  </div>
                </div>
                <div style={{ marginBottom: 16 }}>
                  <label style={{ display: 'block', fontSize: 11, color: FANTA, letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 6 }}>File ID Google Drive *</label>
                  <input value={form.url} onChange={e => setForm(f => ({ ...f, url: e.target.value }))} style={inputStyle} placeholder="1a2b3c4d5e6f7g8h9i0j..." required />
                  <div style={{ fontSize: 12, color: MUTED, marginTop: 6, lineHeight: 1.5, background: 'rgba(255,107,26,0.05)', padding: '8px 10px', borderRadius: 2 }}>
                    <strong style={{ color: FANTA }}>📌 Cách lấy File ID:</strong>
                    <br/>① Mở ảnh trên Google Drive
                    <br/>② Lấy từ URL: <code style={{ background: '#0a0a0a', padding: '2px 4px', fontSize: 11 }}>...file/d/<strong>FILE_ID_ĐÂY</strong>/view?...</code>
                    <br/>③ Copy đoạn FILE_ID (khoảng 30-40 ký tự chữ số, gạch ngang)
                    <br/><strong style={{ color: '#22c55e', fontSize: 11 }}>✓ VD: 1F2aB3cD4eF5gH6iJ7kL8mN9oP0qR1sT2uV3w</strong>
                  </div>
                </div>
                <div style={{ marginBottom: 16 }}>
                  <label style={{ display: 'block', fontSize: 11, color: FANTA, letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 6 }}>Mô tả</label>
                  <input value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} style={inputStyle} placeholder="Mô tả ngắn (tuỳ chọn)..." />
                </div>
                <div style={{ marginBottom: 24 }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer' }}>
                    <input
                      type="checkbox"
                      checked={form.is_public}
                      onChange={e => setForm(f => ({ ...f, is_public: e.target.checked }))}
                      style={{ width: 16, height: 16, accentColor: FANTA }}
                    />
                    <span style={{ fontSize: 14, color: INK }}>Hiển thị công khai trên trang Gallery</span>
                  </label>
                </div>
                <div style={{ display: 'flex', gap: 12 }}>
                  <button type="submit" disabled={loading} style={{ padding: '10px 28px', background: FANTA, color: '#0a0a0a', border: 'none', cursor: 'pointer', fontFamily: 'Anton, sans-serif', fontSize: 15, letterSpacing: '0.04em', textTransform: 'uppercase' }}>
                    {loading ? '...' : editId !== null ? 'CẬP NHẬT' : 'THÊM'}
                  </button>
                  <button type="button" onClick={() => setShowForm(false)} style={{ padding: '10px 20px', background: 'transparent', border: `1px solid ${LINE}`, color: MUTED, cursor: 'pointer', fontFamily: 'inherit', fontSize: 13 }}>
                    Huỷ
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Table */}
          <div style={{ background: CARD, border: `1px solid ${FANTA}22` }}>
            <div style={{
              display: 'grid', gridTemplateColumns: '40px 1fr 2fr 100px 80px 120px',
              padding: '12px 16px', background: `${FANTA}15`,
              borderBottom: `1px solid ${LINE}`, fontSize: 11,
              color: FANTA, letterSpacing: '0.1em', textTransform: 'uppercase', fontWeight: 700, alignItems: 'center',
            }}>
              <span>#</span>
              <span>Tiêu đề</span>
              <span>File ID</span>
              <span>Thứ tự</span>
              <span>Public</span>
              <span>Thao tác</span>
            </div>

            {links.length === 0 && (
              <div style={{ padding: 48, textAlign: 'center', color: MUTED }}>
                Chưa có link nào. Thêm link đầu tiên!
              </div>
            )}

            {links.map((link, idx) => (
              <div
                key={link.id}
                style={{
                  display: 'grid', gridTemplateColumns: '40px 1fr 2fr 100px 80px 120px',
                  padding: '12px 16px', borderBottom: `1px solid ${LINE}`,
                  alignItems: 'center', background: idx % 2 === 0 ? 'transparent' : `${FANTA}05`,
                }}
              >
                <span style={{ fontSize: 12, color: MUTED }}>{link.id}</span>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 600, color: INK }}>{link.title}</div>
                  {link.description && <div style={{ fontSize: 12, color: MUTED, marginTop: 2 }}>{link.description}</div>}
                </div>
                <div style={{ fontSize: 12, color: MUTED, wordBreak: 'break-all', paddingRight: 8, fontFamily: 'monospace' }}>
                  <span title={link.url}>{link.url.length > 30 ? link.url.slice(0, 30) + '...' : link.url}</span>
                </div>
                <span style={{ fontSize: 13, color: MUTED }}>{link.sort_order}</span>
                <div>
                  <button
                    onClick={() => togglePublic(link)}
                    style={{
                      padding: '4px 10px', border: 'none', cursor: 'pointer', fontWeight: 700, fontSize: 11,
                      background: link.is_public ? '#22c55e22' : 'rgba(255,255,255,0.05)',
                      color: link.is_public ? '#22c55e' : MUTED,
                      letterSpacing: '0.06em', textTransform: 'uppercase',
                    }}
                    title="Bật/tắt public"
                  >
                    {link.is_public ? '● ON' : '○ OFF'}
                  </button>
                </div>
                <div style={{ display: 'flex', gap: 6 }}>
                  <button
                    onClick={() => openEdit(link)}
                    style={{ padding: '4px 12px', background: 'transparent', border: `1px solid ${FANTA}44`, color: FANTA, cursor: 'pointer', fontFamily: 'inherit', fontSize: 12 }}
                  >
                    Sửa
                  </button>
                  <button
                    onClick={() => handleDelete(link.id)}
                    style={{ padding: '4px 10px', background: 'transparent', border: '1px solid rgba(248,113,113,0.4)', color: '#f87171', cursor: 'pointer', fontFamily: 'inherit', fontSize: 12 }}
                  >
                    Xoá
                  </button>
                </div>
              </div>
            ))}
          </div>
        </main>
      </div>
    </AdminGuard>
  );
}
