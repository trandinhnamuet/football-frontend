'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { useApp } from '../contexts/AppContext';
import { FANTA_LOGO_URL } from '../lib/assets';

const FANTA = '#FF6B1A';

export default function Header() {
  const pathname = usePathname();
  const { lang, setLang, theme, setTheme, t } = useApp();
  const [menuOpen, setMenuOpen] = useState(false);

  const navLinks = [
    { href: '/#intro', labelKey: 'nav.intro' },
    { href: '/#squad', labelKey: 'nav.squad' },
    { href: '/#news', labelKey: 'nav.news' },
    { href: '/#schedule', labelKey: 'nav.schedule' },
    { href: '/gallery', labelKey: 'nav.gallery' },
    { href: '/dashboard', labelKey: 'nav.dashboard', accent: true },
  ];

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

          {/* Language toggle */}
          <button
            onClick={() => setLang(lang === 'vi' ? 'en' : 'vi')}
            style={{ ...btnStyle, color: FANTA, borderColor: `${FANTA}55` }}
          >
            {lang === 'vi' ? 'Tiếng Việt' : 'English'}
          </button>

          {/* Theme toggle */}
          <button
            onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')}
            style={btnStyle}
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
              onClick={() => setMenuOpen(false)}
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
          <div style={{ display: 'flex', gap: 10, marginTop: 16 }}>
            <button
              onClick={() => setLang(lang === 'vi' ? 'en' : 'vi')}
              style={{ ...btnStyle, color: FANTA, borderColor: `${FANTA}55`, flex: 1, padding: '10px', fontSize: 13 }}
            >
              {lang === 'vi' ? 'Tiếng Việt' : 'English'}
            </button>
            <button
              onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')}
              style={{ ...btnStyle, flex: 1, padding: '10px', fontSize: 13 }}
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
