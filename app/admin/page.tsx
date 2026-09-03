'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import AdminGuard from '../components/AdminGuard';
import { FANTA, Match, fmtDate, matchesMissingResult } from '../lib/types';
import { api } from '../lib/api';
import { adminSections } from '../lib/adminNav';
import { useApp } from '../contexts/AppContext';

const BLACK = 'var(--bg)';
const CARD = 'var(--card)';
const INK = 'var(--ink)';
const MUTED = 'var(--muted)';
const LINE = 'var(--line)';
// Text sitting on a FANTA-orange fill stays dark in both themes.
const ON_FANTA = '#0a0a0a';

function getPassword() {
  return typeof window !== 'undefined' ? (localStorage.getItem('lffc_admin_pw') || '') : '';
}

// Sets the site-wide default theme. Bumps a version on the server so every
// visitor gets this theme once on their next visit (overriding their saved
// localStorage choice that one time only).
function ThemeDefaultControl() {
  const { setTheme } = useApp();
  const [theme, setThemeLocal] = useState<'dark' | 'light' | null>(null);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState('');

  useEffect(() => {
    api.getThemeSetting().then(({ theme }) => setThemeLocal(theme)).catch(() => {});
  }, []);

  async function apply(next: 'dark' | 'light') {
    setSaving(true);
    setMsg('');
    try {
      const res = await api.setThemeSetting(next, getPassword());
      setThemeLocal(res.theme);
      // Reflect on the admin's own screen immediately and mark this version as
      // already applied so they aren't re-forced on the next reload.
      setTheme(res.theme);
      localStorage.setItem('lffc_theme_force_version', String(res.version));
      setMsg(`✓ Mặc định toàn site: ${res.theme === 'dark' ? 'Tối' : 'Sáng'} (sẽ áp dụng cho mọi người ở lần truy cập tới)`);
      setTimeout(() => setMsg(''), 5000);
    } catch (e: any) {
      setMsg('Lỗi: ' + (e.message || 'không lưu được'));
    } finally {
      setSaving(false);
    }
  }

  const btn = (mode: 'dark' | 'light', label: string, icon: string) => {
    const active = theme === mode;
    return (
      <button
        onClick={() => apply(mode)}
        disabled={saving || active}
        style={{
          background: active ? FANTA : 'transparent',
          color: active ? ON_FANTA : INK,
          border: `1px solid ${active ? FANTA : 'var(--line)'}`,
          padding: '8px 18px', fontFamily: 'Anton, sans-serif', fontSize: 14,
          letterSpacing: '0.04em', textTransform: 'uppercase',
          cursor: active ? 'default' : 'pointer', opacity: saving && !active ? 0.6 : 1,
        }}
      >
        {icon} {label}
      </button>
    );
  };

  return (
    <div style={{ background: CARD, border: `1px solid ${FANTA}33`, borderLeft: `4px solid ${FANTA}`, padding: '18px 22px', marginBottom: 40 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16 }}>
        <div>
          <div style={{ fontFamily: 'Anton, sans-serif', fontSize: 18, color: FANTA, letterSpacing: '0.04em', textTransform: 'uppercase' }}>
            🌓 Giao diện mặc định
          </div>
          <p style={{ color: MUTED, fontSize: 13, margin: '6px 0 0', maxWidth: 560 }}>
            Đặt chế độ Tối/Sáng mặc định cho toàn bộ người dùng. Mỗi lần đổi sẽ áp dụng một lần cho mọi người ở lần truy cập kế tiếp; sau đó họ vẫn tự đổi và lưu lựa chọn riêng.
          </p>
        </div>
        <div style={{ display: 'flex', gap: 10, flexShrink: 0 }}>
          {btn('dark', 'Tối', '🌙')}
          {btn('light', 'Sáng', '☀️')}
        </div>
      </div>
      {msg && (
        <div style={{ marginTop: 14, padding: '10px 14px', background: msg.startsWith('✓') ? 'rgba(31,138,91,0.15)' : 'rgba(255,50,50,0.1)', border: `1px solid ${msg.startsWith('✓') ? '#1f8a5b' : '#cc4444'}44`, fontSize: 13, color: INK }}>
          {msg}
        </div>
      )}
    </div>
  );
}

