'use client';

import { useRef, useState, useCallback } from 'react';

/**
 * Kéo ngang để chuyển slide — chạm trên mobile và giữ chuột kéo trên PC.
 * Trả về `dx` (độ lệch đang kéo, px) để component cộng vào transform, cùng các
 * handler gắn lên vùng kéo. Vùng kéo cần CSS `touch-action: pan-y` để trình
 * duyệt vẫn tự cuộn dọc, chỉ nhường cử chỉ ngang cho slider.
 */
export function useSwipe({ onPrev, onNext, threshold = 0.15 }: {
  onPrev: () => void;
  onNext: () => void;
  /** Tỉ lệ bề rộng vùng kéo cần vượt qua để đổi slide. */
  threshold?: number;
}) {
  const [dx, setDx] = useState(0);
  const [dragging, setDragging] = useState(false);
  const start = useRef<{ x: number; y: number; t: number; id: number; width: number } | null>(null);
  // null = chưa rõ hướng; true = kéo ngang (slider giữ); false = cuộn dọc (bỏ qua).
  const horizontal = useRef<boolean | null>(null);
  // Vừa kéo xong thì chặn cú click ngay sau đó, để không mở link của slide.
  const suppressClick = useRef(false);

  const onPointerDown = useCallback((e: React.PointerEvent<HTMLElement>) => {
    if (e.pointerType === 'mouse' && e.button !== 0) return;
    start.current = { x: e.clientX, y: e.clientY, t: Date.now(), id: e.pointerId, width: e.currentTarget.clientWidth || 1 };
    horizontal.current = null;
    suppressClick.current = false;
  }, []);

  const onPointerMove = useCallback((e: React.PointerEvent<HTMLElement>) => {
    const s = start.current;
    if (!s || e.pointerId !== s.id) return;
    const mx = e.clientX - s.x;
    const my = e.clientY - s.y;
    if (horizontal.current === null) {
      if (Math.abs(mx) < 6 && Math.abs(my) < 6) return;
      horizontal.current = Math.abs(mx) > Math.abs(my);
      if (!horizontal.current) { start.current = null; return; }
      try { e.currentTarget.setPointerCapture(e.pointerId); } catch { /* pointer đã nhả */ }
      setDragging(true);
    }
    if (horizontal.current) setDx(mx);
  }, []);

  const finish = useCallback((e: React.PointerEvent<HTMLElement>, cancelled: boolean) => {
    const s = start.current;
    start.current = null;
    if (!s || !horizontal.current) return;
    horizontal.current = null;
    const mx = e.clientX - s.x;
    const fast = Math.abs(mx) > 30 && Date.now() - s.t < 250;
    suppressClick.current = Math.abs(mx) > 6;
    setDragging(false);
    setDx(0);
    if (cancelled) return;
    if (Math.abs(mx) > s.width * threshold || fast) {
      if (mx < 0) onNext(); else onPrev();
    }
  }, [onNext, onPrev, threshold]);

  const handlers = {
    onPointerDown,
    onPointerMove,
    onPointerUp: (e: React.PointerEvent<HTMLElement>) => finish(e, false),
    onPointerCancel: (e: React.PointerEvent<HTMLElement>) => finish(e, true),
    onClickCapture: (e: React.MouseEvent<HTMLElement>) => {
      if (suppressClick.current) { e.preventDefault(); e.stopPropagation(); suppressClick.current = false; }
    },
    // Chặn kéo-thả ảnh/link mặc định của trình duyệt khi kéo bằng chuột.
    onDragStart: (e: React.DragEvent<HTMLElement>) => e.preventDefault(),
  };

  return { dx, dragging, handlers };
}
