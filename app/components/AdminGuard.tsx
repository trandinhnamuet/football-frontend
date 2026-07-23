'use client';

import { useState, useEffect, ReactNode } from 'react';

const FANTA = '#FF6B1A';
const BLACK = 'var(--bg)';
const CARD = 'var(--card)';
const INK = 'var(--ink)';
const MUTED = 'var(--muted)';
const LINE = 'var(--line)';
// Text sitting on a FANTA-orange fill stays dark in both themes.
const ON_FANTA = '#0a0a0a';
const KEY = 'lffc_admin_pw';

interface Props { children: ReactNode }

export default function AdminGuard({ children }: Props) {
  const [authenticated, setAuthenticated] = useState(false);
  const [input, setInput] = useState('');
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    const saved = localStorage.getItem(KEY);
    if (saved) verifyPassword(saved, true);
    else setChecking(false);
  }, []);

  useEffect(() => {
    function onUnauthorized() {
      setAuthenticated(false);
      setChecking(false);
      setInput('');
      setError('');
      setMessage('Mật khẩu admin không hợp lệ hoặc đã hết hạn, vui lòng đăng nhập lại.');
    }
    window.addEventListener('admin-unauthorized', onUnauthorized);
    return () => window.removeEventListener('admin-unauthorized', onUnauthorized);
  }, []);

  async function verifyPassword(pw: string, silent = false) {
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/api/drive-links`, {
        headers: { 'x-admin-password': pw },
      });
      if (res.ok) {
        localStorage.setItem(KEY, pw);
        setAuthenticated(true);
        setError('');
        setMessage('');
        // Let admin chrome rendered outside this guard (the sidebar, which lives
        // in the admin layout) know it can show itself without a page reload.
        window.dispatchEvent(new CustomEvent('admin-authenticated'));
      } else {
        if (!silent) setError('Sai mật khẩu');
        localStorage.removeItem(KEY);
      }
    } catch {
      if (!silent) setError('Không thể kết nối server');
    } finally {
      setChecking(false);
    }
  }

  if (checking) {
    return (
      <div style={{ minHeight: '100vh', background: BLACK, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ color: MUTED, fontFamily: 'Anton, sans-serif', fontSize: 24 }}>...</div>
      </div>
    );
  }

  if (!authenticated) {
    return (
      <div style={{ minHeight: '100vh', background: BLACK, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ background: CARD, padding: '48px', width: '100%', maxWidth: 400, border: `1px solid ${FANTA}` }}>
          <div style={{ fontFamily: 'Anton, sans-serif', fontSize: 36, color: INK, textTransform: 'uppercase', marginBottom: 8 }}>
            Admin Access
          </div>
          <div style={{ color: MUTED, fontSize: 13, marginBottom: 28 }}>Nhập mật khẩu để tiếp tục</div>
          {message && (
            <div style={{ color: '#facc15', fontSize: 13, marginBottom: 16, padding: '10px 14px', background: 'rgba(250,204,21,0.08)', border: '1px solid rgba(250,204,21,0.3)' }}>
              {message}
            </div>
          )}
          <input
            type="password"
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && verifyPassword(input)}
            placeholder="Mật khẩu admin"
            style={{
              width: '100%', background: 'var(--input-bg)', border: `1px solid ${error ? '#cc3333' : LINE}`,
              color: INK, padding: '14px 16px', fontSize: 16, fontFamily: 'inherit',
              outline: 'none', boxSizing: 'border-box',
            }}
          />
          {error && <div style={{ color: '#cc4444', fontSize: 13, marginTop: 8 }}>{error}</div>}
          <button
            onClick={() => verifyPassword(input)}
            style={{
              marginTop: 16, width: '100%', background: FANTA, color: ON_FANTA, border: 'none',
              padding: '14px', fontFamily: 'Anton, sans-serif', fontSize: 18, letterSpacing: '0.06em',
              textTransform: 'uppercase', cursor: 'pointer',
            }}
          >
            Đăng nhập
          </button>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
