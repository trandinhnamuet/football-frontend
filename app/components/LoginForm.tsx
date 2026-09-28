'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../contexts/AuthContext';
import { useApp } from '../contexts/AppContext';
import { FANTA } from '../lib/types';
import { ApiError } from '../lib/api';

const CARD = 'var(--card)';
const INK = 'var(--ink)';
const MUTED = 'var(--muted)';
const LINE = 'var(--line)';
// Text sitting on a FANTA-orange fill stays dark in both themes.
const ON_FANTA = '#0a0a0a';

interface Props {
  /** Đăng nhập xong chuyển tới đâu; bỏ trống thì đứng yên (guard tự render nội dung). */
  next?: string;
  title?: string;
  hint?: string;
}

export default function LoginForm({ next, title, hint }: Props) {
  const { login } = useAuth();
  const { t } = useApp();
  const router = useRouter();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  async function submit() {
    if (!username.trim() || !password) { setError(t('auth.missing')); return; }
    setBusy(true);
    setError('');
    try {
      await login(username, password);
      if (next) router.push(next);
    } catch (e) {
      if (e instanceof ApiError && e.status === 401) setError(t('auth.invalid'));
      else setError(t('auth.serverError'));
    } finally {
      setBusy(false);
    }
  }

  const inputStyle: React.CSSProperties = {
    width: '100%', background: 'var(--input-bg)', border: `1px solid ${LINE}`, color: INK,
    padding: '14px 16px', fontSize: 16, fontFamily: 'inherit', outline: 'none', boxSizing: 'border-box',
  };
  const labelStyle: React.CSSProperties = {
    fontSize: 11, color: MUTED, letterSpacing: '0.14em', textTransform: 'uppercase', fontWeight: 600, display: 'block', marginBottom: 6,
  };

  return (
    <div style={{ background: CARD, padding: '40px', width: '100%', maxWidth: 420, border: `1px solid ${FANTA}`, boxSizing: 'border-box' }}>
      <div style={{ fontFamily: 'Anton, sans-serif', fontSize: 36, color: INK, textTransform: 'uppercase', lineHeight: 1, marginBottom: 8 }}>
        {title || t('auth.loginTitle')}
      </div>
      <div style={{ color: MUTED, fontSize: 13, lineHeight: 1.5, marginBottom: 28 }}>{hint || t('auth.loginHint')}</div>

      <div style={{ display: 'grid', gap: 16 }}>
        <div>
          <label style={labelStyle}>{t('auth.username')}</label>
          <input
            style={inputStyle}
            value={username}
            autoComplete="username"
            autoCapitalize="none"
            onChange={e => setUsername(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && submit()}
            placeholder="vd: ngothanhtuan"
          />
        </div>
        <div>
          <label style={labelStyle}>{t('auth.password')}</label>
          <input
            type="password"
            style={{ ...inputStyle, borderColor: error ? '#cc3333' : LINE }}
            value={password}
            autoComplete="current-password"
            onChange={e => setPassword(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && submit()}
            placeholder="••••••••"
          />
        </div>
      </div>

      {error && <div style={{ color: '#cc4444', fontSize: 13, marginTop: 10 }}>{error}</div>}

      <button
        onClick={submit}
        disabled={busy}
        style={{
          marginTop: 20, width: '100%', background: FANTA, color: ON_FANTA, border: 'none',
          padding: '14px', fontFamily: 'Anton, sans-serif', fontSize: 18, letterSpacing: '0.06em',
          textTransform: 'uppercase', cursor: busy ? 'default' : 'pointer', opacity: busy ? 0.6 : 1,
        }}
      >
        {busy ? '...' : t('auth.submit')}
      </button>
    </div>
  );
}
