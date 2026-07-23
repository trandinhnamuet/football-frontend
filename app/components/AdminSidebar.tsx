'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import { adminSections } from '../lib/adminNav';
import { FANTA } from '../lib/types';

const KEY = 'lffc_admin_pw';

export default function AdminSidebar() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  // Rendered outside AdminGuard, so it tracks auth itself — otherwise the nav
  // would sit next to the password prompt.
  const [authed, setAuthed] = useState(false);

  useEffect(() => {
    const sync = () => setAuthed(!!localStorage.getItem(KEY));
    sync();
    window.addEventListener('admin-authenticated', sync);
    window.addEventListener('admin-unauthorized', sync);
    return () => {
      window.removeEventListener('admin-authenticated', sync);
      window.removeEventListener('admin-unauthorized', sync);
    };
  }, []);

  // Close the mobile drawer whenever navigation lands on a new page. Adjusted
  // during render (comparing against the last-seen pathname in state) rather
  // than in an effect, per React's guidance for state that depends on a
  // changed prop — refs can't be touched during render under React Compiler.
  const [lastPathname, setLastPathname] = useState(pathname);
  if (lastPathname !== pathname) {
    setLastPathname(pathname);
    if (open) setOpen(false);
  }

  if (!authed) return null;

  const onIndex = pathname === '/admin';

  return (
    <>
      <button
        type="button"
        className="admin-sidebar-toggle"
        aria-label="Mở menu quản trị"
        onClick={() => setOpen(o => !o)}
      >
        {open ? '✕' : '☰'}
      </button>

      {open && <div className="admin-sidebar-backdrop" onClick={() => setOpen(false)} />}

      <aside className="admin-sidebar" data-open={open}>
        <div className="admin-sidebar-brand">
          <span style={{ color: FANTA }}>LFFC</span> Admin
        </div>

        <Link
          href="/admin"
          className="admin-side-back"
          aria-current={onIndex ? 'page' : undefined}
        >
          ← Tất cả công cụ
        </Link>

        <nav className="admin-sidebar-nav">
          {adminSections.map(s => (
            <Link
              key={s.href}
              href={s.href}
              className="admin-side-link"
              data-active={pathname === s.href}
            >
              <span className="admin-side-icon">{s.icon}</span>
              <span>{s.short}</span>
            </Link>
          ))}
        </nav>

        <Link href="/" className="admin-side-home">← Về trang chủ</Link>
      </aside>
    </>
  );
}
