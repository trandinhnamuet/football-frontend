'use client';

import { useEffect, useState } from 'react';
import AdminGuard from '../../components/AdminGuard';
import AdminHeader from '../../components/AdminHeader';
import { RecruitmentPost, RECRUIT_POSITIONS, FANTA, fmtDate, recruitIsOpen, recruitPositionLabel } from '../../lib/types';
import { api } from '../../lib/api';

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

const emptyForm = {
  title: '', title_en: '',
  slug: '',
  position: 'GK',
  quantity: 1,
  content: '', content_en: '',
  excerpt: '', excerpt_en: '',
  contact_name: '', contact_phone: '', contact_link: '',
  image_url: '',
  is_open: true,
  published_at: new Date().toISOString().slice(0, 10),
  expires_at: '',
};

type FormState = typeof emptyForm & { id?: number };
type SavePayload = Partial<RecruitmentPost>;

function RecruitForm({ initial, onSave, onCancel }: {
  initial: FormState;
  onSave: (data: SavePayload) => Promise<void>;
  onCancel: () => void;
}) {
  const [form, setForm] = useState(initial);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const set = (k: keyof FormState) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
    setForm(f => ({ ...f, [k]: e.target.value }));

  async function handleImageUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const res = await api.uploadRecruitmentImage(file, getPassword());
      setForm(f => ({ ...f, image_url: res.url }));
    } catch { setError('Upload ảnh thất bại'); }
    finally { setUploading(false); }
  }

  async function submit() {
    if (!form.title.trim()) { setError('Cần có tiêu đề'); return; }
    setSaving(true);
    setError('');
    try {
      await onSave({
        ...form,
        quantity: Number(form.quantity) || 1,
        published_at: form.published_at ? new Date(form.published_at).toISOString() : undefined,
        expires_at: form.expires_at ? new Date(form.expires_at).toISOString() : null,
      });
    } catch (e) { setError(e instanceof Error ? e.message : 'Lỗi lưu tin'); }
    finally { setSaving(false); }
  }

  const inputStyle: React.CSSProperties = { width: '100%', background: 'var(--input-bg)', border: `1px solid ${LINE}`, color: INK, padding: '10px 14px', fontSize: 14, fontFamily: 'inherit', outline: 'none', boxSizing: 'border-box' };
  const labelStyle: React.CSSProperties = { fontSize: 11, color: MUTED, letterSpacing: '0.14em', textTransform: 'uppercase', fontWeight: 600, display: 'block', marginBottom: 6 };

  return (
    <div style={{ display: 'grid', gap: 16 }}>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        <div>
          <label style={labelStyle}>Tiêu đề (VI) *</label>
          <input style={inputStyle} value={form.title} onChange={set('title')} placeholder="vd: Tuyển thủ môn cho mùa 2026" />
        </div>
        <div>
          <label style={labelStyle}>Title (EN)</label>
          <input style={inputStyle} value={form.title_en} onChange={set('title_en')} placeholder="e.g. Goalkeeper wanted for the 2026 season" />
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: 16 }}>
        <div>
          <label style={labelStyle}>Vị trí cần tuyển</label>
          <select style={inputStyle} value={form.position} onChange={set('position')}>
            {RECRUIT_POSITIONS.map(p => <option key={p.code} value={p.code}>{p.vi} ({p.code})</option>)}
          </select>
        </div>
        <div>
          <label style={labelStyle}>Số lượng cần</label>
          <input type="number" min={1} style={inputStyle} value={form.quantity} onChange={set('quantity')} />
        </div>
        <div>
          <label style={labelStyle}>Ngày đăng</label>
          <input type="date" style={inputStyle} value={form.published_at} onChange={set('published_at')} />
        </div>
        <div>
          <label style={labelStyle}>Hạn nộp (để trống = đến khi đủ)</label>
          <input type="date" style={inputStyle} value={form.expires_at} onChange={set('expires_at')} />
        </div>
      </div>

      <div>
        <label style={labelStyle}>Slug (đường dẫn)</label>
        <input style={inputStyle} value={form.slug} onChange={set('slug')} placeholder="vd: tuyen-thu-mon" />
        <div style={{ fontSize: 11, color: MUTED, marginTop: 6 }}>
          Đường dẫn trang: <span style={{ color: FANTA }}>lonfantafc.com/recruitment/{(form.slug || '').trim() || '<tự sinh từ tiêu đề>'}</span>
          {' '}— để trống sẽ tự tạo từ tiêu đề. Dấu tiếng Việt sẽ tự bỏ khi lưu.
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        <div>
          <label style={labelStyle}>Tóm tắt (VI)</label>
          <textarea style={{ ...inputStyle, height: 80, resize: 'vertical' }} value={form.excerpt} onChange={set('excerpt')} placeholder="Một hai câu ngắn: cần ai, đá ở đâu, khi nào" />
        </div>
        <div>
          <label style={labelStyle}>Excerpt (EN)</label>
          <textarea style={{ ...inputStyle, height: 80, resize: 'vertical' }} value={form.excerpt_en} onChange={set('excerpt_en')} placeholder="Short summary in English" />
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        <div>
          <label style={labelStyle}>Nội dung / yêu cầu (VI) — HTML hỗ trợ</label>
          <textarea style={{ ...inputStyle, height: 200, resize: 'vertical', fontFamily: 'monospace', fontSize: 13 }} value={form.content} onChange={set('content')} placeholder="<p>Yêu cầu: có kinh nghiệm bắt sân 7, đá đều thứ 7 hàng tuần...</p>" />
        </div>
        <div>
          <label style={labelStyle}>Content (EN)</label>
          <textarea style={{ ...inputStyle, height: 200, resize: 'vertical', fontFamily: 'monospace', fontSize: 13 }} value={form.content_en} onChange={set('content_en')} placeholder="<p>Requirements...</p>" />
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 16 }}>
        <div>
          <label style={labelStyle}>Người liên hệ</label>
          <input style={inputStyle} value={form.contact_name} onChange={set('contact_name')} placeholder="vd: Anh Nam (đội trưởng)" />
        </div>
        <div>
          <label style={labelStyle}>Số điện thoại</label>
          <input style={inputStyle} value={form.contact_phone} onChange={set('contact_phone')} placeholder="09xx xxx xxx" />
        </div>
        <div>
          <label style={labelStyle}>Link Zalo / Facebook</label>
          <input style={inputStyle} value={form.contact_link} onChange={set('contact_link')} placeholder="https://zalo.me/... hoặc https://facebook.com/..." />
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, alignItems: 'end' }}>
        <div>
          <label style={labelStyle}>Ảnh minh hoạ (tuỳ chọn)</label>
          <input type="file" accept="image/*" onChange={handleImageUpload} style={{ ...inputStyle, padding: '8px 12px', cursor: 'pointer' }} />
          {uploading && <div style={{ fontSize: 12, color: FANTA, marginTop: 4 }}>Đang upload...</div>}
          {form.image_url && <div style={{ fontSize: 11, color: '#1f8a5b', marginTop: 4, wordBreak: 'break-all' }}>✓ {form.image_url}</div>}
        </div>
        <label style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer', padding: '10px 14px', border: `1px solid ${LINE}`, background: 'var(--input-bg)' }}>
          <input type="checkbox" checked={form.is_open} onChange={e => setForm(f => ({ ...f, is_open: e.target.checked }))} />
          <span style={{ fontSize: 14 }}>Đang mở nhận ứng viên (bỏ tick khi đã tuyển đủ)</span>
        </label>
      </div>

      {error && (
        <div style={{ color: '#cc4444', fontSize: 13, padding: '10px 14px', background: 'rgba(204,68,68,0.1)', border: '1px solid rgba(204,68,68,0.3)' }}>
          {error}
        </div>
      )}
      <div style={{ display: 'flex', gap: 12 }}>
        <button
          onClick={submit}
          disabled={saving}
          style={{ background: FANTA, color: ON_FANTA, border: 'none', padding: '12px 28px', fontFamily: 'Anton, sans-serif', fontSize: 16, letterSpacing: '0.06em', textTransform: 'uppercase', cursor: 'pointer', opacity: saving ? 0.6 : 1 }}
        >
          {saving ? 'Đang lưu...' : (form.id ? 'Cập nhật' : 'Đăng tin')}
        </button>
        <button
          onClick={onCancel}
          style={{ background: 'transparent', color: MUTED, border: `1px solid ${LINE}`, padding: '12px 24px', fontFamily: 'inherit', fontSize: 14, cursor: 'pointer' }}
        >
          Hủy
        </button>
      </div>
    </div>
  );
}

