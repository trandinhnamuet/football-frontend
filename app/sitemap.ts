import type { MetadataRoute } from 'next';
import { Article, MemorialPost } from './lib/types';
import { SITE_URL } from './lib/seo';

const BASE = (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001').replace(/\/$/, '');

export const revalidate = 3600;

async function getJSON<T>(path: string): Promise<T[]> {
  try {
    const res = await fetch(`${BASE}${path}`, { next: { revalidate: 3600 }, signal: AbortSignal.timeout(5000) });
    return res.ok ? res.json() : [];
  } catch { return []; }
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [articles, posts] = await Promise.all([
    getJSON<Article>('/api/articles'),
    getJSON<MemorialPost>('/api/memorial-posts'),
  ]);
  const pages = ['', '/news', '/players', '/about', '/gallery', '/scoring'].map(p => ({
    url: `${SITE_URL}${p}`,
    changeFrequency: 'daily' as const,
    priority: p === '' ? 1 : 0.7,
  }));
  return [
    ...pages,
    ...articles.map(a => ({
      url: `${SITE_URL}/news/${a.slug || a.id}`,
      lastModified: a.published_at,
      changeFrequency: 'weekly' as const,
      priority: 0.8,
    })),
    ...posts.filter(p => p.slug).map(p => ({
      url: `${SITE_URL}/members/${p.slug}`,
      changeFrequency: 'monthly' as const,
      priority: 0.5,
    })),
  ];
}
