'use client';

import { useEffect } from 'react';
import { smoothScrollToHash } from '../lib/scroll';

/**
 * Trang chủ: khi tới với hash (vd. từ header ở trang khác bấm "Lịch thi đấu"
 * → /#schedule) thì cuộn mượt tới section đó. Thử lại vài lần vì section chỉ
 * có chiều cao thật sau khi dữ liệu tải xong; sau khi cuộn được rồi vẫn chỉnh
 * lại thêm vài nhịp vì nội dung phía trên (banner, lịch, ảnh) tải xong sau
 * sẽ đẩy section trôi xuống.
 *
 * Người dùng vừa cuộn / chạm / bấm phím là dừng hẳn: không bao giờ kéo họ
 * ngược lại section nữa.
 */
export default function ScrollToHash() {
  useEffect(() => {
    const hash = window.location.hash;
    if (!hash) return;
    const id = hash.slice(1);
    const timers: ReturnType<typeof setTimeout>[] = [];
    let cancelled = false;

    const stop = () => {
      cancelled = true;
      timers.forEach(clearTimeout);
      timers.length = 0;
    };
    // Bất kỳ tương tác cuộn nào của người dùng đều huỷ cuộn tự động.
    const userEvents: (keyof WindowEventMap)[] = ['wheel', 'touchstart', 'pointerdown', 'keydown'];
    userEvents.forEach(ev => window.addEventListener(ev, stop, { passive: true }));

    // Vị trí đích hiện tại của section so với top viewport (đã trừ header).
    const drift = () => {
      const el = document.getElementById(id);
      if (!el) return null;
      const nav = document.querySelector<HTMLElement>('.main-nav');
      return el.getBoundingClientRect().top - ((nav?.offsetHeight ?? 0) + 8);
    };

    let tries = 0;
    const tick = () => {
      if (cancelled) return;
      tries += 1;
      if (smoothScrollToHash(hash)) {
        // Chỉnh lại chỉ khi section thật sự bị trôi (> 24px) và người dùng
        // chưa đụng vào trang.
        for (const delay of [700, 1600, 3000]) {
          timers.push(setTimeout(() => {
            if (cancelled) return;
            const d = drift();
            if (d !== null && Math.abs(d) > 24) smoothScrollToHash(hash);
          }, delay));
        }
        return;
      }
      if (tries < 30) timers.push(setTimeout(tick, 200));
    };
    // Đợi trình duyệt khôi phục vị trí cuộn xong rồi mới cuộn của mình.
    timers.push(setTimeout(tick, 60));

    return () => {
      stop();
      userEvents.forEach(ev => window.removeEventListener(ev, stop));
    };
  }, []);
  return null;
}
