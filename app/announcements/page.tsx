import type { Metadata } from 'next';
import AnnouncementList from './AnnouncementList';
import { Article } from '../lib/types';

const BASE = (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001').replace(/\/$/, '');

export const metadata: Metadata = {
  title: 'Thông báo | Lon Fanta FC',
  description: 'Thông báo của Lon Fanta FC: lịch đá, chia đôi, quỹ đội và các việc cần anh em nắm.',
};

async function getAnnouncements(): Promise<Article[]> {
  try {
    const res = await fetch(`${BASE}/api/articles?kind=announcement`, { next: { revalidate: 60 } });
    return res.ok ? res.json() : [];
  } catch { return []; }
}

export default async function AnnouncementsPage() {
  const items = await getAnnouncements();
  return <AnnouncementList initialItems={items} />;
}
