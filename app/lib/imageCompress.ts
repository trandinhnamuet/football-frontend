// Shrinks images in the browser before they are uploaded: big camera/screenshot
// files become web-sized WebP without a visible quality drop, and the server
// never has to store (or serve) a 6 MB JPEG.

export interface CompressResult {
  file: File;
  originalSize: number;
  size: number;
  /** True when the original was kept as-is (already small, or not re-encodable). */
  skipped: boolean;
}

const MAX_DIMENSION = 1920;
const TARGET_BYTES = 500 * 1024;
// Tried in order; the first result under TARGET_BYTES wins, otherwise the smallest.
const QUALITY_STEPS = [0.86, 0.78, 0.7, 0.62];
// Animated GIFs and vectors would be destroyed by a canvas round-trip.
const NEVER_RECOMPRESS = ['image/gif', 'image/svg+xml'];

let webpSupport: boolean | null = null;

function supportsWebp(): boolean {
  if (webpSupport === null) {
    const c = document.createElement('canvas');
    c.width = c.height = 1;
    webpSupport = c.toDataURL('image/webp').startsWith('data:image/webp');
  }
  return webpSupport;
}

async function decode(file: File): Promise<{ source: CanvasImageSource; width: number; height: number; close: () => void }> {
  try {
    // `from-image` keeps EXIF-rotated phone photos upright.
    const bitmap = await createImageBitmap(file, { imageOrientation: 'from-image' });
    return { source: bitmap, width: bitmap.width, height: bitmap.height, close: () => bitmap.close() };
  } catch {
    // Safari/older browsers: fall back to a plain <img>.
    const url = URL.createObjectURL(file);
    try {
      const img = await new Promise<HTMLImageElement>((resolve, reject) => {
        const el = new Image();
        el.onload = () => resolve(el);
        el.onerror = () => reject(new Error('Không đọc được file ảnh'));
        el.src = url;
      });
      return {
        source: img,
        width: img.naturalWidth,
        height: img.naturalHeight,
        close: () => URL.revokeObjectURL(url),
      };
    } catch (e) {
      URL.revokeObjectURL(url);
      throw e;
    }
  }
}

function toBlob(canvas: HTMLCanvasElement, type: string, quality: number): Promise<Blob | null> {
  return new Promise(resolve => canvas.toBlob(resolve, type, quality));
}

function renamed(name: string, ext: string): string {
  const base = name.replace(/\.[^.]+$/, '') || 'image';
  // Keep the server-side filename tidy and URL-safe.
  const slug = base
    .normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/đ/gi, 'd')
    .replace(/[^a-zA-Z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 60)
    .toLowerCase();
  return `${slug || 'image'}.${ext}`;
}

export async function compressImage(file: File): Promise<CompressResult> {
  const originalSize = file.size;
  const keepOriginal = (): CompressResult => ({
    file: new File([file], renamed(file.name, (file.name.split('.').pop() || 'jpg').toLowerCase()), { type: file.type }),
    originalSize,
    size: originalSize,
    skipped: true,
  });

  if (NEVER_RECOMPRESS.includes(file.type)) return keepOriginal();

  let decoded;
  try {
    decoded = await decode(file);
  } catch {
    return keepOriginal();
  }

  try {
    const { source, width, height } = decoded;
    if (!width || !height) return keepOriginal();

    const scale = Math.min(1, MAX_DIMENSION / Math.max(width, height));
    const canvas = document.createElement('canvas');
    canvas.width = Math.round(width * scale);
    canvas.height = Math.round(height * scale);

    const ctx = canvas.getContext('2d');
    if (!ctx) return keepOriginal();
    ctx.imageSmoothingQuality = 'high';
    ctx.drawImage(source, 0, 0, canvas.width, canvas.height);

    const useWebp = supportsWebp();
    const type = useWebp ? 'image/webp' : 'image/jpeg';
    const ext = useWebp ? 'webp' : 'jpg';

    let best: Blob | null = null;
    for (const quality of QUALITY_STEPS) {
      const blob = await toBlob(canvas, type, quality);
      if (!blob) continue;
      if (!best || blob.size < best.size) best = blob;
      if (blob.size <= TARGET_BYTES) break;
    }

    // Re-encoding an already-optimised image can make it bigger — don't.
    if (!best || (scale === 1 && best.size >= originalSize)) return keepOriginal();

    return {
      file: new File([best], renamed(file.name, ext), { type }),
      originalSize,
      size: best.size,
      skipped: false,
    };
  } finally {
    decoded.close();
  }
}

export function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}
