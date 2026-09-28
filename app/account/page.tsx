'use client';

import { useState } from 'react';
import Link from 'next/link';
import Header from '../components/Header';
import Footer from '../components/Footer';
import RequireAuth from '../components/RequireAuth';
import { useAuth } from '../contexts/AuthContext';
import { useApp } from '../contexts/AppContext';
import { api, ApiError } from '../lib/api';
import { FANTA, ROLES, fmtDate } from '../lib/types';

const BLACK = 'var(--bg)';
const CARD = 'var(--card)';
const INK = 'var(--ink)';
const MUTED = 'var(--muted)';
const LINE = 'var(--line)';
// Text sitting on a FANTA-orange fill stays dark in both themes.
const ON_FANTA = '#0a0a0a';

function ChangePasswordForm() {
  const { setSession } = useAuth();
  const { t } = useApp();
  const [current, setCurrent] = useState('');
  const [next, setNext] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState('');
  const [done, setDone] = useState('');
  const [busy, setBusy] = useState(false);

  async function submit() {
    setError('');
    setDone('');
    if (next.length < 6) { setError(t('auth.tooShort')); return; }
    if (next !== confirm) { setError(t('auth.mismatch')); return; }
    setBusy(true);
    try {
      const res = await api.changePassword(current, next);
      setSession(res.token, res.user);
      setCurrent(''); setNext(''); setConfirm('');
      setDone(t('auth.changed'));
    } catch (e) {
      if (e instanceof ApiError && e.status === 401) setError(t('auth.wrongCurrent'));
      else setError(e instanceof Error ? e.message : t('auth.serverError'));
    } finally {
      setBusy(false);
    }
  }

  const inputStyle: React.CSSProperties = { width: '100%', background: 'var(--input-bg)', border: `1px solid ${LINE}`, color: INK, padding: '12px 14px', fontSize: 15, fontFamily: 'inherit', outline: 'none', boxSizing: 'border-box' };
  const labelStyle: React.CSSProperties = { fontSize: 11, color: MUTED, letterSpacing: '0.14em', textTransform: 'uppercase', fontWeight: 600, display: 'block', marginBottom: 6 };

  return (
    <div style={{ background: CARD, padding: 28, border: `1px solid ${LINE}` }}>
      <div style={{ fontFamily: 'Anton, sans-serif', fontSize: 22, textTransform: 'uppercase', color: FANTA, marginBottom: 20 }}>{t('auth.changePassword')}</div>
      <div style={{ display: 'grid', gap: 14 }}>
        <div>
          <label style={labelStyle}>{t('auth.currentPassword')}</label>
          <input type="password" autoComplete="current-password" style={inputStyle} value={current} onChange={e => setCurrent(e.target.value)} />
        </div>
        <div>
          <label style={labelStyle}>{t('auth.newPassword')}</label>
          <input type="password" autoComplete="new-password" style={inputStyle} value={next} onChange={e => setNext(e.target.value)} />
        </div>
        <div>
          <label style={labelStyle}>{t('auth.confirmPassword')}</label>
          <input type="password" autoComplete="new-password" style={inputStyle} value={confirm} onChange={e => setConfirm(e.target.value)} onKeyDown={e => e.key === 'Enter' && submit()} />
        </div>
      </div>
      {error && <div style={{ color: '#cc4444', fontSize: 13, marginTop: 10 }}>{error}</div>}
      {done && <div style={{ color: '#1f8a5b', fontSize: 13, marginTop: 10 }}>✓ {done}</div>}
      <button
        onClick={submit}
        disabled={busy}
        style={{ marginTop: 18, background: FANTA, color: ON_FANTA, border: 'none', padding: '12px 26px', fontFamily: 'Anton, sans-serif', fontSize: 16, letterSpacing: '0.06em', textTransform: 'uppercase', cursor: 'pointer', opacity: busy ? 0.6 : 1 }}
      >
        {busy ? '...' : t('auth.save')}
      </button>
    </div>
  );
}

