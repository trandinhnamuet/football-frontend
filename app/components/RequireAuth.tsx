'use client';

import { ReactNode } from 'react';
import Header from './Header';
import Footer from './Footer';
import LoginForm from './LoginForm';
import { useAuth } from '../contexts/AuthContext';
import { useApp } from '../contexts/AppContext';

const BLACK = 'var(--bg)';
const INK = 'var(--ink)';
const MUTED = 'var(--muted)';

function Shell({ children }: { children: ReactNode }) {
  return (
    <div style={{ background: BLACK, color: INK, fontFamily: '"Space Grotesk", system-ui, sans-serif', minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <Header />
      <main className="mob-p-main" style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '64px 48px' }}>
        {children}
      </main>
      <Footer />
    </div>
  );
}

/**
 * Chỉ render nội dung khi đã đăng nhập; chưa đăng nhập thì hiện form ngay tại
 * chỗ (giữ nguyên URL, đăng nhập xong nội dung hiện luôn).
 */
export default function RequireAuth({ children, title, hint }: { children: ReactNode; title?: string; hint?: string }) {
  const { user, loading } = useAuth();
  const { t } = useApp();

  if (loading) {
    return (
      <Shell>
        <div style={{ color: MUTED, fontFamily: 'Anton, sans-serif', fontSize: 24 }}>...</div>
      </Shell>
    );
  }

  if (!user) {
    return (
      <Shell>
        <LoginForm title={title || t('auth.requiredTitle')} hint={hint || t('auth.requiredHint')} />
      </Shell>
    );
  }

  return <>{children}</>;
}
