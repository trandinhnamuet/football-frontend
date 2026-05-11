'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import AdminGuard from '../../components/AdminGuard';
import AdminHeader from '../../components/AdminHeader';
import { Player, FANTA, ROLES } from '../../lib/types';
import { api } from '../../lib/api';
import { DEFAULT_PLAYER_AVATAR_URL } from '../../lib/assets';

const BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
const BLACK = '#0a0a0a';
const CARD = '#1a1a1a';
const INK = '#f4f1ea';
const MUTED = '#a09b94';
const LINE = 'rgba(255,255,255,0.15)';

const roleColors: Record<string, string> = { GK: '#aa3333', DEF: '#2a6fdb', MID: '#1f8a5b', FWD: FANTA };

function getPassword() {
  return typeof window !== 'undefined' ? (localStorage.getItem('lffc_admin_pw') || '') : '';
}

const ALL_ROLES = ['Tự do', 'GK', 'DEF', 'MID', 'FWD'];

interface EditModalProps {
  player: Player;
  onSave: (id: number, data: Partial<Player>, file: File | null) => Promise<void>;
  onClose: () => void;
}

function EditModal({ player, onSave, onClose }: EditModalProps) {
  const [form, setForm] = useState({
    first_name: player.first_name || '',
    last_name: player.last_name || '',
    nick: player.nick || '',
    role: player.role || 'Tự do',
    boots: player.boots || 'Phải',
    joined: player.joined || new Date().getFullYear().toString(),
  });
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const set = (k: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setForm(f => ({ ...f, [k]: e.target.value }));

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0] || null;
    setFile(f);
    if (f) setPreview(URL.createObjectURL(f));
  }

  async function handleSave() {
    if (!form.first_name.trim()) { setError('Cần họ tên'); return; }
    setSaving(true);
    setError('');
    try {
      await onSave(player.id, form, file);
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
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.75)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div style={{ background: '#111', border: `1px solid ${FANTA}44`, width: '100%', maxWidth: 560, maxHeight: '90vh', overflowY: 'auto' }}>
        {/* Header */}
        <div style={{ padding: '20px 28px', borderBottom: `1px solid ${LINE}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <div style={{ fontFamily: 'Anton, sans-serif', fontSize: 22, letterSpacing: '0.04em', textTransform: 'uppercase' }}>
              #{player.num} — {player.first_name} {player.last_name}
            </div>
            <div style={{ fontSize: 12, color: MUTED, marginTop: 2 }}>Chỉnh sửa thông tin cầu thủ</div>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: MUTED, cursor: 'pointer', fontSize: 24, lineHeight: 1, padding: 4 }}>✕</button>
        </div>

        <div style={{ padding: '28px' }}>
          {/* Avatar preview + upload */}
          <div style={{ display: 'flex', gap: 20, marginBottom: 24, alignItems: 'flex-start' }}>
            <div style={{ flexShrink: 0 }}>
              {(preview || player.image_url) ? (
                <img
                  src={preview || `${BASE}${player.image_url}`}
                  alt="Avatar"
                  width={90} height={90}
                  style={{ objectFit: 'cover', clipPath: 'polygon(15% 0, 100% 0, 85% 100%, 0 100%)', display: 'block' }}
                />
              ) : (
                <img
                  src={DEFAULT_PLAYER_AVATAR_URL}
                  alt="Default Avatar"
                  width={90}
                  height={90}
                  style={{ objectFit: 'cover', clipPath: 'polygon(15% 0, 100% 0, 85% 100%, 0 100%)', display: 'block' }}
                />
              )}
            </div>
            <div style={{ flex: 1 }}>
              <label style={labelStyle}>Ảnh đại diện</label>
              <label style={{ display: 'block', background: 'rgba(255,255,255,0.06)', border: `1px dashed ${LINE}`, color: MUTED, padding: '10px 14px', fontSize: 13, cursor: 'pointer', textAlign: 'center' }}>
                {file ? `✓ ${file.name}` : '+ Chọn ảnh mới'}
                <input type="file" accept="image/*" onChange={handleFileChange} style={{ display: 'none' }} />
              </label>
              {player.image_url && !file && (
                <div style={{ fontSize: 11, color: MUTED, marginTop: 4 }}>Ảnh hiện tại: {player.image_url.split('/').pop()}</div>
              )}
            </div>
          </div>

          {/* Name fields */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
            <div>
              <label style={labelStyle}>Họ (First name) *</label>
              <input style={inputStyle} value={form.first_name} onChange={set('first_name')} placeholder="Nguyễn Văn" />
            </div>
            <div>
              <label style={labelStyle}>Tên (Last name) *</label>
              <input style={inputStyle} value={form.last_name} onChange={set('last_name')} placeholder="Hùng" />
            </div>
          </div>

          {/* Nick + Role */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
            <div>
              <label style={labelStyle}>Biệt danh</label>
              <input style={inputStyle} value={form.nick} onChange={set('nick')} placeholder="Biệt danh..." />
            </div>
            <div>
              <label style={labelStyle}>Vị trí</label>
              <select style={inputStyle} value={form.role} onChange={set('role')}>
                {ALL_ROLES.map(r => (
                  <option key={r} value={r}>{ROLES[r]?.vi || r}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Boots + Joined */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 20 }}>
            <div>
              <label style={labelStyle}>Chân thuận</label>
              <select style={inputStyle} value={form.boots} onChange={set('boots')}>
                <option value="Phải">Chân Phải</option>
                <option value="Trái">Chân Trái</option>
              </select>
            </div>
            <div>
              <label style={labelStyle}>Gia nhập năm</label>
              <input style={inputStyle} type="number" min="2019" max="2030" value={form.joined} onChange={set('joined')} />
            </div>
          </div>

          {/* Stats (read-only) */}
          <div style={{ borderTop: `1px solid ${LINE}`, paddingTop: 16, marginBottom: 20 }}>
            <div style={{ fontSize: 10, color: MUTED, letterSpacing: '0.14em', textTransform: 'uppercase', fontWeight: 700, marginBottom: 12 }}>Thống kê (đồng bộ từ Excel)</div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 8 }}>
              {[
                { label: 'Điểm', value: Math.round(player.stat_points), accent: true },
                { label: 'Bàn', value: player.stat_goals },
                { label: 'Kiến tạo', value: player.stat_assists },
                { label: 'Điểm danh', value: player.stat_attendance },
                { label: 'Trận', value: player.stat_matches },
              ].map(s => (
                <div key={s.label} style={{ textAlign: 'center', background: 'rgba(255,255,255,0.04)', padding: '10px 6px' }}>
                  <div style={{ fontFamily: 'Anton, sans-serif', fontSize: 22, color: s.accent ? FANTA : INK }}>{s.value}</div>
                  <div style={{ fontSize: 9, color: MUTED, textTransform: 'uppercase', letterSpacing: '0.08em', marginTop: 2 }}>{s.label}</div>
                </div>
              ))}
            </div>
          </div>

          {error && <div style={{ color: '#cc4444', fontSize: 13, marginBottom: 12 }}>{error}</div>}

          {/* Actions */}
          <div style={{ display: 'flex', gap: 10 }}>
            <button
              onClick={handleSave}
              disabled={saving}
              style={{ flex: 1, background: FANTA, color: BLACK, border: 'none', padding: '13px', fontFamily: 'Anton, sans-serif', fontSize: 16, letterSpacing: '0.04em', textTransform: 'uppercase', cursor: 'pointer', opacity: saving ? 0.7 : 1 }}
            >
              {saving ? '...' : 'Lưu thay đổi'}
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

function StatMini({ label, value, accent }: { label: string; value: number; accent?: boolean }) {
  return (
    <div style={{ textAlign: 'center' }}>
      <div style={{ fontFamily: 'Anton, sans-serif', fontSize: 18, color: accent ? FANTA : INK }}>{value}</div>
      <div style={{ fontSize: 9, color: MUTED, textTransform: 'uppercase', letterSpacing: '0.08em' }}>{label}</div>
    </div>
  );
}

function PlayerCard({ player, onEdit }: { player: Player; onEdit: () => void }) {
  return (
    <div style={{ background: CARD, padding: 20, position: 'relative', overflow: 'hidden', borderLeft: `4px solid ${roleColors[player.role] || FANTA}` }}>
      <div style={{ position: 'absolute', top: 8, right: 10, fontFamily: 'Anton, sans-serif', fontSize: 72, lineHeight: 0.85, color: 'rgba(255,255,255,0.04)' }}>{player.num}</div>

      <div style={{ marginBottom: 12 }}>
        {player.image_url ? (
          <img src={`${BASE}${player.image_url}`} alt={player.first_name} width={80} height={80} style={{ objectFit: 'cover', clipPath: 'polygon(15% 0, 100% 0, 85% 100%, 0 100%)' }} />
        ) : (
          <img src={DEFAULT_PLAYER_AVATAR_URL} alt="Default Avatar" width={80} height={80} style={{ objectFit: 'cover', clipPath: 'polygon(15% 0, 100% 0, 85% 100%, 0 100%)' }} />
        )}
      </div>

      <div style={{ fontFamily: 'Anton, sans-serif', fontSize: 18, letterSpacing: '0.02em', textTransform: 'uppercase' }}>{player.first_name} {player.last_name}</div>
      <div style={{ fontSize: 11, color: roleColors[player.role] || FANTA, letterSpacing: '0.14em', textTransform: 'uppercase', marginTop: 2, fontWeight: 700 }}>#{player.num} · {player.role}</div>
      <div style={{ fontSize: 12, color: MUTED, marginTop: 3, fontStyle: 'italic' }}>"{player.nick}"</div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 6, borderTop: `1px solid rgba(255,255,255,0.08)`, paddingTop: 10, marginTop: 10, marginBottom: 12 }}>
        <StatMini label="Điểm" value={Math.round(player.stat_points)} accent />
        <StatMini label="Bàn" value={player.stat_goals} />
        <StatMini label="Kiến tạo" value={player.stat_assists} />
      </div>

      <button
        onClick={onEdit}
        style={{ width: '100%', background: 'rgba(255,107,26,0.12)', color: FANTA, border: `1px solid ${FANTA}33`, padding: '8px', fontFamily: 'Anton, sans-serif', fontSize: 12, letterSpacing: '0.06em', textTransform: 'uppercase', cursor: 'pointer' }}
      >
        Chỉnh sửa
      </button>
    </div>
  );
}

function PlayerManagementContent() {
  const [players, setPlayers] = useState<Player[]>([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [syncMsg, setSyncMsg] = useState('');
  const [roleFilter, setRoleFilter] = useState('ALL');
  const [editingPlayer, setEditingPlayer] = useState<Player | null>(null);

  useEffect(() => { loadPlayers(); }, []);

  async function loadPlayers() {
    setLoading(true);
    try { setPlayers(await api.getPlayers()); }
    catch { }
    finally { setLoading(false); }
  }

  async function handleSync() {
    setSyncing(true);
    setSyncMsg('');
    try {
      const res = await api.triggerSync(true);
      setSyncMsg(res.synced ? `✓ Đã đồng bộ ${res.message}` : `→ ${res.message}`);
      if (res.synced) await loadPlayers();
    } catch (e: any) { setSyncMsg('Lỗi: ' + e.message); }
    finally { setSyncing(false); }
  }

  async function handleSavePlayer(id: number, data: Partial<Player>, file: File | null) {
    const pw = getPassword();
    await api.updatePlayer(id, data, pw);
    if (file) await api.uploadPlayerImage(id, file, pw);
    await loadPlayers();
  }

  const filtered = roleFilter === 'ALL' ? players : players.filter(p => p.role === roleFilter);

  return (
    <div style={{ background: BLACK, color: INK, minHeight: '100vh', fontFamily: '"Space Grotesk", system-ui, sans-serif' }}>
      {editingPlayer && (
        <EditModal
          player={editingPlayer}
          onSave={handleSavePlayer}
          onClose={() => setEditingPlayer(null)}
        />
      )}

      <AdminHeader />

      <main style={{ padding: '40px 48px 80px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 36 }}>
          <div>
            <div style={{ fontSize: 12, color: FANTA, letterSpacing: '0.2em', fontWeight: 700, textTransform: 'uppercase', marginBottom: 8 }}>Quản trị đội hình</div>
            <h1 style={{ fontFamily: 'Anton, sans-serif', fontSize: 56, lineHeight: 0.92, letterSpacing: '0.01em', textTransform: 'uppercase', margin: 0 }}>
              QUẢN LÝ <span style={{ color: FANTA }}>CẦU THỦ</span>
            </h1>
            <p style={{ color: MUTED, fontSize: 14, marginTop: 8 }}>Dữ liệu đồng bộ từ Excel · Ảnh và thông tin chỉnh sửa trực tiếp</p>
          </div>
          <button onClick={handleSync} disabled={syncing} style={{ background: FANTA, color: BLACK, border: 'none', padding: '14px 28px', fontFamily: 'Anton, sans-serif', fontSize: 16, letterSpacing: '0.06em', textTransform: 'uppercase', cursor: 'pointer', opacity: syncing ? 0.7 : 1 }}>
            {syncing ? 'Đang đồng bộ...' : '↻ ĐỒNG BỘ EXCEL'}
          </button>
        </div>

        {syncMsg && (
          <div style={{ marginBottom: 20, padding: '12px 20px', background: syncMsg.startsWith('✓') ? 'rgba(31,138,91,0.15)' : 'rgba(255,107,26,0.1)', border: `1px solid ${syncMsg.startsWith('✓') ? '#1f8a5b' : FANTA}44`, color: INK, fontSize: 14 }}>
            {syncMsg}
          </div>
        )}

        <div style={{ display: 'flex', gap: 8, marginBottom: 28 }}>
          {['ALL', 'Tự do', 'GK', 'DEF', 'MID', 'FWD'].map(r => (
            <button key={r} onClick={() => setRoleFilter(r)} style={{
              background: roleFilter === r ? INK : 'rgba(255,255,255,0.05)',
              color: roleFilter === r ? BLACK : INK,
              border: `1px solid ${roleFilter === r ? INK : LINE}`,
              padding: '8px 16px', fontSize: 12, letterSpacing: '0.06em', cursor: 'pointer', fontFamily: 'inherit', fontWeight: 600, textTransform: 'uppercase',
            }}>
              {r === 'ALL' ? `Tất cả (${players.length})` : `${r} (${players.filter(p => p.role === r).length})`}
            </button>
          ))}
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: 60, color: MUTED, fontFamily: 'Anton, sans-serif', fontSize: 24 }}>Đang tải...</div>
        ) : filtered.length === 0 ? (
          <div style={{ textAlign: 'center', padding: 60, background: CARD, borderLeft: `4px solid ${FANTA}` }}>
            <div style={{ fontFamily: 'Anton, sans-serif', fontSize: 24, color: MUTED, textTransform: 'uppercase' }}>
              Chưa có dữ liệu. Nhấn "Đồng bộ Excel" để tải dữ liệu.
            </div>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 16 }}>
            {filtered.map(p => (
              <PlayerCard key={p.id} player={p} onEdit={() => setEditingPlayer(p)} />
            ))}
          </div>
        )}
      </main>
    </div>
  );
}

export default function PlayerManagementPage() {
  return <AdminGuard><PlayerManagementContent /></AdminGuard>;
}
