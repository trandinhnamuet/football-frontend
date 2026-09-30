'use client';

import { useEffect } from 'react';
import { smoothScrollToHash } from '../lib/scroll';

/**
 * Trang chủ: khi tới với hash (vd. từ header ở trang khác bấm "Lịch thi đấu"
 * → /#schedule) thì cuộn mượt tới section đó. Thử lại vài lần vì section chỉ
 * có chiều cao thật sau khi dữ liệu tải xong; sau khi cuộn được rồi vẫn chỉnh
 * lại thêm vài nhịp vì nội dung phía trên (banner, lịch, ảnh) tải xong sau
 * sẽ đẩy section trôi xuống.
 */
export default function ScrollToHash() {
  useEffect(() => {
    const hash = window.location.hash;
    if (!hash) return;
    const timers: ReturnType<typeof setTimeout>[] = [];
    let tries = 0;
    const tick = () => {
      tries += 1;
      if (smoothScrollToHash(hash)) {
        // Chỉnh lại vị trí khi layout phía trên còn thay đổi.
        for (const delay of [700, 1600, 3000]) timers.push(setTimeout(() => smoothScrollToHash(hash), delay));
        return;
      }
      if (tries < 30) timers.push(setTimeout(tick, 200));
    };
    // Đợi trình duyệt khôi phục vị trí cuộn xong rồi mới cuộn của mình.
    timers.push(setTimeout(tick, 60));
    return () => timers.forEach(clearTimeout);
  }, []);
  return null;
}
