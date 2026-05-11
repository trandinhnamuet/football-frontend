'use client';

import Link from 'next/link';

const FANTA = '#FF6B1A';
const BLACK = '#0a0a0a';
const MUTED = '#a09b94';

export default function AdminHeader() {
  function handleLogout() {
    localStorage.removeItem('lffc_admin_pw');
    location.reload();
  }

  return (
    <nav style={{
      position: 'sticky', top: 0, zIndex: 50,
      background: BLACK,
      borderBottom: `1px solid ${FANTA}`,
      padding: '14px 48px',
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
    }}>
      {/* Logo + Title */}
      <Link href="/" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 12 }}>
        <div style={{
          width: 40, height: 40, background: FANTA, color: BLACK,
          clipPath: 'polygon(15% 0, 100% 0, 85% 100%, 0 100%)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontFamily: 'Anton, sans-serif', fontSize: 22, letterSpacing: '0.02em',
        }}>LF</div>
        <div style={{ fontFamily: 'Anton, sans-serif', fontSize: 22, letterSpacing: '0.04em', color: '#f4f1ea', display: 'flex', alignItems: 'center', gap: 8 }}>
          LON FANTA <span style={{ color: FANTA }}>FC</span>
          <span style={{ color: MUTED, fontSize: 14, fontFamily: 'Space Grotesk, sans-serif', fontWeight: 600 }}>/</span>
          <span style={{ color: MUTED, fontSize: 14, fontFamily: 'Space Grotesk, sans-serif', fontWeight: 600 }}>Admin</span>
        </div>
      </Link>

      {/* Navigation Links */}
      <div style={{ display: 'flex', gap: 20, fontSize: 12, color: MUTED, letterSpacing: '0.1em', textTransform: 'uppercase', fontWeight: 600 }}>
        <Link href="/" style={{ color: 'inherit', textDecoration: 'none', transition: 'color 0.2s', cursor: 'pointer' }} 
          onMouseEnter={(e) => (e.currentTarget.style.color = FANTA)}
          onMouseLeave={(e) => (e.currentTarget.style.color = MUTED)}>
          ← Trang chủ
        </Link>
        <Link href="/admin/player-management" style={{ color: 'inherit', textDecoration: 'none', transition: 'color 0.2s', cursor: 'pointer' }} 
          onMouseEnter={(e) => (e.currentTarget.style.color = FANTA)}
          onMouseLeave={(e) => (e.currentTarget.style.color = MUTED)}>
          Quản lý cầu thủ
        </Link>
        <button
          onClick={handleLogout}
          style={{
            background: 'none', border: 'none', color: '#cc4444', cursor: 'pointer',
            fontFamily: 'inherit', fontSize: 12, letterSpacing: '0.1em', textTransform: 'uppercase', fontWeight: 600,
            transition: 'color 0.2s',
          }}
          onMouseEnter={(e) => (e.currentTarget.style.color = '#ff6666')}
          onMouseLeave={(e) => (e.currentTarget.style.color = '#cc4444')}
        >
          Đăng xuất
        </button>
      </div>
    </nav>
  );
}
