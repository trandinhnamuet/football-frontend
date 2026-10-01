import { renderArticleShareImage } from './share-image';

export const size = { width: 1200, height: 630 };
export const contentType = 'image/jpeg';
export const alt = 'Lon Fanta FC';
export const revalidate = 3600;

export default async function Image({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  return renderArticleShareImage(slug);
}
