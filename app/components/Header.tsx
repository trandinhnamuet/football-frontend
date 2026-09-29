'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { smoothScrollToHash } from '../lib/scroll';
import { useApp } from '../contexts/AppContext';
import { useAuth } from '../contexts/AuthContext';
import { FANTA_LOGO_URL } from '../lib/assets';

const FANTA = '#FF6B1A';

export default function Header() {
  const pathname = usePathname();
  const { lang, setLang, theme, setTheme, t } = useApp();
  const { user, logout } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);
  // Tên ngắn hiện trên header: tên gọi (last_name) của cầu thủ, không thì username.
  const shortName = user ? (user.player?.last_name || user.display_name || user.username) : '';

  const navLinks = [
    { href: '/about', labelKey: 'nav.intro' },
    { href: '/players', labelKey: 'nav.squad' },
    { href: '/news', labelKey: 'nav.news' },
    { href: '/#schedule', labelKey: 'nav.schedule' },
    { href: '/gallery', labelKey: 'nav.gallery' },
    { href: '/dashboard', labelKey: 'nav.dashboard', accent: true },
  ];

  // Link dạng /#section: đang ở trang chủ thì cuộn mượt tới section thay vì
  // nhảy thẳng; ở trang khác thì để Next điều hướng về trang chủ rồi
  // ScrollToHash (trang chủ) lo phần cuộn.
  function handleNavClick(href: string, e: React.MouseEvent<HTMLAnchorElement>) {
    setMenuOpen(false);
    if (href.startsWith('/#') && pathname === '/') {
      e.preventDefault();
      smoothScrollToHash(href.slice(1));
    }
  }

  const btnStyle: React.CSSProperties = {
    background: 'none',
    border: '1px solid rgba(255,255,255,0.2)',
    color: '#a09b94',
    padding: '4px 10px',
    fontSize: 11,
    letterSpacing: '0.1em',
    textTransform: 'uppercase' as const,
    fontWeight: 700,
    cursor: 'pointer',
    fontFamily: 'inherit',
    transition: 'border-color 0.2s, color 0.2s',
  };

  return (
    <>
      <nav
        className="main-nav"
        style={{
          position: 'sticky', top: 0, zIndex: 50,
          background: '#0a0a0a',
          borderBottom: `1px solid ${FANTA}`,
          padding: '14px 48px',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        }}
      >
        <Link href="/" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 12 }}>
          <Image
            src={FANTA_LOGO_URL}
            alt="Fanta FC Logo"
            width={40}
            height={40}
            style={{ objectFit: 'contain', display: 'block' }}
          />
          <div style={{ fontFamily: 'Anton, sans-serif', fontSize: 22, letterSpacing: '0.04em', color: '#f4f1ea' }}>
            LON FANTA <span style={{ color: FANTA }}>FC</span>
          </div>
        </Link>

        {/* Desktop nav links */}
        <div className="nav-desktop" style={{ display: 'flex', gap: 20, fontSize: 12, color: '#a09b94', letterSpacing: '0.1em', textTransform: 'uppercase', fontWeight: 600, alignItems: 'center' }}>
          {navLinks.map(link => (
            <Link
              key={link.href}
              href={link.href}
              onClick={e => handleNavClick(link.href, e)}
              className="nav-link"
              style={{
                color: link.accent ? FANTA : (pathname === link.href ? '#f4f1ea' : 'inherit'),
                textDecoration: 'none',
                fontWeight: link.accent ? 700 : 600,
              }}
            >
              {link.accent ? `● ${t(link.labelKey)}` : t(link.labelKey)}
            </Link>
          ))}

          {/* Divider */}
          <span style={{ width: 1, height: 16, background: 'rgba(255,255,255,0.15)', display: 'inline-block' }} />

          {/* Tài khoản thành viên */}
          {user ? (
            <>
              <Link href="/account" className="nav-link" title={t('nav.account')} style={{ color: pathname === '/account' ? '#f4f1ea' : 'inherit', textDecoration: 'none', fontWeight: 600 }}>
                👤 {shortName}
              </Link>
              <button onClick={logout} className="nav-btn" title={t('nav.logout')}>{t('nav.logout')}</button>
            </>
          ) : (
            <Link href="/login" className="nav-link" style={{ color: pathname === '/login' ? '#f4f1ea' : 'inherit', textDecoration: 'none', fontWeight: 600 }}>
              {t('nav.login')}
            </Link>
          )}

          {/* Language toggle */}
          <button
            onClick={() => setLang(lang === 'vi' ? 'en' : 'vi')}
            className="nav-btn nav-btn-lang"
          >
            {lang === 'vi' ? 'Tiếng Việt' : 'English'}
          </button>

          {/* Theme toggle */}
          <button
            onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')}
            className="nav-btn"
            title={theme === 'light' ? 'Switch to dark mode' : 'Switch to light mode'}
          >
            {theme === 'light' ? '◑' : '○'}
          </button>
        </div>

        {/* Mobile hamburger button */}
        <button
          className="nav-mobile-btn"
          onClick={() => setMenuOpen(o => !o)}
          aria-label="Toggle menu"
          style={{
            background: 'none',
            border: `1px solid ${FANTA}55`,
            color: FANTA,
            padding: '8px 14px',
            cursor: 'pointer',
            fontFamily: 'inherit',
            fontSize: 22,
            lineHeight: 1,
          }}
        >
          {menuOpen ? '✕' : '☰'}
        </button>
      </nav>

      {/* Mobile dropdown menu */}
      {menuOpen && (
        <div
          style={{
            position: 'fixed', top: 69, left: 0, right: 0,
            background: '#0a0a0a',
            borderBottom: `2px solid ${FANTA}`,
            zIndex: 49,
            padding: '16px 20px 24px',
            display: 'flex',
            flexDirection: 'column',
            gap: 0,
          }}
        >
          {navLinks.map(link => (
            <Link
              key={link.href}
              href={link.href}
              onClick={e => handleNavClick(link.href, e)}
              className="nav-link-mobile"
              style={{
                color: link.accent ? FANTA : '#f4f1ea',
                textDecoration: 'none',
                fontFamily: 'Anton, sans-serif',
                fontSize: 22,
                letterSpacing: '0.04em',
                textTransform: 'uppercase',
                padding: '14px 0',
                borderBottom: '1px solid rgba(255,255,255,0.07)',
                display: 'block',
              }}
            >
              {link.accent ? `● ${t(link.labelKey)}` : t(link.labelKey)}
            </Link>
          ))}
          {user ? (
            <Link
              href="/account"
              onClick={() => setMenuOpen(false)}
              className="nav-link-mobile"
              style={{ color: '#f4f1ea', textDecoration: 'none', fontFamily: 'Anton, sans-serif', fontSize: 22, letterSpacing: '0.04em', textTransform: 'uppercase', padding: '14px 0', borderBottom: '1px solid rgba(255,255,255,0.07)', display: 'block' }}
            >
              👤 {shortName}
            </Link>
          ) : (
            <Link
              href="/login"
              onClick={() => setMenuOpen(false)}
              className="nav-link-mobile"
              style={{ color: '#f4f1ea', textDecoration: 'none', fontFamily: 'Anton, sans-serif', fontSize: 22, letterSpacing: '0.04em', textTransform: 'uppercase', padding: '14px 0', borderBottom: '1px solid rgba(255,255,255,0.07)', display: 'block' }}
            >
              {t('nav.login')}
            </Link>
          )}
          <div style={{ display: 'flex', gap: 10, marginTop: 16 }}>
            {user && (
              <button onClick={() => { logout(); setMenuOpen(false); }} className="nav-btn nav-btn-mobile">
                {t('nav.logout')}
              </button>
            )}
            <button
              onClick={() => setLang(lang === 'vi' ? 'en' : 'vi')}
              className="nav-btn nav-btn-lang nav-btn-mobile"
            >
              {lang === 'vi' ? 'Tiếng Việt' : 'English'}
            </button>
            <button
              onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')}
              className="nav-btn nav-btn-mobile"
              title={theme === 'light' ? 'Switch to dark mode' : 'Switch to light mode'}
            >
              {theme === 'light' ? '◑ Light' : '○ Dark'}
            </button>
          </div>
        </div>
      )}
    </>
  );
}
