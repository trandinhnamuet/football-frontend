// Dùng cho metadata phía server (Open Graph / Twitter / canonical): crawler của
// Facebook, Messenger, Zalo chỉ đọc thẻ <meta> trong HTML trả về lần đầu.

export const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL || 'https://www.lonfantafc.com').replace(/\/$/, '');
export const SITE_NAME = 'Lon Fanta FC';
export const SITE_TAGLINE = 'Đội bóng phong trào Hà Nội — #ĐamMêBấtTận';

const API_BASE = (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001').replace(/\/$/, '');

/** Ảnh upload ("/uploads/...") → URL tuyệt đối trên API để crawler tải được. */
export function absoluteImage(url: string | null | undefined): string | null {
  if (!url) return null;
  if (/^https?:\/\//i.test(url)) return url;
  return url.startsWith('/uploads') ? `${API_BASE}${url}` : `${SITE_URL}${url.startsWith('/') ? '' : '/'}${url}`;
}

const ENTITIES: Record<string, string> = { amp: '&', lt: '<', gt: '>', quot: '"', apos: "'", nbsp: ' ' };

/** HTML bài viết → chữ thuần một dòng, dùng làm mô tả. */
export function plainText(html: string | null | undefined): string {
  return (html || '')
    .replace(/<(script|style)[\s\S]*?<\/\1>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&(#\d+|#x[0-9a-f]+|\w+);/gi, (m, e: string) => {
      if (e[0] === '#') {
        const code = e[1].toLowerCase() === 'x' ? parseInt(e.slice(2), 16) : parseInt(e.slice(1), 10);
        return Number.isFinite(code) ? String.fromCodePoint(code) : m;
      }
      return ENTITIES[e.toLowerCase()] ?? m;
    })
    .replace(/\s+/g, ' ')
    .trim();
}

/** Cắt ở ranh giới từ, thêm "…" — Facebook hiển thị khoảng 150–200 ký tự. */
export function truncate(s: string, max = 180): string {
  if (s.length <= max) return s;
  const cut = s.slice(0, max);
  const space = cut.lastIndexOf(' ');
  return `${(space > max * 0.6 ? cut.slice(0, space) : cut).replace(/[\s,.;:–-]+$/, '')}…`;
}
