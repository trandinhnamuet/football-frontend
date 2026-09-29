'use client';

import { kitColorHex } from '../lib/types';

/**
 * Hiện 1–2 màu áo của trận: ô màu (nếu nhận ra tên màu) + tên. Hai màu cách
 * nhau bằng dấu "+".
 */
export default function KitColors({ kits, size = 16, fontSize = 16 }: { kits: string[]; size?: number; fontSize?: number }) {
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
      {kits.map((k, i) => {
        const hex = kitColorHex(k);
        return (
          <span key={`${k}-${i}`} style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
            {i > 0 && <span style={{ color: 'var(--muted)', fontSize: fontSize * 0.8, marginRight: 2 }}>+</span>}
            {hex && <span aria-hidden style={{ width: size, height: size, background: hex, border: '1px solid rgba(128,128,128,0.5)', flexShrink: 0 }} />}
            <span style={{ fontFamily: 'Anton, sans-serif', fontSize, textTransform: 'uppercase', letterSpacing: '0.03em' }}>{k}</span>
          </span>
        );
      })}
    </span>
  );
}
