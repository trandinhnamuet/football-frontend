/**
 * Bài viết (tin tức, bài thành viên) được admin dán vào dưới dạng HTML thô, và
 * HTML đó thường mang màu cứng của theme sáng — ví dụ một khung thông tin
 * `background-color: #f8f9fa`. Khung đó không đổi theo theme, nên ở dark mode
 * chữ bên trong lấy màu chữ sáng của trang và gần như tàng hình trên nền trắng
 * (và ngược lại với khung tối ở light mode).
 *
 * `normalizeProse` đọc các `style` inline, tự nhận ra khung nào sáng / tối và
 * gắn thêm class để CSS ép màu chữ đọc được cho đúng từng theme. Nền của khung
 * vẫn giữ nguyên như tác giả đặt — chỉ màu chữ được cứu.
 */

/** Màu chữ ép cho khung sáng / tối nằm trong globals.css. */
const LIGHT_PANEL = 'lf-light-panel';
const DARK_PANEL = 'lf-dark-panel';

/** Vài tên màu hay gặp trong HTML dán vào, kèm độ sáng tương đối. */
const NAMED: Record<string, number> = {
  white: 1, whitesmoke: 0.96, snow: 0.99, ivory: 0.99, azure: 0.98,
  aliceblue: 0.97, beige: 0.95, linen: 0.96, lavender: 0.93, gainsboro: 0.86,
  lightgray: 0.84, lightgrey: 0.84, silver: 0.76,
  gray: 0.5, grey: 0.5, dimgray: 0.4, dimgrey: 0.4,
  black: 0, navy: 0.08, darkslategray: 0.17, darkslategrey: 0.17, maroon: 0.1,
};

/**
 * Độ sáng tương đối (0 = đen, 1 = trắng) của một giá trị màu CSS.
 * Trả về null khi không đọc được, hoặc khi màu gần như trong suốt — lúc đó nền
 * của trang hiện xuyên qua nên không cần can thiệp.
 */
function luminance(raw: string): number | null {
  const v = raw.trim().toLowerCase();
  if (!v || v === 'transparent' || v === 'inherit' || v === 'initial' || v === 'unset' || v === 'none') return null;

  const named = NAMED[v];
  if (named !== undefined) return named;

  let r: number, g: number, b: number, a = 1;

  const hex = /^#([0-9a-f]{3,8})$/.exec(v);
  if (hex) {
    const h = hex[1];
    if (h.length === 3 || h.length === 4) {
      r = parseInt(h[0] + h[0], 16); g = parseInt(h[1] + h[1], 16); b = parseInt(h[2] + h[2], 16);
      if (h.length === 4) a = parseInt(h[3] + h[3], 16) / 255;
    } else if (h.length === 6 || h.length === 8) {
      r = parseInt(h.slice(0, 2), 16); g = parseInt(h.slice(2, 4), 16); b = parseInt(h.slice(4, 6), 16);
      if (h.length === 8) a = parseInt(h.slice(6, 8), 16) / 255;
    } else return null;
  } else {
    const fn = /^rgba?\(([^)]+)\)$/.exec(v);
    if (!fn) return null;
    const parts = fn[1].split(/[,/\s]+/).filter(Boolean);
    if (parts.length < 3) return null;
    const num = (s: string) => (s.endsWith('%') ? (parseFloat(s) / 100) * 255 : parseFloat(s));
    r = num(parts[0]); g = num(parts[1]); b = num(parts[2]);
    if (parts[3] !== undefined) a = parts[3].endsWith('%') ? parseFloat(parts[3]) / 100 : parseFloat(parts[3]);
    if ([r, g, b, a].some(n => Number.isNaN(n))) return null;
  }

  // Nền mờ thì nền trang hiện xuyên qua, màu chữ của theme vẫn đúng.
  if (a < 0.5) return null;
  return (0.2126 * r + 0.7152 * g + 0.0722 * b) / 255;
}

/** Màu nền do `style` inline đặt, kể cả khi viết bằng shorthand `background`. */
function backgroundTone(style: string): 'light' | 'dark' | null {
  const decl = /(^|;)\s*background(-color)?\s*:\s*([^;]+)/gi;
  let tone: 'light' | 'dark' | null = null;
  let m: RegExpExecArray | null;
  while ((m = decl.exec(style))) {
    const value = m[3];
    // Shorthand có thể chứa gradient / ảnh — không suy ra được màu chữ nên bỏ.
    if (/(gradient|url\()/i.test(value)) continue;
    // Lấy token màu đầu tiên trong shorthand (`#fff none repeat`).
    const token = /(#[0-9a-fA-F]{3,8}|rgba?\([^)]*\)|[a-zA-Z]+)/.exec(value)?.[1];
    if (!token) continue;
    const l = luminance(token);
    if (l === null) continue;
    tone = l > 0.55 ? 'light' : l < 0.3 ? 'dark' : null;
  }
  return tone;
}

export function normalizeProse(html: string): string {
  if (!html) return '';
  // Chỉ chạm vào thẻ mở có `style` — phần còn lại của bài viết giữ nguyên.
  return html.replace(
    /<([a-zA-Z][\w-]*)((?:[^>"']|"[^"]*"|'[^']*')*)>/g,
    (tag, name: string, attrs: string) => {
      const style = /\bstyle\s*=\s*("([^"]*)"|'([^']*)')/.exec(attrs);
      if (!style) return tag;
      const tone = backgroundTone(style[2] ?? style[3] ?? '');
      if (!tone) return tag;
      const cls = tone === 'light' ? LIGHT_PANEL : DARK_PANEL;
      const existing = /\bclass\s*=\s*("([^"]*)"|'([^']*)')/.exec(attrs);
      if (!existing) return `<${name}${attrs} class="${cls}">`;
      const value = existing[2] ?? existing[3] ?? '';
      if (value.split(/\s+/).includes(cls)) return tag;
      return `<${name}${attrs.replace(existing[0], `class="${`${value} ${cls}`.trim()}"`)}>`;
    },
  );
}
