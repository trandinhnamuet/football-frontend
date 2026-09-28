'use client';

import { useEffect, useState } from 'react';
import AdminGuard from '../../components/AdminGuard';
import AdminHeader from '../../components/AdminHeader';
import { AuthUser, FANTA } from '../../lib/types';
import { api } from '../../lib/api';

const BLACK = 'var(--bg)';
const CARD = 'var(--card)';
const INK = 'var(--ink)';
const MUTED = 'var(--muted)';
const LINE = 'var(--line)';
// Text sitting on a FANTA-orange fill stays dark in both themes.
const ON_FANTA = '#0a0a0a';
const DEFAULT_PASSWORD = '123123123';

function getPassword() {
  return typeof window !== 'undefined' ? (localStorage.getItem('lffc_admin_pw') || '') : '';
}

function fmtDateTime(iso: string | null) {
  if (!iso) return '—';
  const d = new Date(iso);
  return `${d.getDate().toString().padStart(2, '0')}.${(d.getMonth() + 1).toString().padStart(2, '0')}.${d.getFullYear()} ${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}`;
}

function AccountsContent() {
  const [accounts, setAccounts] = useState<AuthUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState<number | 'sync' | null>(null);
  const [msg, setMsg] = useState('');
  const [filter, setFilter] = useState('');

  async function load() {
    setLoading(true);
    try { setAccounts(await api.getAccounts(getPassword())); }
    catch { setMsg('Không tải được danh sách tài khoản'); }
    finally { setLoading(false); }
  }

  useEffect(() => { load(); }, []);

  function flash(text: string) {
    setMsg(text);
    setTimeout(() => setMsg(''), 5000);
  }

  async function sync() {
    setBusy('sync');
    try {
      const r = await api.syncAccounts(getPassword());
      flash(r.created > 0 ? `✓ Đã tạo ${r.created} tài khoản mới (mật khẩu ${DEFAULT_PASSWORD})` : '✓ Mọi cầu thủ đều đã có tài khoản');
      await load();
    } catch { flash('Lỗi khi tạo tài khoản'); }
    finally { setBusy(null); }
  }

  async function resetDefault(a: AuthUser) {
    if (!confirm(`Đặt lại mật khẩu của "${a.username}" về ${DEFAULT_PASSWORD}?`)) return;
    setBusy(a.id);
    try { await api.resetAccountPassword(a.id, getPassword()); flash(`✓ Đã reset mật khẩu ${a.username} về mặc định`); await load(); }
    catch { flash('Reset thất bại'); }
    finally { setBusy(null); }
  }

  async function setCustom(a: AuthUser) {
    const pw = prompt(`Mật khẩu mới cho "${a.username}" (ít nhất 6 ký tự):`);
    if (!pw) return;
    if (pw.length < 6) { flash('Mật khẩu cần ít nhất 6 ký tự'); return; }
    setBusy(a.id);
    try { await api.resetAccountPassword(a.id, getPassword(), pw); flash(`✓ Đã đặt mật khẩu mới cho ${a.username}`); await load(); }
    catch (e) { flash(e instanceof Error ? e.message : 'Đặt mật khẩu thất bại'); }
    finally { setBusy(null); }
  }

  async function rename(a: AuthUser) {
    const u = prompt(`Tên đăng nhập mới cho "${a.display_name || a.username}" (a-z, 0-9, . _):`, a.username);
    if (!u || u === a.username) return;
    setBusy(a.id);
    try { await api.updateAccount(a.id, { username: u }, getPassword()); flash(`✓ Đã đổi tên đăng nhập thành ${u.toLowerCase()}`); await load(); }
    catch (e) { flash(e instanceof Error ? e.message : 'Đổi tên thất bại'); }
    finally { setBusy(null); }
  }

  async function toggleActive(a: AuthUser) {
    setBusy(a.id);
    try { await api.updateAccount(a.id, { is_active: !a.is_active }, getPassword()); await load(); }
    catch { flash('Cập nhật thất bại'); }
    finally { setBusy(null); }
  }

  const q = filter.trim().toLowerCase();
  const shown = q
    ? accounts.filter(a => a.username.includes(q) || (a.display_name || '').toLowerCase().includes(q) || String(a.player?.num ?? '').includes(q))
    : accounts;
  const defaultCount = accounts.filter(a => a.is_default_password).length;

  const smallBtn = (label: string, onClick: () => void, color = FANTA, disabled = false): React.ReactNode => (
    <button
      onClick={onClick}
      disabled={disabled}
      style={{ background: 'transparent', color, border: `1px solid ${color}55`, padding: '6px 12px', fontFamily: 'Anton, sans-serif', fontSize: 12, letterSpacing: '0.06em', textTransform: 'uppercase', cursor: disabled ? 'default' : 'pointer', opacity: disabled ? 0.5 : 1, whiteSpace: 'nowrap' }}
    >
      {label}
    </button>
  );

  return (
    <div style={{ background: BLACK, color: INK, minHeight: '100vh', fontFamily: '"Space Grotesk", system-ui, sans-serif' }}>
      <AdminHeader />
      <main style={{ padding: '40px 48px 80px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 28, flexWrap: 'wrap', gap: 16 }}>
          <div>
            <div style={{ fontSize: 12, color: FANTA, letterSpacing: '0.2em', fontWeight: 700, textTransform: 'uppercase', marginBottom: 16 }}>Quản trị</div>
            <h1 style={{ fontFamily: 'Anton, sans-serif', fontSize: 56, lineHeight: 0.92, letterSpacing: '0.01em', textTransform: 'uppercase', margin: 0 }}>
              TÀI KHOẢN <span style={{ color: FANTA }}>CẦU THỦ</span>
            </h1>
            <div style={{ fontSize: 13, color: MUTED, marginTop: 14 }}>
              {accounts.length} tài khoản · {defaultCount} còn dùng mật khẩu mặc định ({DEFAULT_PASSWORD})
            </div>
          </div>
          <button
            onClick={sync}
            disabled={busy === 'sync'}
            style={{ background: FANTA, color: ON_FANTA, border: 'none', padding: '14px 28px', fontFamily: 'Anton, sans-serif', fontSize: 16, letterSpacing: '0.06em', textTransform: 'uppercase', cursor: 'pointer', opacity: busy === 'sync' ? 0.6 : 1 }}
          >
            {busy === 'sync' ? 'Đang tạo...' : '+ Tạo tài khoản cho cầu thủ chưa có'}
          </button>
        </div>

        <div style={{ background: CARD, borderLeft: `4px solid ${FANTA}`, padding: '14px 18px', marginBottom: 20, fontSize: 13, color: MUTED, lineHeight: 1.6 }}>
          Tên đăng nhập = họ tên viết liền không dấu (vd: <span style={{ color: INK, fontFamily: 'monospace' }}>ngothanhtuan</span>). Tài khoản tự tạo mỗi khi backend khởi động cho cầu thủ mới; cũng có thể bấm nút bên trên. Đổi tên cầu thủ không đổi tên đăng nhập.
        </div>

        {msg && (
          <div style={{ marginBottom: 16, padding: '10px 14px', background: msg.startsWith('✓') ? 'rgba(31,138,91,0.15)' : 'rgba(204,68,68,0.1)', border: `1px solid ${msg.startsWith('✓') ? '#1f8a5b' : '#cc4444'}55`, fontSize: 13 }}>
            {msg}
          </div>
        )}

        <input
          value={filter}
          onChange={e => setFilter(e.target.value)}
          placeholder="Tìm theo tên, tên đăng nhập, số áo..."
          style={{ width: '100%', maxWidth: 420, background: 'var(--input-bg)', border: `1px solid ${LINE}`, color: INK, padding: '10px 14px', fontSize: 14, fontFamily: 'inherit', outline: 'none', boxSizing: 'border-box', marginBottom: 20 }}
        />

        {loading ? (
          <div style={{ textAlign: 'center', padding: 60, color: MUTED, fontFamily: 'Anton, sans-serif', fontSize: 24 }}>Đang tải...</div>
        ) : shown.length === 0 ? (
          <div style={{ textAlign: 'center', padding: 60, background: CARD, borderLeft: `4px solid ${FANTA}` }}>
            <div style={{ fontFamily: 'Anton, sans-serif', fontSize: 28, color: MUTED, textTransform: 'uppercase' }}>Chưa có tài khoản nào</div>
          </div>
        ) : (
          <div style={{ display: 'grid', gap: 10 }}>
            {shown.map(a => (
              <div key={a.id} style={{ background: CARD, padding: '16px 22px', display: 'grid', gridTemplateColumns: '1fr auto', gap: 16, alignItems: 'center', borderLeft: `4px solid ${a.is_active ? FANTA : LINE}`, opacity: a.is_active ? 1 : 0.6 }}>
                <div style={{ minWidth: 0 }}>
                  <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap', marginBottom: 4 }}>
                    <span style={{ fontFamily: 'monospace', fontSize: 16, color: FANTA }}>{a.username}</span>
                    {a.player && <span style={{ fontSize: 12, color: MUTED }}>#{a.player.num}</span>}
                    {!a.is_active && <span style={{ background: LINE, color: MUTED, padding: '1px 8px', fontSize: 11, fontFamily: 'Anton, sans-serif', letterSpacing: '0.08em', textTransform: 'uppercase' }}>Đã khoá</span>}
                    {a.is_default_password
                      ? <span style={{ border: '1px solid #e0a02066', color: '#e0a020', padding: '1px 8px', fontSize: 11, fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase' }}>MK mặc định</span>
                      : <span style={{ border: '1px solid #1f8a5b66', color: '#1f8a5b', padding: '1px 8px', fontSize: 11, fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase' }}>Đã đổi MK</span>}
                  </div>
                  <div style={{ fontFamily: 'Anton, sans-serif', fontSize: 18, letterSpacing: '0.01em', textTransform: 'uppercase' }}>{a.display_name || '—'}</div>
                  <div style={{ fontSize: 12, color: MUTED, marginTop: 2 }}>Đăng nhập gần nhất: {fmtDateTime(a.last_login_at)}</div>
                </div>
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', justifyContent: 'flex-end' }}>
                  {smallBtn('Reset MK', () => resetDefault(a), FANTA, busy === a.id)}
                  {smallBtn('Đặt MK', () => setCustom(a), FANTA, busy === a.id)}
                  {smallBtn('Đổi tên ĐN', () => rename(a), INK, busy === a.id)}
                  {smallBtn(a.is_active ? 'Khoá' : 'Mở khoá', () => toggleActive(a), a.is_active ? '#cc4444' : '#1f8a5b', busy === a.id)}
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}

export default function AccountsPage() {
  return <AdminGuard><AccountsContent /></AdminGuard>;
}
