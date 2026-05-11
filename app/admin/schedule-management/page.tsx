'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import AdminGuard from '../../components/AdminGuard';
import AdminHeader from '../../components/AdminHeader';
import { Match, FANTA, fmtDate } from '../../lib/types';
import { api } from '../../lib/api';

const BLACK = '#0a0a0a';
const CARD = '#1a1a1a';
const INK = '#f4f1ea';
const MUTED = '#a09b94';
const LINE = 'rgba(255,255,255,0.15)';

function getPassword() {
  return typeof window !== 'undefined' ? (localStorage.getItem('lffc_admin_pw') || '') : '';
}

const emptyMatch = {
  week: 1,
  date: new Date().toISOString().slice(0, 10),
  opponent: '',
  venue: 'Sân Đầm Hồng',
  result: '',
  score: '',
  goals_for: 0,
  goals_against: 0,
  is_upcoming: true,
  time: '17:30',
};

type MatchForm = typeof emptyMatch;

interface MatchModalProps {
  initial: MatchForm & { id?: number };
  mode: 'create' | 'edit';
  onSave: (data: MatchForm & { id?: number }) => Promise<void>;
  onClose: () => void;
}

function MatchModal({ initial, mode, onSave, onClose }: MatchModalProps) {
  const [form, setForm] = useState<MatchForm & { id?: number }>(initial);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const set = (k: keyof MatchForm) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const val = e.target.type === 'checkbox'
      ? (e.target as HTMLInputElement).checked
      : e.target.type === 'number' ? +e.target.value : e.target.value;
    setForm(f => ({ ...f, [k]: val }));
  };

  async function handleSave() {
    if (!form.opponent.trim()) { setError('Nhập tên đối thủ'); return; }
    if (!form.date) { setError('Chọn ngày thi đấu'); return; }
    setSaving(true);
    setError('');
    try {
      await onSave(form);
      onClose();
    } catch (e: any) { setError(e.message || 'Lỗi lưu'); }
    finally { setSaving(false); }
  }

  const inputStyle: React.CSSProperties = {
    width: '100%', background: 'rgba(255,255,255,0.06)', border: `1px solid ${LINE}`,
    color: INK, padding: '10px 14px', fontSize: 14, fontFamily: 'inherit',
    outline: 'none', boxSizing: 'border-box',
  };
  const labelStyle: React.CSSProperties = {
    fontSize: 10, color: MUTED, letterSpacing: '0.14em', textTransform: 'uppercase',
    fontWeight: 700, display: 'block', marginBottom: 5,
  };

  return (
    <div
      style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.75)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div style={{ background: '#111', border: `1px solid ${FANTA}44`, width: '100%', maxWidth: 580, maxHeight: '90vh', overflowY: 'auto' }}>
        <div style={{ padding: '20px 28px', borderBottom: `1px solid ${LINE}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <div style={{ fontFamily: 'Anton, sans-serif', fontSize: 22, letterSpacing: '0.04em', textTransform: 'uppercase' }}>
              {mode === 'create' ? 'Thêm trận mới' : `Sửa trận #${initial.week}`}
            </div>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: MUTED, cursor: 'pointer', fontSize: 24, lineHeight: 1, padding: 4 }}>✕</button>
        </div>

        <div style={{ padding: '24px 28px', display: 'grid', gap: 16 }}>
          {/* Week + Date */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: 16 }}>
            <div>
              <label style={labelStyle}>Tuần #</label>
              <input style={inputStyle} type="number" min={1} value={form.week} onChange={set('week')} />
            </div>
            <div>
              <label style={labelStyle}>Ngày thi đấu</label>
              <input style={inputStyle} type="date" value={form.date} onChange={set('date')} />
            </div>
          </div>

          {/* Opponent + Venue */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            <div>
              <label style={labelStyle}>Đối thủ *</label>
              <input style={inputStyle} value={form.opponent} onChange={set('opponent')} placeholder="Tên đối thủ" />
            </div>
            <div>
              <label style={labelStyle}>Sân đấu</label>
              <input style={inputStyle} value={form.venue} onChange={set('venue')} placeholder="Tên sân" />
            </div>
          </div>

          {/* Time + Upcoming */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            <div>
              <label style={labelStyle}>Giờ thi đấu</label>
              <input style={inputStyle} value={form.time} onChange={set('time')} placeholder="17:30" />
            </div>
            <div style={{ display: 'flex', alignItems: 'flex-end', gap: 10, paddingBottom: 4 }}>
              <input
                type="checkbox"
                id="is_upcoming"
                checked={form.is_upcoming}
                onChange={e => setForm(f => ({ ...f, is_upcoming: e.target.checked }))}
                style={{ width: 18, height: 18, cursor: 'pointer', accentColor: FANTA }}
              />
              <label htmlFor="is_upcoming" style={{ ...labelStyle, marginBottom: 0, cursor: 'pointer' }}>Trận sắp tới (chưa đá)</label>
            </div>
          </div>

          {/* Score fields (for played matches) */}
          {!form.is_upcoming && (
            <>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 16 }}>
                <div>
                  <label style={labelStyle}>Bàn ghi (GF)</label>
                  <input style={inputStyle} type="number" min={0} value={form.goals_for} onChange={set('goals_for')} />
                </div>
                <div>
                  <label style={labelStyle}>Bàn thủng (GA)</label>
                  <input style={inputStyle} type="number" min={0} value={form.goals_against} onChange={set('goals_against')} />
                </div>
                <div>
                  <label style={labelStyle}>Kết quả</label>
                  <select style={inputStyle} value={form.result} onChange={set('result')}>
                    <option value="">— Chọn —</option>
                    <option value="W">Thắng (W)</option>
                    <option value="D">Hòa (D)</option>
                    <option value="L">Thua (L)</option>
                  </select>
                </div>
              </div>
              <div>
                <label style={labelStyle}>Tỷ số (hiển thị)</label>
                <input style={inputStyle} value={form.score} onChange={set('score')} placeholder="vd: 3 - 1" />
              </div>
            </>
          )}

          {error && <div style={{ color: '#cc4444', fontSize: 13 }}>{error}</div>}

          <div style={{ display: 'flex', gap: 10, marginTop: 4 }}>
            <button
              onClick={handleSave}
              disabled={saving}
              style={{ flex: 1, background: FANTA, color: BLACK, border: 'none', padding: '13px', fontFamily: 'Anton, sans-serif', fontSize: 16, letterSpacing: '0.04em', textTransform: 'uppercase', cursor: 'pointer', opacity: saving ? 0.7 : 1 }}
            >
              {saving ? '...' : mode === 'create' ? 'Thêm trận' : 'Lưu thay đổi'}
            </button>
            <button
              onClick={onClose}
              style={{ flex: 0.5, background: 'transparent', color: MUTED, border: `1px solid ${LINE}`, padding: '13px', fontFamily: 'inherit', fontSize: 14, cursor: 'pointer' }}
            >
              Hủy
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function ScheduleManagementContent() {
  const [matches, setMatches] = useState<Match[]>([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState<{ mode: 'create' | 'edit'; data: MatchForm & { id?: number } } | null>(null);
  const [deleting, setDeleting] = useState<number | null>(null);
  const [msg, setMsg] = useState('');
  const [filter, setFilter] = useState<'ALL' | 'upcoming' | 'played'>('ALL');

  useEffect(() => { loadMatches(); }, []);

  async function loadMatches() {
    setLoading(true);
    try { setMatches(await api.getMatches()); }
    catch { }
    finally { setLoading(false); }
  }

  async function handleSave(data: MatchForm & { id?: number }) {
    const pw = getPassword();
    if (data.id) {
      await api.updateMatch(data.id, data, pw);
      setMsg('✓ Đã cập nhật trận đấu');
    } else {
      await api.createMatch(data, pw);
      setMsg('✓ Đã thêm trận mới');
    }
    await loadMatches();
    setTimeout(() => setMsg(''), 3000);
  }

  async function handleDelete(id: number) {
    if (!confirm('Xác nhận xóa trận này?')) return;
    setDeleting(id);
    try {
      await api.deleteMatch(id, getPassword());
      setMsg('✓ Đã xóa trận đấu');
      await loadMatches();
      setTimeout(() => setMsg(''), 3000);
    } catch (e: any) { setMsg('Lỗi: ' + e.message); }
    finally { setDeleting(null); }
  }

  function openEdit(m: Match) {
    setModal({
      mode: 'edit',
      data: {
        id: m.id,
        week: m.week,
        date: m.date,
        opponent: m.opponent,
        venue: m.venue || '',
        result: m.result || '',
        score: m.score || '',
        goals_for: m.goals_for || 0,
        goals_against: m.goals_against || 0,
        is_upcoming: m.is_upcoming,
        time: m.time || '17:30',
      },
    });
  }

  const filtered = filter === 'ALL' ? matches
    : filter === 'upcoming' ? matches.filter(m => m.is_upcoming)
    : matches.filter(m => !m.is_upcoming);

  const resultColor: Record<string, string> = { W: '#1f8a5b', D: '#888', L: '#aa2222' };

  return (
    <div style={{ background: BLACK, color: INK, minHeight: '100vh', fontFamily: '"Space Grotesk", system-ui, sans-serif' }}>
      {modal && (
        <MatchModal
          initial={modal.data}
          mode={modal.mode}
          onSave={handleSave}
          onClose={() => setModal(null)}
        />
      )}

      <AdminHeader />

      <main style={{ padding: '40px 48px 80px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 36 }}>
          <div>
            <div style={{ fontSize: 12, color: FANTA, letterSpacing: '0.2em', fontWeight: 700, textTransform: 'uppercase', marginBottom: 8 }}>Quản trị lịch thi đấu</div>
            <h1 style={{ fontFamily: 'Anton, sans-serif', fontSize: 56, lineHeight: 0.92, letterSpacing: '0.01em', textTransform: 'uppercase', margin: 0 }}>
              LỊCH <span style={{ color: FANTA }}>THI ĐẤU</span>
            </h1>
            <p style={{ color: MUTED, fontSize: 14, marginTop: 8 }}>Quản lý kết quả và lịch thi đấu sắp tới</p>
          </div>
          <button
            onClick={() => setModal({ mode: 'create', data: { ...emptyMatch, week: matches.length + 1 } })}
            style={{ background: FANTA, color: BLACK, border: 'none', padding: '14px 28px', fontFamily: 'Anton, sans-serif', fontSize: 16, letterSpacing: '0.06em', textTransform: 'uppercase', cursor: 'pointer' }}
          >
            + Thêm trận
          </button>
        </div>

        {msg && (
          <div style={{ marginBottom: 20, padding: '12px 20px', background: msg.startsWith('✓') ? 'rgba(31,138,91,0.15)' : 'rgba(255,50,50,0.1)', border: `1px solid ${msg.startsWith('✓') ? '#1f8a5b' : '#cc4444'}44`, color: INK, fontSize: 14 }}>
            {msg}
          </div>
        )}

        {/* Filter */}
        <div style={{ display: 'flex', gap: 8, marginBottom: 24 }}>
          {([['ALL', `Tất cả (${matches.length})`], ['upcoming', `Sắp tới (${matches.filter(m => m.is_upcoming).length})`], ['played', `Đã đá (${matches.filter(m => !m.is_upcoming).length})`]] as const).map(([val, label]) => (
            <button key={val} onClick={() => setFilter(val)} style={{
              background: filter === val ? INK : 'rgba(255,255,255,0.05)',
              color: filter === val ? BLACK : INK,
              border: `1px solid ${filter === val ? INK : LINE}`,
              padding: '8px 16px', fontSize: 12, letterSpacing: '0.06em', cursor: 'pointer', fontFamily: 'inherit', fontWeight: 600, textTransform: 'uppercase',
            }}>
              {label}
            </button>
          ))}
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: 60, color: MUTED, fontFamily: 'Anton, sans-serif', fontSize: 24 }}>Đang tải...</div>
        ) : (
          <div style={{ background: CARD, border: `1px solid rgba(255,255,255,0.06)` }}>
            {/* Table header */}
            <div style={{ display: 'grid', gridTemplateColumns: '60px 80px 100px 1fr 1fr 80px 80px 120px', gap: 12, padding: '12px 20px', borderBottom: `1px solid ${LINE}`, fontSize: 10, color: MUTED, letterSpacing: '0.14em', textTransform: 'uppercase', fontWeight: 700 }}>
              <div>Tuần</div>
              <div>Ngày</div>
              <div>Giờ</div>
              <div>Đối thủ</div>
              <div>Sân</div>
              <div>Tỷ số</div>
              <div>KQ</div>
              <div>Thao tác</div>
            </div>

            {filtered.length === 0 ? (
              <div style={{ padding: '40px 20px', textAlign: 'center', color: MUTED, fontFamily: 'Anton, sans-serif', fontSize: 20 }}>
                Không có trận đấu
              </div>
            ) : filtered.map((m, i) => (
              <div
                key={m.id}
                style={{
                  display: 'grid',
                  gridTemplateColumns: '60px 80px 100px 1fr 1fr 80px 80px 120px',
                  gap: 12,
                  padding: '14px 20px',
                  borderBottom: i < filtered.length - 1 ? `1px solid rgba(255,255,255,0.05)` : 'none',
                  alignItems: 'center',
                  borderLeft: `3px solid ${m.is_upcoming ? FANTA : (resultColor[m.result] || 'transparent')}`,
                  background: i % 2 === 0 ? 'transparent' : 'rgba(255,255,255,0.02)',
                }}
              >
                <div style={{ fontFamily: 'Anton, sans-serif', fontSize: 20, color: FANTA }}>W{m.week}</div>
                <div style={{ fontSize: 12, color: MUTED }}>{fmtDate(m.date)}</div>
                <div style={{ fontSize: 13 }}>{m.time || '17:30'}</div>
                <div>
                  <div style={{ fontFamily: 'Anton, sans-serif', fontSize: 16, textTransform: 'uppercase' }}>{m.opponent}</div>
                  {m.is_upcoming && <div style={{ fontSize: 10, color: FANTA, letterSpacing: '0.1em', marginTop: 2 }}>SẮP TỚI</div>}
                </div>
                <div style={{ fontSize: 12, color: MUTED }}>{m.venue}</div>
                <div style={{ fontFamily: 'Anton, sans-serif', fontSize: 18 }}>{m.score || (m.is_upcoming ? '—' : `${m.goals_for}-${m.goals_against}`)}</div>
                <div>
                  {m.result ? (
                    <div style={{ width: 28, height: 28, background: resultColor[m.result] || '#555', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'Anton, sans-serif', fontSize: 14 }}>
                      {m.result}
                    </div>
                  ) : (
                    <span style={{ color: MUTED, fontSize: 12 }}>—</span>
                  )}
                </div>
                <div style={{ display: 'flex', gap: 6 }}>
                  <button
                    onClick={() => openEdit(m)}
                    style={{ background: 'rgba(255,107,26,0.12)', color: FANTA, border: `1px solid ${FANTA}33`, padding: '6px 12px', fontFamily: 'Anton, sans-serif', fontSize: 11, letterSpacing: '0.06em', textTransform: 'uppercase', cursor: 'pointer' }}
                  >
                    Sửa
                  </button>
                  <button
                    onClick={() => handleDelete(m.id)}
                    disabled={deleting === m.id}
                    style={{ background: 'rgba(204,68,68,0.1)', color: '#cc4444', border: '1px solid rgba(204,68,68,0.3)', padding: '6px 10px', fontFamily: 'Anton, sans-serif', fontSize: 11, letterSpacing: '0.06em', textTransform: 'uppercase', cursor: 'pointer', opacity: deleting === m.id ? 0.5 : 1 }}
                  >
                    Xóa
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

export default function ScheduleManagementPage() {
  return <AdminGuard><ScheduleManagementContent /></AdminGuard>;
}
