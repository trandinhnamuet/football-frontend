'use client';

import { useEffect } from 'react';

/**
 * Đăng ký service worker để trang cài được lên màn hình chính (PWA).
 * Chỉ chạy ở production để không cache nhầm khi dev.
 */
export default function PwaRegister() {
  useEffect(() => {
    if (process.env.NODE_ENV !== 'production') return;
    if (!('serviceWorker' in navigator)) return;
    navigator.serviceWorker.register('/sw.js', { scope: '/', updateViaCache: 'none' }).catch(() => {});
  }, []);
  return null;
}
