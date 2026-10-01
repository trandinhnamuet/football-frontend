import sharp from 'sharp';
import { readFile } from 'fs/promises';
import { join } from 'path';
import { getArticle } from './article';
import { absoluteImage } from '../../lib/seo';

export const SHARE_SIZE = { width: 1200, height: 630 };

/**
 * Ảnh preview 1200×630 JPEG cho một bài viết. Ảnh bìa gốc là WebP với đủ loại
 * tỉ lệ — Zalo/Messenger không phải lúc nào cũng đọc được WebP, và Facebook cắt
 * ảnh lệch tỉ lệ. Nên: nền là chính ảnh đó phóng to + làm mờ, ảnh gốc đặt giữa
 * nguyên vẹn (không cắt), xuất JPEG kích thước cố định.
 */
export async function renderArticleShareImage(idOrSlug: string): Promise<Response> {
  const { width, height } = SHARE_SIZE;
  let source: Buffer | null = null;

  const article = await getArticle(idOrSlug);
  const url = absoluteImage(article?.image_url);
  if (url) {
    try {
      const res = await fetch(url, { signal: AbortSignal.timeout(6000) });
      if (res.ok) source = Buffer.from(await res.arrayBuffer());
    } catch { /* rơi về logo */ }
  }

  let jpeg: Buffer;
  try {
    if (!source) throw new Error('no image');
    const background = await sharp(source)
      .resize(width, height, { fit: 'cover' })
      .blur(28)
      .modulate({ brightness: 0.45 })
      .toBuffer();
    const foreground = await sharp(source)
      .resize(width, height, { fit: 'inside', withoutEnlargement: false })
      .toBuffer();
    jpeg = await sharp(background)
      .composite([{ input: foreground, gravity: 'center' }])
      .jpeg({ quality: 82, mozjpeg: true })
      .toBuffer();
  } catch {
    // Bài không có ảnh (hoặc ảnh hỏng): logo đội trên nền tối.
    const logo = await readFile(join(process.cwd(), 'public', 'images', 'fanta-logo.png'));
    const mark = await sharp(logo).resize(420, 420, { fit: 'inside' }).toBuffer();
    jpeg = await sharp({ create: { width, height, channels: 3, background: '#0a0a0a' } })
      .composite([{ input: mark, gravity: 'center' }])
      .jpeg({ quality: 85 })
      .toBuffer();
  }

  return new Response(new Uint8Array(jpeg), {
    headers: {
      'Content-Type': 'image/jpeg',
      'Cache-Control': 'public, max-age=3600, s-maxage=3600, stale-while-revalidate=86400',
    },
  });
}
