'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import AdminGuard from '../../components/AdminGuard';
import AdminHeader from '../../components/AdminHeader';
import ArticleImageLibrary, { absoluteUrl } from '../../components/ArticleImageLibrary';
import { Article, FANTA, fmtDate } from '../../lib/types';
import { api } from '../../lib/api';
import { compressImage, formatBytes } from '../../lib/imageCompress';

const BLACK = 'var(--bg)';
const CARD = 'var(--card)';
const INK = 'var(--ink)';
const MUTED = 'var(--muted)';
const LINE = 'var(--line)';
// Text sitting on a FANTA-orange fill stays dark in both themes — light text on
// orange fails contrast.
const ON_FANTA = '#0a0a0a';

function getPassword() {
  return typeof window !== 'undefined' ? (localStorage.getItem('lffc_admin_pw') || '') : '';
}

const emptyForm = { title: '', title_en: '', content: '', content_en: '', excerpt: '', excerpt_en: '', tag: '', tag_en: '', image_url: '', published_at: new Date().toISOString().slice(0, 10) };

function NewsForm({ initial, onSave, onCancel }: { initial: typeof emptyForm & { id?: number }; onSave: (data: any) => Promise<void>; onCancel: () => void }) {
  const [form, setForm] = useState(initial);
  const [uploading, setUploading] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const contentRef = useRef<HTMLTextAreaElement>(null);
  const contentEnRef = useRef<HTMLTextAreaElement>(null);
  // Which content box the library inserts into — follows whichever was focused last.
  const [target, setTarget] = useState<'content' | 'content_en'>('content');
  // An untouched textarea reports caret 0, which would insert at the very top;
  // append to the end until the writer has actually placed the caret.
  const caretPlaced = useRef(false);

  const set = (k: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setForm(f => ({ ...f, [k]: e.target.value }));

  function focusContent(which: 'content' | 'content_en') {
    setTarget(which);
    caretPlaced.current = true;
  }

  function insertIntoContent(html: string) {
    const el = (target === 'content' ? contentRef : contentEnRef).current;
    const start = el && caretPlaced.current ? el.selectionStart : -1;
    const end = el && caretPlaced.current ? el.selectionEnd : -1;
    const splice = (v: string) => (start < 0 ? v + html : v.slice(0, start) + html + v.slice(end));
    setForm(f => (target === 'content'
      ? { ...f, content: splice(f.content) }
      : { ...f, content_en: splice(f.content_en) }));
    if (el && start >= 0) {
      requestAnimationFrame(() => {
        el.focus();
        el.setSelectionRange(start + html.length, start + html.length);
      });
    }
  }

  async function handleImageUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading('Đang nén...');
    setError('');
    try {
      const result = await compressImage(file);
      setUploading(`Đang tải lên (${formatBytes(result.originalSize)} → ${formatBytes(result.size)})...`);
      const res = await api.uploadArticleImage(result.file, getPassword());
      setForm(f => ({ ...f, image_url: res.url }));
    } catch { setError('Upload ảnh thất bại'); }
    finally { setUploading(''); e.target.value = ''; }
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

  const inputStyle: React.CSSProperties = { width: '100%', background: 'var(--input-bg)', border: `1px solid ${LINE}`, color: INK, padding: '10px 14px', fontSize: 14, fontFamily: 'inherit', outline: 'none', boxSizing: 'border-box' };
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
          <label style={labelStyle}>
            Nội dung (VI) * — HTML hỗ trợ
            {target === 'content' && <span style={{ color: FANTA, marginLeft: 8 }}>● đang chọn để chèn ảnh</span>}
          </label>
          <textarea ref={contentRef} onFocus={() => focusContent('content')} style={{ ...inputStyle, height: 220, resize: 'vertical', fontFamily: 'monospace', fontSize: 13, borderColor: target === 'content' ? `${FANTA}66` : LINE }} value={form.content} onChange={set('content')} placeholder="<p>Nội dung bài viết...</p>" />
        </div>
        <div>
          <label style={labelStyle}>
            Content (EN)
            {target === 'content_en' && <span style={{ color: FANTA, marginLeft: 8 }}>● đang chọn để chèn ảnh</span>}
          </label>
          <textarea ref={contentEnRef} onFocus={() => focusContent('content_en')} style={{ ...inputStyle, height: 220, resize: 'vertical', fontFamily: 'monospace', fontSize: 13, borderColor: target === 'content_en' ? `${FANTA}66` : LINE }} value={form.content_en} onChange={set('content_en')} placeholder="<p>Article content...</p>" />
        </div>
      </div>

      <ArticleImageLibrary password={getPassword()} onInsert={insertIntoContent} />
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
          {uploading && <div style={{ fontSize: 12, color: FANTA, marginTop: 4 }}>{uploading}</div>}
          {form.image_url && (
            <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginTop: 6 }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={absoluteUrl(form.image_url)} alt="" style={{ width: 48, height: 48, objectFit: 'cover', border: `1px solid ${LINE}` }} />
              <div style={{ fontSize: 11, color: '#1f8a5b', wordBreak: 'break-all', flex: 1 }}>✓ {form.image_url}</div>
              <button type="button" onClick={() => setForm(f => ({ ...f, image_url: '' }))} style={{ background: 'transparent', color: MUTED, border: `1px solid ${LINE}`, padding: '4px 8px', fontSize: 11, cursor: 'pointer' }}>Bỏ</button>
            </div>
          )}
        </div>
      </div>
      {error && <div style={{ color: '#cc4444', fontSize: 13, padding: '10px 14px', background: 'rgba(204,68,68,0.1)', border: '1px solid rgba(204,68,68,0.3)' }}>{error}</div>}
      <div style={{ display: 'flex', gap: 12 }}>
        <button onClick={submit} disabled={saving} style={{ background: FANTA, color: ON_FANTA, border: 'none', padding: '12px 28px', fontFamily: 'Anton, sans-serif', fontSize: 16, letterSpacing: '0.06em', textTransform: 'uppercase', cursor: 'pointer', opacity: saving ? 0.6 : 1 }}>
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
      <AdminHeader />

      <main style={{ padding: '40px 48px 80px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 36 }}>
          <div>
            <div style={{ fontSize: 12, color: FANTA, letterSpacing: '0.2em', fontWeight: 700, textTransform: 'uppercase', marginBottom: 8 }}>Quản trị nội dung</div>
            <h1 style={{ fontFamily: 'Anton, sans-serif', fontSize: 56, lineHeight: 0.92, letterSpacing: '0.01em', textTransform: 'uppercase', margin: 0 }}>
              QUẢN LÝ <span style={{ color: FANTA }}>BÀI VIẾT</span>
            </h1>
          </div>
          {mode === 'list' && (
            <button onClick={() => { setEditing(null); setMode('new'); }} style={{ background: FANTA, color: ON_FANTA, border: 'none', padding: '14px 28px', fontFamily: 'Anton, sans-serif', fontSize: 18, letterSpacing: '0.06em', textTransform: 'uppercase', cursor: 'pointer' }}>
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
                    {article.tag && <span style={{ background: FANTA, color: ON_FANTA, padding: '2px 8px', fontFamily: 'Anton, sans-serif', fontSize: 11, letterSpacing: '0.08em', textTransform: 'uppercase' }}>{article.tag}</span>}
                    <span style={{ fontSize: 12, color: MUTED }}>{fmtDate(article.published_at)}</span>
                  </div>
                  <div style={{ fontFamily: 'Anton, sans-serif', fontSize: 20, letterSpacing: '0.01em', textTransform: 'uppercase' }}>{article.title}</div>
                  {article.excerpt && <div style={{ fontSize: 13, color: MUTED, marginTop: 4 }}>{article.excerpt.slice(0, 120)}...</div>}
                </div>
                <div style={{ display: 'flex', gap: 10 }}>
                  <Link href={`/news/${article.id}`} target="_blank" style={{ background: 'var(--hover-bg)', color: INK, padding: '8px 16px', textDecoration: 'none', fontSize: 12, fontFamily: 'Anton, sans-serif', letterSpacing: '0.06em', textTransform: 'uppercase' }}>Xem</Link>
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
