'use client';

import { useEffect } from 'react';
import { smoothScrollToHash } from '../lib/scroll';

/**
 * Trang chủ: khi tới với hash (vd. từ header ở trang khác bấm "Lịch thi đấu"
 * → /#schedule) thì cuộn mượt tới section đó. Thử lại vài lần vì section chỉ
 * có chiều cao thật sau khi dữ liệu tải xong.
 */
export default function ScrollToHash() {
  useEffect(() => {
    const hash = window.location.hash;
    if (!hash) return;
    let tries = 0;
    const tick = () => {
      tries += 1;
      if (smoothScrollToHash(hash) || tries >= 10) return;
      setTimeout(tick, 150);
    };
    // Đợi trình duyệt khôi phục vị trí cuộn xong rồi mới cuộn của mình.
    const t = setTimeout(tick, 60);
    return () => clearTimeout(t);
  }, []);
  return null;
}
