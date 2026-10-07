import type { MetadataRoute } from 'next';
import { SITE_URL } from './lib/seo';

export default function robots(): MetadataRoute.Robots {
  return {
    // /admin, /account, /login không chặn ở đây mà gắn X-Robots-Tag: noindex
    // (next.config.ts) — Google phải crawl được thì mới thấy noindex.
    rules: { userAgent: '*', allow: '/', disallow: ['/api/'] },
    sitemap: `${SITE_URL}/sitemap.xml`,
  };
}