// Matches whose date has passed but whose score nobody filled in yet. The Excel
// sync only writes a result once the score cell in the sheet is filled, so a
// match stays listed here until someone enters the score — in the sheet (then
// hit sync) or by hand in Quản lý lịch thi đấu.
function PendingResultsNotice() {
  const [pending, setPending] = useState<Match[] | null>(null);
  const [syncing, setSyncing] = useState(false);
  const [msg, setMsg] = useState('');

  async function load() {
    try {
      setPending(matchesMissingResult(await api.getMatches()));
    } catch {
      setPending([]);
    }
  }

  useEffect(() => { load(); }, []);

  async function handleSync() {
    setSyncing(true);
    setMsg('');
    try {
      const res = await api.triggerSync(true);
      setMsg(res.message || (res.synced ? 'Đã đồng bộ' : 'Dữ liệu không thay đổi'));
      await load();
    } catch (e: any) {
      setMsg('Lỗi đồng bộ: ' + (e.message || ''));
    } finally {
      setSyncing(false);
      setTimeout(() => setMsg(''), 6000);
    }
  }

  // Nothing to nag about (or still loading) — stay out of the way.
  if (!pending || pending.length === 0) return null;

  const WARN = '#e0a020';

  return (
    <div style={{ background: CARD, border: `1px solid ${WARN}55`, borderLeft: `4px solid ${WARN}`, padding: '18px 22px', marginBottom: 24 }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16 }}>
        <div style={{ minWidth: 260, flex: 1 }}>
          <div style={{ fontFamily: 'Anton, sans-serif', fontSize: 18, color: WARN, letterSpacing: '0.04em', textTransform: 'uppercase' }}>
            ⚠️ {pending.length} trận đã thi đấu nhưng chưa có kết quả
          </div>
          <p style={{ color: MUTED, fontSize: 13, margin: '6px 0 0', maxWidth: 620 }}>
            Các trận này đã qua ngày thi đấu và đang hiện ở cột “Kết quả gần đây” trên trang chủ với nhãn “Chờ kết quả”.
            Nhập tỷ số vào Google Sheet rồi bấm “Đồng bộ từ Excel”, hoặc sửa trực tiếp trong Quản lý lịch thi đấu.
          </p>
        </div>
        <div style={{ display: 'flex', gap: 10, flexShrink: 0, flexWrap: 'wrap' }}>
          <button
            onClick={handleSync}
            disabled={syncing}
            style={{
              background: 'transparent', color: WARN, border: `1px solid ${WARN}`,
              padding: '8px 18px', fontFamily: 'Anton, sans-serif', fontSize: 14,
              letterSpacing: '0.04em', textTransform: 'uppercase',
              cursor: syncing ? 'default' : 'pointer', opacity: syncing ? 0.6 : 1,
            }}
          >
            {syncing ? 'Đang đồng bộ...' : '⟳ Đồng bộ từ Excel'}
          </button>
          <Link
            href="/admin/schedule-management"
            style={{
              background: FANTA, color: ON_FANTA, textDecoration: 'none',
              padding: '8px 18px', fontFamily: 'Anton, sans-serif', fontSize: 14,
              letterSpacing: '0.04em', textTransform: 'uppercase',
            }}
          >
            Nhập kết quả →
          </Link>
        </div>
      </div>

      <ul style={{ margin: '14px 0 0', padding: 0, listStyle: 'none', display: 'grid', gap: 6 }}>
        {pending.map(m => (
          <li key={m.id} style={{ display: 'flex', alignItems: 'baseline', gap: 10, fontSize: 13, color: INK, flexWrap: 'wrap' }}>
            <span style={{ fontFamily: 'Anton, sans-serif', fontSize: 14, color: WARN, minWidth: 34 }}>W{m.week}</span>
            <span style={{ color: MUTED, minWidth: 84 }}>{fmtDate(m.date)}</span>
            <span style={{ fontFamily: 'Anton, sans-serif', fontSize: 14, textTransform: 'uppercase' }}>{m.opponent}</span>
          </li>
        ))}
      </ul>

      {msg && (
        <div style={{ marginTop: 14, padding: '10px 14px', background: 'var(--hover-bg)', border: `1px solid ${LINE}`, fontSize: 13, color: INK }}>
          {msg}
        </div>
      )}
    </div>
  );
}

