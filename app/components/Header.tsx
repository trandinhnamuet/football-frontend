'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useApp } from '../contexts/AppContext';
import { FANTA_LOGO_URL } from '../lib/assets';

const FANTA = '#FF6B1A';

export default function Header() {
  const pathname = usePathname();
  const { lang, setLang, theme, setTheme, t } = useApp();

  const navLinks = [
    { href: '/#intro', labelKey: 'nav.intro' },
    { href: '/#squad', labelKey: 'nav.squad' },
    { href: '/#news', labelKey: 'nav.news' },
    { href: '/#schedule', labelKey: 'nav.schedule' },
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
    <nav style={{
      position: 'sticky', top: 0, zIndex: 50,
      background: '#0a0a0a',
      borderBottom: `1px solid ${FANTA}`,
      padding: '14px 48px',
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
    }}>
      <Link href="/" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 12 }}>
        <img
          src={FANTA_LOGO_URL}
          alt="Fanta FC Logo"
          width={40}
          height={40}
          style={{ objectFit: 'cover', display: 'block' }}
        />
        <div style={{ fontFamily: 'Anton, sans-serif', fontSize: 22, letterSpacing: '0.04em', color: '#f4f1ea' }}>
          LON FANTA <span style={{ color: FANTA }}>FC</span>
        </div>
      </Link>

      <div style={{ display: 'flex', gap: 20, fontSize: 12, color: '#a09b94', letterSpacing: '0.1em', textTransform: 'uppercase', fontWeight: 600, alignItems: 'center' }}>
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
    </nav>
  );
}
