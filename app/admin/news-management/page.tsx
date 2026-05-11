'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import AdminGuard from '../../components/AdminGuard';
import { Article, FANTA, fmtDate } from '../../lib/types';
import { api } from '../../lib/api';

const BLACK = '#0a0a0a';
const CARD = '#1a1a1a';
const INK = '#f4f1ea';
const MUTED = '#a09b94';
const LINE = 'rgba(255,255,255,0.15)';

function getPassword() {
  return typeof window !== 'undefined' ? (localStorage.getItem('lffc_admin_pw') || '') : '';
}

const emptyForm = { title: '', title_en: '', content: '', content_en: '', excerpt: '', excerpt_en: '', tag: '', tag_en: '', image_url: '', published_at: new Date().toISOString().slice(0, 10) };

function NewsForm({ initial, onSave, onCancel }: { initial: typeof emptyForm & { id?: number }; onSave: (data: any) => Promise<void>; onCancel: () => void }) {
  const [form, setForm] = useState(initial);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const set = (k: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setForm(f => ({ ...f, [k]: e.target.value }));

  async function handleImageUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const res = await api.uploadArticleImage(file, getPassword());
      setForm(f => ({ ...f, image_url: res.url }));
    } catch { setError('Upload ảnh thất bại'); }
    finally { setUploading(false); }
  }

  async function submit() {
    if (!form.title.trim()) { setError('Cần có tiêu đề'); return; }
    setSaving(true);
    setError('');
    try {
      await onSave({ ...form, published_at: form.published_at ? new Date(form.published_at).toISOString() : undefined });
    } catch (e: any) { setError(e.message || 'Lỗi lưu bài'); }
    finally { setSaving(false); }
  }

  const inputStyle: React.CSSProperties = { width: '100%', background: 'rgba(255,255,255,0.05)', border: `1px solid ${LINE}`, color: INK, padding: '10px 14px', fontSize: 14, fontFamily: 'inherit', outline: 'none', boxSizing: 'border-box' };
  const labelStyle: React.CSSProperties = { fontSize: 11, color: MUTED, letterSpacing: '0.14em', textTransform: 'uppercase', fontWeight: 600, display: 'block', marginBottom: 6 };

  return (
    <div style={{ display: 'grid', gap: 16 }}>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        <div>
          <label style={labelStyle}>Tiêu đề (VI) *</label>
          <input style={inputStyle} value={form.title} onChange={set('title')} placeholder="Tiêu đề bài viết" />
        </div>
        <div>
          <label style={labelStyle}>Title (EN)</label>
          <input style={inputStyle} value={form.title_en} onChange={set('title_en')} placeholder="Article title in English" />
        </div>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        <div>
          <label style={labelStyle}>Tóm tắt (VI)</label>
          <textarea style={{ ...inputStyle, height: 80, resize: 'vertical' }} value={form.excerpt} onChange={set('excerpt')} placeholder="Đoạn tóm tắt ngắn" />
        </div>
        <div>
          <label style={labelStyle}>Excerpt (EN)</label>
          <textarea style={{ ...inputStyle, height: 80, resize: 'vertical' }} value={form.excerpt_en} onChange={set('excerpt_en')} placeholder="Short excerpt in English" />
        </div>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        <div>
          <label style={labelStyle}>Nội dung (VI) * — HTML hỗ trợ</label>
          <textarea style={{ ...inputStyle, height: 220, resize: 'vertical', fontFamily: 'monospace', fontSize: 13 }} value={form.content} onChange={set('content')} placeholder="<p>Nội dung bài viết...</p>" />
        </div>
        <div>
          <label style={labelStyle}>Content (EN)</label>
          <textarea style={{ ...inputStyle, height: 220, resize: 'vertical', fontFamily: 'monospace', fontSize: 13 }} value={form.content_en} onChange={set('content_en')} placeholder="<p>Article content...</p>" />
        </div>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: 16 }}>
        <div>
          <label style={labelStyle}>Tag (VI)</label>
          <input style={inputStyle} value={form.tag} onChange={set('tag')} placeholder="Trận đấu" />
        </div>
        <div>
          <label style={labelStyle}>Tag (EN)</label>
          <input style={inputStyle} value={form.tag_en} onChange={set('tag_en')} placeholder="Match" />
        </div>
        <div>
          <label style={labelStyle}>Ngày đăng</label>
          <input type="date" style={inputStyle} value={form.published_at} onChange={set('published_at')} />
        </div>
        <div>
          <label style={labelStyle}>Ảnh đại diện</label>
          <input type="file" accept="image/*" onChange={handleImageUpload} style={{ ...inputStyle, padding: '8px 12px', cursor: 'pointer' }} />
          {uploading && <div style={{ fontSize: 12, color: FANTA, marginTop: 4 }}>Đang upload...</div>}
          {form.image_url && <div style={{ fontSize: 11, color: '#1f8a5b', marginTop: 4, wordBreak: 'break-all' }}>✓ {form.image_url}</div>}
        </div>
      </div>
      {error && <div style={{ color: '#cc4444', fontSize: 13, padding: '10px 14px', background: 'rgba(204,68,68,0.1)', border: '1px solid rgba(204,68,68,0.3)' }}>{error}</div>}
      <div style={{ display: 'flex', gap: 12 }}>
        <button onClick={submit} disabled={saving} style={{ background: FANTA, color: BLACK, border: 'none', padding: '12px 28px', fontFamily: 'Anton, sans-serif', fontSize: 16, letterSpacing: '0.06em', textTransform: 'uppercase', cursor: 'pointer', opacity: saving ? 0.6 : 1 }}>
          {saving ? 'Đang lưu...' : (form.id ? 'Cập nhật' : 'Đăng bài')}
        </button>
        <button onClick={onCancel} style={{ background: 'transparent', color: MUTED, border: `1px solid ${LINE}`, padding: '12px 24px', fontFamily: 'inherit', fontSize: 14, cursor: 'pointer' }}>Hủy</button>
      </div>
    </div>
  );
}

