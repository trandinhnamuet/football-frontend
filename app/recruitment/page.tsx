import type { Metadata } from 'next';
import RecruitmentList from './RecruitmentList';
import { RecruitmentPost } from '../lib/types';

const BASE = (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001').replace(/\/$/, '');

export const metadata: Metadata = {
  title: 'Tuyển quân | Lon Fanta FC',
  description: 'Lon Fanta FC đang tuyển thêm thành viên. Xem các vị trí còn thiếu và liên hệ ngay.',
};

async function getPosts(): Promise<RecruitmentPost[]> {
  try {
    const res = await fetch(`${BASE}/api/recruitment`, { next: { revalidate: 60 } });
    return res.ok ? res.json() : [];
  } catch { return []; }
}

// Server component: lấy dữ liệu để SEO/index được, phần hiển thị song ngữ giao
// cho client component vì ngôn ngữ đang chọn nằm ở AppContext.
export default async function RecruitmentPage() {
  const posts = await getPosts();
  return <RecruitmentList initialPosts={posts} />;
}