export default function AdminPage() {
  return (
    <AdminGuard>
      <div style={{ background: BLACK, color: INK, fontFamily: '"Space Grotesk", system-ui, sans-serif', minHeight: '100vh' }}>
        <header style={{ padding: '48px 48px 0', borderBottom: `1px solid ${FANTA}33` }}>
          <div style={{ marginBottom: 48 }}>
            <h1 style={{ fontFamily: 'Anton, sans-serif', fontSize: 'clamp(48px, 8vw, 96px)', lineHeight: 0.92, letterSpacing: '0.01em', textTransform: 'uppercase', margin: 0 }}>
              QUẢN LÝ <span style={{ color: FANTA }}>ADMIN</span>
            </h1>
            <p style={{ color: MUTED, fontSize: 15, marginTop: 26 }}>Tổng hợp các công cụ quản lý dữ liệu đội bóng</p>
          </div>
        </header>

        <main style={{ padding: '48px' }}>
          <PendingResultsNotice />
          <ThemeDefaultControl />
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(380px, 1fr))', gap: 24 }}>
            {adminSections.map((section) => (
              <Link
                key={section.href}
                href={section.href}
                style={{
                  textDecoration: 'none',
                  color: 'inherit',
                  display: 'block',
                  background: CARD,
                  border: `2px solid ${FANTA}44`,
                  padding: 32,
                  transition: 'all 0.3s ease',
                  cursor: 'pointer',
                }}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLElement).style.borderColor = FANTA + 'cc';
                  (e.currentTarget as HTMLElement).style.boxShadow = `0 8px 24px ${FANTA}22`;
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLElement).style.borderColor = FANTA + '44';
                  (e.currentTarget as HTMLElement).style.boxShadow = 'none';
                }}
              >
                {/* Header with icon and title */}
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: 16, marginBottom: 16 }}>
                  <div style={{ fontSize: 40 }}>{section.icon}</div>
                  <div style={{ flex: 1 }}>
                    <h2 style={{ fontFamily: 'Anton, sans-serif', fontSize: 24, letterSpacing: '0.02em', textTransform: 'uppercase', margin: 0, color: FANTA }}>
                      {section.title}
                    </h2>
                  </div>
                </div>

                {/* Description */}
                <p style={{ color: MUTED, fontSize: 14, lineHeight: 1.6, margin: '0 0 20px 0' }}>
                  {section.description}
                </p>

                {/* Features list */}
                <div style={{ marginTop: 20, paddingTop: 20, borderTop: `1px solid ${FANTA}33` }}>
                  <div style={{ fontSize: 11, color: FANTA, letterSpacing: '0.12em', textTransform: 'uppercase', fontWeight: 700, marginBottom: 12 }}>
                    Chức năng chính:
                  </div>
                  <ul style={{ margin: 0, padding: '0 0 0 20px', listStyle: 'none' }}>
                    {section.features.map((feature, i) => (
                      <li
                        key={i}
                        style={{
                          fontSize: 13,
                          color: INK,
                          lineHeight: 1.6,
                          marginBottom: 8,
                          position: 'relative',
                          paddingLeft: 12,
                        }}
                      >
                        <span style={{ position: 'absolute', left: 0, color: FANTA, fontWeight: 700 }}>•</span>
                        {feature}
                      </li>
                    ))}
                  </ul>
                </div>

                {/* CTA Button */}
                <div style={{ marginTop: 24, paddingTop: 20, borderTop: `1px solid ${FANTA}33` }}>
                  <div
                    style={{
                      display: 'inline-block',
                      background: FANTA,
                      color: ON_FANTA,
                      padding: '10px 20px',
                      fontFamily: 'Anton, sans-serif',
                      fontSize: 14,
                      letterSpacing: '0.08em',
                      textTransform: 'uppercase',
                      fontWeight: 700,
                    }}
                  >
                    Mở → 
                  </div>
                </div>
              </Link>
            ))}
          </div>

          {/* Info section */}
          <div
            style={{
              marginTop: 64,
              padding: 32,
              background: CARD,
              border: `1px solid ${FANTA}33`,
              borderLeft: `4px solid ${FANTA}`,
            }}
          >
            <h3 style={{ fontFamily: 'Anton, sans-serif', fontSize: 20, color: FANTA, letterSpacing: '0.04em', textTransform: 'uppercase', margin: '0 0 12px 0' }}>
              💡 Ghi chú
            </h3>
            <ul style={{ margin: 0, padding: '0 0 0 20px', color: MUTED, fontSize: 14, lineHeight: 1.8 }}>
              <li>Tất cả thay đổi được lưu trực tiếp vào cơ sở dữ liệu</li>
              <li>Có thể cập nhật dữ liệu từ file Excel thông qua tính năng đồng bộ</li>
              <li>Cần nhập mật khẩu quản trị để thực hiện các thay đổi</li>
              <li>Tất cả dữ liệu sẽ được hiển thị trên trang chủ sau khi cập nhật</li>
            </ul>
          </div>
        </main>
      </div>
    </AdminGuard>
  );
}