function NewsManagementContent() {
  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);
  const [mode, setMode] = useState<'list' | 'new' | 'edit'>('list');
  const [editing, setEditing] = useState<Article | null>(null);
  const [deleting, setDeleting] = useState<number | null>(null);

  useEffect(() => { loadArticles(); }, []);

  async function loadArticles() {
    setLoading(true);
    try { setArticles(await api.getArticles()); }
    catch { }
    finally { setLoading(false); }
  }

  async function handleSave(data: any) {
    const pw = getPassword();
    if (editing) {
      await api.updateArticle(editing.id, data, pw);
    } else {
      await api.createArticle(data, pw);
    }
    await loadArticles();
    setMode('list');
    setEditing(null);
  }

  async function handleDelete(id: number) {
    if (!confirm('Xóa bài viết này?')) return;
    setDeleting(id);
    try { await api.deleteArticle(id, getPassword()); await loadArticles(); }
    catch { alert('Xóa thất bại'); }
    finally { setDeleting(null); }
  }

  return (
    <div style={{ background: BLACK, color: INK, minHeight: '100vh', fontFamily: '"Space Grotesk", system-ui, sans-serif' }}>
      <nav style={{ position: 'sticky', top: 0, zIndex: 50, background: BLACK, borderBottom: `1px solid ${FANTA}`, padding: '14px 48px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ fontFamily: 'Anton, sans-serif', fontSize: 22, letterSpacing: '0.04em' }}>
          LON FANTA <span style={{ color: FANTA }}>FC</span> <span style={{ color: MUTED, fontSize: 14 }}>/ Admin</span>
        </div>
        <div style={{ display: 'flex', gap: 20, fontSize: 12, color: MUTED, letterSpacing: '0.1em', textTransform: 'uppercase', fontWeight: 600 }}>
          <Link href="/" style={{ color: 'inherit', textDecoration: 'none' }}>← Trang chủ</Link>
          <Link href="/admin/player-management" style={{ color: 'inherit', textDecoration: 'none' }}>Quản lý cầu thủ</Link>
          <button onClick={() => { localStorage.removeItem('lffc_admin_pw'); location.reload(); }} style={{ background: 'none', border: 'none', color: '#cc4444', cursor: 'pointer', fontFamily: 'inherit', fontSize: 12, letterSpacing: '0.1em', textTransform: 'uppercase', fontWeight: 600 }}>Đăng xuất</button>
        </div>
      </nav>

      <main style={{ padding: '40px 48px 80px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 36 }}>
          <div>
            <div style={{ fontSize: 12, color: FANTA, letterSpacing: '0.2em', fontWeight: 700, textTransform: 'uppercase', marginBottom: 8 }}>Quản trị nội dung</div>
            <h1 style={{ fontFamily: 'Anton, sans-serif', fontSize: 56, lineHeight: 0.92, letterSpacing: '0.01em', textTransform: 'uppercase', margin: 0 }}>
              QUẢN LÝ <span style={{ color: FANTA }}>BÀI VIẾT</span>
            </h1>
          </div>
          {mode === 'list' && (
            <button onClick={() => { setEditing(null); setMode('new'); }} style={{ background: FANTA, color: BLACK, border: 'none', padding: '14px 28px', fontFamily: 'Anton, sans-serif', fontSize: 18, letterSpacing: '0.06em', textTransform: 'uppercase', cursor: 'pointer' }}>
              + VIẾT BÀI MỚI
            </button>
          )}
        </div>

        {mode !== 'list' && (
          <div style={{ background: CARD, border: `1px solid rgba(255,107,26,0.3)`, padding: '32px', marginBottom: 40 }}>
            <div style={{ fontFamily: 'Anton, sans-serif', fontSize: 24, textTransform: 'uppercase', marginBottom: 24, color: FANTA }}>
              {mode === 'new' ? '+ Bài viết mới' : '✎ Chỉnh sửa bài viết'}
            </div>
            <NewsForm
              initial={editing ? {
                title: editing.title || '', title_en: editing.title_en || '',
                content: editing.content || '', content_en: editing.content_en || '',
                excerpt: editing.excerpt || '', excerpt_en: editing.excerpt_en || '',
                tag: editing.tag || '', tag_en: editing.tag_en || '',
                image_url: editing.image_url || '',
                published_at: editing.published_at?.slice(0, 10) || new Date().toISOString().slice(0, 10),
                id: editing.id,
              } : { ...emptyForm }}
              onSave={handleSave}
              onCancel={() => { setMode('list'); setEditing(null); }}
            />
          </div>
        )}

        {loading ? (
          <div style={{ textAlign: 'center', padding: 60, color: MUTED, fontFamily: 'Anton, sans-serif', fontSize: 24 }}>Đang tải...</div>
        ) : articles.length === 0 ? (
          <div style={{ textAlign: 'center', padding: 60, background: CARD, borderLeft: `4px solid ${FANTA}` }}>
            <div style={{ fontFamily: 'Anton, sans-serif', fontSize: 28, color: MUTED, textTransform: 'uppercase' }}>Chưa có bài viết</div>
          </div>
        ) : (
          <div style={{ display: 'grid', gap: 12 }}>
            {articles.map(article => (
              <div key={article.id} style={{ background: CARD, padding: '20px 24px', display: 'grid', gridTemplateColumns: '1fr auto', gap: 20, alignItems: 'center', borderLeft: `4px solid ${FANTA}` }}>
                <div>
                  <div style={{ display: 'flex', gap: 10, alignItems: 'center', marginBottom: 6 }}>
                    {article.tag && <span style={{ background: FANTA, color: BLACK, padding: '2px 8px', fontFamily: 'Anton, sans-serif', fontSize: 11, letterSpacing: '0.08em', textTransform: 'uppercase' }}>{article.tag}</span>}
                    <span style={{ fontSize: 12, color: MUTED }}>{fmtDate(article.published_at)}</span>
                  </div>
                  <div style={{ fontFamily: 'Anton, sans-serif', fontSize: 20, letterSpacing: '0.01em', textTransform: 'uppercase' }}>{article.title}</div>
                  {article.excerpt && <div style={{ fontSize: 13, color: MUTED, marginTop: 4 }}>{article.excerpt.slice(0, 120)}...</div>}
                </div>
                <div style={{ display: 'flex', gap: 10 }}>
                  <Link href={`/news/${article.id}`} target="_blank" style={{ background: 'rgba(255,255,255,0.08)', color: INK, padding: '8px 16px', textDecoration: 'none', fontSize: 12, fontFamily: 'Anton, sans-serif', letterSpacing: '0.06em', textTransform: 'uppercase' }}>Xem</Link>
                  <button onClick={() => { setEditing(article); setMode('edit'); window.scrollTo(0, 0); }} style={{ background: 'rgba(255,107,26,0.15)', color: FANTA, border: `1px solid ${FANTA}33`, padding: '8px 16px', fontFamily: 'Anton, sans-serif', fontSize: 12, letterSpacing: '0.06em', textTransform: 'uppercase', cursor: 'pointer' }}>Sửa</button>
                  <button onClick={() => handleDelete(article.id)} disabled={deleting === article.id} style={{ background: 'rgba(204,68,68,0.1)', color: '#cc4444', border: '1px solid rgba(204,68,68,0.3)', padding: '8px 16px', fontFamily: 'Anton, sans-serif', fontSize: 12, letterSpacing: '0.06em', textTransform: 'uppercase', cursor: 'pointer' }}>
                    {deleting === article.id ? '...' : 'Xóa'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}

export default function NewsManagementPage() {
  return <AdminGuard><NewsManagementContent /></AdminGuard>;
}
