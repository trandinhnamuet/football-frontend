import { cache } from 'react';
import { Article } from '../../lib/types';

const BASE = (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001').replace(/\/$/, '');

/**
 * Bài viết theo slug hoặc id cũ (link /news/33 đã chia sẻ trước đây). Bọc
 * `cache` để page, generateMetadata và ảnh preview dùng chung một lần gọi.
 */
export const getArticle = cache(async (idOrSlug: string): Promise<Article | null> => {
  try {
    const res = await fetch(`${BASE}/api/articles/${encodeURIComponent(idOrSlug)}`, {
      next: { revalidate: 60 },
      // Crawler của Facebook/Zalo bỏ cuộc nếu trang trả chậm — backend treo thì
      // thà 404 còn hơn không có preview.
      signal: AbortSignal.timeout(5000),
    });
    if (!res.ok) return null;
    return res.json();
  } catch { return null; }
});