function toForm(p: RecruitmentPost): FormState {
  return {
    title: p.title || '', title_en: p.title_en || '',
    slug: p.slug || '',
    position: p.position || 'ANY',
    quantity: p.quantity || 1,
    content: p.content || '', content_en: p.content_en || '',
    excerpt: p.excerpt || '', excerpt_en: p.excerpt_en || '',
    contact_name: p.contact_name || '', contact_phone: p.contact_phone || '', contact_link: p.contact_link || '',
    image_url: p.image_url || '',
    is_open: p.is_open !== false,
    published_at: p.published_at?.slice(0, 10) || new Date().toISOString().slice(0, 10),
    expires_at: p.expires_at?.slice(0, 10) || '',
    id: p.id,
  };
}

function RecruitmentManagementContent() {
  const [posts, setPosts] = useState<RecruitmentPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [mode, setMode] = useState<'list' | 'new' | 'edit'>('list');
  const [editing, setEditing] = useState<RecruitmentPost | null>(null);
  const [busy, setBusy] = useState<number | null>(null);

  useEffect(() => { loadPosts(); }, []);

  async function loadPosts() {
    setLoading(true);
    try { setPosts(await api.getRecruitmentPosts()); }
    catch { }
    finally { setLoading(false); }
  }

  async function handleSave(data: SavePayload) {
    const pw = getPassword();
    if (editing) {
      await api.updateRecruitmentPost(editing.id, data, pw);
    } else {
      await api.createRecruitmentPost(data, pw);
    }
    await loadPosts();
    setMode('list');
    setEditing(null);
  }

  async function toggleOpen(post: RecruitmentPost) {
    setBusy(post.id);
    try { await api.updateRecruitmentPost(post.id, { is_open: !post.is_open }, getPassword()); await loadPosts(); }
    catch { alert('Cập nhật thất bại'); }
    finally { setBusy(null); }
  }

  async function handleDelete(id: number) {
    if (!confirm('Xóa tin tuyển quân này?')) return;
    setBusy(id);
    try { await api.deleteRecruitmentPost(id, getPassword()); await loadPosts(); }
    catch { alert('Xóa thất bại'); }
    finally { setBusy(null); }
  }

  const openCount = posts.filter(recruitIsOpen).length;

  return (
    <div style={{ background: BLACK, color: INK, minHeight: '100vh', fontFamily: '"Space Grotesk", system-ui, sans-serif' }}>
      <AdminHeader />

      <main style={{ padding: '40px 48px 80px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 36 }}>
          <div>
            <div style={{ fontSize: 12, color: FANTA, letterSpacing: '0.2em', fontWeight: 700, textTransform: 'uppercase', marginBottom: 16 }}>Quản trị nội dung</div>
            <h1 style={{ fontFamily: 'Anton, sans-serif', fontSize: 56, lineHeight: 0.92, letterSpacing: '0.01em', textTransform: 'uppercase', margin: 0 }}>
              ĐĂNG TIN <span style={{ color: FANTA }}>TUYỂN QUÂN</span>
            </h1>
            <div style={{ fontSize: 13, color: MUTED, marginTop: 14 }}>
              {openCount} tin đang mở · Hiển thị tại <a href="/recruitment" target="_blank" rel="noreferrer" style={{ color: FANTA }}>/recruitment</a> và dải thông báo trên trang chủ
            </div>
          </div>
          {mode === 'list' && (
            <button
              onClick={() => { setEditing(null); setMode('new'); }}
              style={{ background: FANTA, color: ON_FANTA, border: 'none', padding: '14px 28px', fontFamily: 'Anton, sans-serif', fontSize: 18, letterSpacing: '0.06em', textTransform: 'uppercase', cursor: 'pointer' }}
            >
              + ĐĂNG TIN MỚI
            </button>
          )}
        </div>

        {mode !== 'list' && (
          <div style={{ background: CARD, border: `1px solid rgba(255,107,26,0.3)`, padding: '32px', marginBottom: 40 }}>
            <div style={{ fontFamily: 'Anton, sans-serif', fontSize: 24, textTransform: 'uppercase', marginBottom: 24, color: FANTA }}>
              {mode === 'new' ? '+ Tin tuyển quân mới' : '✎ Chỉnh sửa tin'}
            </div>
            <RecruitForm
              initial={editing ? toForm(editing) : { ...emptyForm }}
              onSave={handleSave}
              onCancel={() => { setMode('list'); setEditing(null); }}
            />
          </div>
        )}

        {loading ? (
          <div style={{ textAlign: 'center', padding: 60, color: MUTED, fontFamily: 'Anton, sans-serif', fontSize: 24 }}>Đang tải...</div>
        ) : posts.length === 0 ? (
          <div style={{ textAlign: 'center', padding: 60, background: CARD, borderLeft: `4px solid ${FANTA}` }}>
            <div style={{ fontFamily: 'Anton, sans-serif', fontSize: 28, color: MUTED, textTransform: 'uppercase' }}>Chưa có tin tuyển quân nào</div>
            <div style={{ fontSize: 13, color: MUTED, marginTop: 8 }}>Bấm &quot;+ Đăng tin mới&quot; khi đội thiếu người, ví dụ thiếu thủ môn.</div>
          </div>
        ) : (
          <div style={{ display: 'grid', gap: 12 }}>
            {posts.map(post => {
              const open = recruitIsOpen(post);
              return (
                <div key={post.id} style={{ background: CARD, padding: '20px 24px', display: 'grid', gridTemplateColumns: '1fr auto', gap: 20, alignItems: 'center', borderLeft: `4px solid ${open ? FANTA : LINE}`, opacity: open ? 1 : 0.7 }}>
                  <div>
                    <div style={{ display: 'flex', gap: 10, alignItems: 'center', marginBottom: 6, flexWrap: 'wrap' }}>
                      <span style={{ background: open ? FANTA : LINE, color: open ? ON_FANTA : MUTED, padding: '2px 8px', fontFamily: 'Anton, sans-serif', fontSize: 11, letterSpacing: '0.08em', textTransform: 'uppercase' }}>
                        {open ? 'Đang tuyển' : (post.is_open ? 'Hết hạn' : 'Đã đóng')}
                      </span>
                      <span style={{ border: `1px solid ${FANTA}66`, color: FANTA, padding: '1px 8px', fontSize: 11, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase' }}>
                        {recruitPositionLabel(post.position)} × {post.quantity}
                      </span>
                      <span style={{ fontSize: 12, color: MUTED }}>
                        Đăng {fmtDate(post.published_at)} · Hạn: {post.expires_at ? fmtDate(post.expires_at) : 'đến khi đủ'}
                      </span>
                    </div>
                    <div style={{ fontFamily: 'Anton, sans-serif', fontSize: 20, letterSpacing: '0.01em', textTransform: 'uppercase' }}>{post.title}</div>
                    <div style={{ fontSize: 12, color: MUTED, marginTop: 2 }}>/recruitment/<span style={{ color: FANTA }}>{post.slug || post.id}</span></div>
                    {(post.contact_name || post.contact_phone) && (
                      <div style={{ fontSize: 13, color: MUTED, marginTop: 4 }}>Liên hệ: {[post.contact_name, post.contact_phone].filter(Boolean).join(' · ')}</div>
                    )}
                  </div>
                  <div style={{ display: 'flex', gap: 10 }}>
                    <button
                      onClick={() => toggleOpen(post)}
                      disabled={busy === post.id}
                      style={{ background: 'transparent', color: INK, border: `1px solid ${LINE}`, padding: '8px 16px', fontFamily: 'Anton, sans-serif', fontSize: 12, letterSpacing: '0.06em', textTransform: 'uppercase', cursor: 'pointer' }}
                    >
                      {busy === post.id ? '...' : (post.is_open ? 'Đóng tin' : 'Mở lại')}
                    </button>
                    <button
                      onClick={() => { setEditing(post); setMode('edit'); window.scrollTo(0, 0); }}
                      style={{ background: 'rgba(255,107,26,0.15)', color: FANTA, border: `1px solid ${FANTA}33`, padding: '8px 16px', fontFamily: 'Anton, sans-serif', fontSize: 12, letterSpacing: '0.06em', textTransform: 'uppercase', cursor: 'pointer' }}
                    >
                      Sửa
                    </button>
                    <button
                      onClick={() => handleDelete(post.id)}
                      disabled={busy === post.id}
                      style={{ background: 'rgba(204,68,68,0.1)', color: '#cc4444', border: '1px solid rgba(204,68,68,0.3)', padding: '8px 16px', fontFamily: 'Anton, sans-serif', fontSize: 12, letterSpacing: '0.06em', textTransform: 'uppercase', cursor: 'pointer' }}
                    >
                      {busy === post.id ? '...' : 'Xóa'}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}

export default function RecruitmentManagementPage() {
  return <AdminGuard><RecruitmentManagementContent /></AdminGuard>;
}
