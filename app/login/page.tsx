'use client';

import { Suspense, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Header from '../components/Header';
import Footer from '../components/Footer';
import LoginForm from '../components/LoginForm';
import { useAuth } from '../contexts/AuthContext';

const BLACK = 'var(--bg)';
const INK = 'var(--ink)';
const MUTED = 'var(--muted)';

// Chỉ cho phép chuyển tới đường dẫn nội bộ, tránh open redirect.
function safeNext(raw: string | null): string {
  return raw && raw.startsWith('/') && !raw.startsWith('//') ? raw : '/dashboard';
}

function LoginContent() {
  const params = useSearchParams();
  const router = useRouter();
  const { user, loading } = useAuth();
  const next = safeNext(params.get('next'));

  // Đã đăng nhập rồi thì không cần form nữa.
  useEffect(() => {
    if (!loading && user) router.replace(next);
  }, [loading, user, next, router]);

  if (loading || user) {
    return <div style={{ color: MUTED, fontFamily: 'Anton, sans-serif', fontSize: 24 }}>...</div>;
  }
  return <LoginForm next={next} />;
}

export default function LoginPage() {
  return (
    <div style={{ background: BLACK, color: INK, fontFamily: '"Space Grotesk", system-ui, sans-serif', minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <Header />
      <main className="mob-p-main" style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '64px 48px' }}>
        <Suspense fallback={<div style={{ color: MUTED }}>...</div>}>
          <LoginContent />
        </Suspense>
      </main>
      <Footer />
    </div>
  );
}
