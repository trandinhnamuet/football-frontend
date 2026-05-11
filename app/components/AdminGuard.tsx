'use client';

import { useState, useEffect, ReactNode } from 'react';

const FANTA = '#FF6B1A';
const BLACK = '#0a0a0a';
const KEY = 'lffc_admin_pw';

interface Props { children: ReactNode }

export default function AdminGuard({ children }: Props) {
  const [authenticated, setAuthenticated] = useState(false);
  const [input, setInput] = useState('');
  const [error, setError] = useState('');
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    const saved = localStorage.getItem(KEY);
    if (saved) verifyPassword(saved, true);
    else setChecking(false);
  }, []);

  async function verifyPassword(pw: string, silent = false) {
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/api/players`, {
        headers: { 'x-admin-password': pw },
      });
      if (res.ok) {
        localStorage.setItem(KEY, pw);
        setAuthenticated(true);
        setError('');
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
        <div style={{ color: '#a09b94', fontFamily: 'Anton, sans-serif', fontSize: 24 }}>...</div>
      </div>
    );
  }

  if (!authenticated) {
    return (
      <div style={{ minHeight: '100vh', background: BLACK, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ background: '#1a1a1a', padding: '48px', width: '100%', maxWidth: 400, border: `1px solid ${FANTA}` }}>
          <div style={{ fontFamily: 'Anton, sans-serif', fontSize: 36, color: '#f4f1ea', textTransform: 'uppercase', marginBottom: 8 }}>
            Admin Access
          </div>
          <div style={{ color: '#a09b94', fontSize: 13, marginBottom: 28 }}>Nhập mật khẩu để tiếp tục</div>
          <input
            type="password"
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && verifyPassword(input)}
            placeholder="Mật khẩu admin"
            style={{
              width: '100%', background: BLACK, border: `1px solid ${error ? '#cc3333' : 'rgba(255,255,255,0.15)'}`,
              color: '#f4f1ea', padding: '14px 16px', fontSize: 16, fontFamily: 'inherit',
              outline: 'none', boxSizing: 'border-box',
            }}
          />
          {error && <div style={{ color: '#cc4444', fontSize: 13, marginTop: 8 }}>{error}</div>}
          <button
            onClick={() => verifyPassword(input)}
            style={{
              marginTop: 16, width: '100%', background: FANTA, color: BLACK, border: 'none',
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
