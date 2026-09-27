import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import RecruitmentDetail from '../RecruitmentDetail';
import { RecruitmentPost } from '../../lib/types';

const BASE = (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001').replace(/\/$/, '');

async function getPost(slug: string): Promise<RecruitmentPost | null> {
  try {
    const res = await fetch(`${BASE}/api/recruitment/${encodeURIComponent(slug)}`, { next: { revalidate: 60 } });
    if (!res.ok) return null;
    return res.json();
  } catch { return null; }
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const post = await getPost(slug);
  if (!post) return { title: 'Tuyển quân | Lon Fanta FC' };
  return {
    title: `${post.title} | Lon Fanta FC`,
    description: post.excerpt || 'Lon Fanta FC đang tuyển thêm thành viên.',
  };
}

export default async function RecruitmentPostPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const post = await getPost(slug);
  if (!post) notFound();
  return <RecruitmentDetail post={post} />;
}
