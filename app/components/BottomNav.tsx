'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '../contexts/AuthContext';
import { useApp } from '../contexts/AppContext';

/**
 * Thanh menu dưới kiểu mobile app. Chỉ hiện trên màn hình nhỏ khi đã đăng nhập
 * (CSS `html[data-app="1"] .app-bottom-nav`). Khi bật, CSS cũng ẩn footer và
 * nút hamburger để giao diện gọn như app; ngôn ngữ / giao diện chuyển sang
 * trang Tài khoản.
 */

const ICON_PROPS = { width: 22, height: 22, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: 1.8, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const };

const icons = {
  home: <svg {...ICON_PROPS}><path d="M3 11.5 12 4l9 7.5" /><path d="M5 10v10h5v-6h4v6h5V10" /></svg>,
  dashboard: <svg {...ICON_PROPS}><path d="M4 20V10" /><path d="M10 20V4" /><path d="M16 20v-7" /><path d="M22 20H2" /></svg>,
  squad: <svg {...ICON_PROPS}><circle cx="9" cy="8" r="3.5" /><path d="M2.5 20c0-3.6 2.9-6 6.5-6s6.5 2.4 6.5 6" /><circle cx="17" cy="9" r="2.5" /><path d="M16 14.5c3 0 5.5 2 5.5 5" /></svg>,
  gallery: <svg {...ICON_PROPS}><rect x="3" y="4" width="18" height="16" rx="2" /><circle cx="9" cy="10" r="1.8" /><path d="m21 16-5-5-8 8" /></svg>,
  account: <svg {...ICON_PROPS}><circle cx="12" cy="8" r="4" /><path d="M4 21c0-4 3.6-7 8-7s8 3 8 7" /></svg>,
};

export default function BottomNav() {
  const { user } = useAuth();
  const { t } = useApp();
  const pathname = usePathname();

  // Bật/tắt "chế độ app" cho CSS toàn trang.
  useEffect(() => {
    document.documentElement.setAttribute('data-app', user ? '1' : '0');
  }, [user]);

  if (!user) return null;

  const tabs = [
    { href: '/', label: t('nav.home'), icon: icons.home, active: pathname === '/' },
    { href: '/dashboard', label: t('nav.dashboard'), icon: icons.dashboard, active: pathname.startsWith('/dashboard') },
    { href: '/players', label: t('nav.squad'), icon: icons.squad, active: pathname.startsWith('/players') || pathname.startsWith('/members') },
    { href: '/gallery', label: t('nav.gallery'), icon: icons.gallery, active: pathname.startsWith('/gallery') },
    { href: '/account', label: t('nav.account'), icon: icons.account, active: pathname.startsWith('/account') },
  ];

  return (
    <nav className="app-bottom-nav" aria-label="Menu">
      {tabs.map(tab => (
        <Link key={tab.href} href={tab.href} className="app-bottom-tab" data-active={tab.active}>
          {tab.icon}
          <span>{tab.label}</span>
        </Link>
      ))}
    </nav>
  );
}