function AccountContent() {
  const { user, logout } = useAuth();
  const { t, lang } = useApp();
  if (!user) return null;
  const p = user.player;
  const roleLabel = p?.role ? (ROLES[p.role]?.[lang] || p.role) : '';

  return (
    <div style={{ background: BLACK, color: INK, fontFamily: '"Space Grotesk", system-ui, sans-serif', minHeight: '100vh' }}>
      <Header />
      <main className="mob-p-main" style={{ maxWidth: 1000, margin: '0 auto', padding: '48px 48px 80px' }}>
        <div style={{ fontSize: 12, color: FANTA, letterSpacing: '0.2em', fontWeight: 700, textTransform: 'uppercase', marginBottom: 24 }}>
          <Link href="/" style={{ color: MUTED, textDecoration: 'none' }}>{t('auth.backHome')}</Link>
          {' '}/ {t('auth.account')}
        </div>
        <h1 style={{ fontFamily: 'Anton, sans-serif', fontSize: 'clamp(44px, 6vw, 72px)', lineHeight: 0.95, letterSpacing: '0.01em', textTransform: 'uppercase', margin: '0 0 32px' }}>
          {user.display_name || user.username}
        </h1>

        {user.is_default_password && (
          <div style={{ background: 'rgba(224,160,32,0.12)', border: '1px solid rgba(224,160,32,0.5)', borderLeft: '4px solid #e0a020', padding: '14px 18px', marginBottom: 24, fontSize: 14, lineHeight: 1.5 }}>
            ⚠️ {t('auth.defaultWarning')}
          </div>
        )}

        <div className="mob-grid-1" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, alignItems: 'start' }}>
          <div style={{ background: CARD, padding: 28, border: `1px solid ${LINE}` }}>
            <div style={{ fontFamily: 'Anton, sans-serif', fontSize: 22, textTransform: 'uppercase', color: FANTA, marginBottom: 20 }}>{t('auth.account')}</div>
            <dl style={{ margin: 0, display: 'grid', gridTemplateColumns: 'auto 1fr', gap: '10px 18px', fontSize: 14 }}>
              <dt style={{ color: MUTED, textTransform: 'uppercase', letterSpacing: '0.1em', fontSize: 11, fontWeight: 600, alignSelf: 'center' }}>{t('auth.username')}</dt>
              <dd style={{ margin: 0, fontFamily: 'monospace', fontSize: 15 }}>{user.username}</dd>
              {p && (<>
                <dt style={{ color: MUTED, textTransform: 'uppercase', letterSpacing: '0.1em', fontSize: 11, fontWeight: 600, alignSelf: 'center' }}>{t('auth.player')}</dt>
                <dd style={{ margin: 0 }}>#{p.num} · {p.first_name} {p.last_name}{roleLabel ? ` · ${roleLabel}` : ''}</dd>
              </>)}
              <dt style={{ color: MUTED, textTransform: 'uppercase', letterSpacing: '0.1em', fontSize: 11, fontWeight: 600, alignSelf: 'center' }}>{t('auth.lastLogin')}</dt>
              <dd style={{ margin: 0 }}>{user.last_login_at ? fmtDate(user.last_login_at) : '—'}</dd>
            </dl>
            <div style={{ display: 'flex', gap: 12, marginTop: 24, flexWrap: 'wrap' }}>
              <Link href="/dashboard" style={{ background: FANTA, color: ON_FANTA, textDecoration: 'none', padding: '10px 20px', fontFamily: 'Anton, sans-serif', fontSize: 15, letterSpacing: '0.06em', textTransform: 'uppercase' }}>
                ▶ Dashboard
              </Link>
              <button onClick={logout} style={{ background: 'transparent', color: MUTED, border: `1px solid ${LINE}`, padding: '10px 20px', fontFamily: 'Anton, sans-serif', fontSize: 15, letterSpacing: '0.06em', textTransform: 'uppercase', cursor: 'pointer' }}>
                {t('nav.logout')}
              </button>
            </div>
          </div>
          <ChangePasswordForm />
        </div>
      </main>
      <Footer />
    </div>
  );
}

export default function AccountPage() {
  return <RequireAuth><AccountContent /></RequireAuth>;
}
