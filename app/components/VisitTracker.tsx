'use client';

import { useEffect, useRef } from 'react';
import { usePathname } from 'next/navigation';

/**
 * Beacon cho nhật ký truy cập tự lưu (song song với GA4).
 *
 * - `visitor_id` sinh lần đầu rồi giữ trong localStorage → nhận ra khách quay lại
 * - `session_id` giữ trong sessionStorage → gom các trang trong cùng một phiên
 * - Bắn về chính domain của mình nên ad-blocker không chặn
 *
 * Không đo khu /admin: đó là mình tự vào, tính vào thống kê chỉ làm nhiễu số.
 */

const VISITOR_KEY = 'wstats_vid';
const SESSION_KEY = 'wstats_sid';

function newId(): string {
  // randomUUID cần secure context; localhost và HTTPS đều có, nhưng vẫn thủ sẵn
  // đường lui để trang không vỡ nếu chạy qua HTTP thuần.
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  const hex = [...crypto.getRandomValues(new Uint8Array(16))].map((b) =>
    b.toString(16).padStart(2, '0')
  );
  hex[6] = ((parseInt(hex[6], 16) & 0x0f) | 0x40).toString(16).padStart(2, '0');
  hex[8] = ((parseInt(hex[8], 16) & 0x3f) | 0x80).toString(16).padStart(2, '0');
  const s = hex.join('');
  return `${s.slice(0, 8)}-${s.slice(8, 12)}-${s.slice(12, 16)}-${s.slice(16, 20)}-${s.slice(20)}`;
}

/** Trả về id và cho biết có phải vừa tạo mới không (= khách lần đầu). */
function readOrCreate(store: Storage, key: string): { id: string; created: boolean } {
  const existing = store.getItem(key);
  if (existing) return { id: existing, created: false };
  const id = newId();
  store.setItem(key, id);
  return { id, created: true };
}

export default function VisitTracker() {
  const pathname = usePathname();
  // StrictMode ở dev gọi effect hai lần; ref chặn bắn trùng ngay tại nguồn
  // (server cũng có lớp chống trùng riêng, nhưng chặn sớm thì sạch hơn).
  const lastSent = useRef<string | null>(null);

  useEffect(() => {
    if (!pathname || pathname.startsWith('/admin')) return;
    if (lastSent.current === pathname) return;
    lastSent.current = pathname;

    let visitor: { id: string; created: boolean };
    let session: { id: string; created: boolean };
    try {
      visitor = readOrCreate(localStorage, VISITOR_KEY);
      session = readOrCreate(sessionStorage, SESSION_KEY);
    } catch {
      // Trình duyệt chặn storage (chế độ riêng tư, chặn cookie bên thứ ba…)
      return;
    }

    const payload = JSON.stringify({
      vid: visitor.id,
      sid: session.id,
      new: visitor.created,
      path: pathname,
      title: document.title,
      ref: document.referrer || null,
      screen: `${window.screen.width}x${window.screen.height}`,
      lang: navigator.language,
    });

    // sendBeacon không giữ chân điều hướng và vẫn gửi được khi trang đang đóng.
    const sent =
      typeof navigator.sendBeacon === 'function' &&
      navigator.sendBeacon('/api/track', new Blob([payload], { type: 'application/json' }));

    if (!sent) {
      fetch('/api/track', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: payload,
        keepalive: true,
      }).catch(() => {
        /* đo đạc hỏng thì thôi, không làm phiền khách */
      });
    }
  }, [pathname]);

  return null;
}
