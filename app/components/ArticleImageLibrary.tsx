'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { api, API_BASE, ArticleImage } from '../lib/api';
import { compressImage, formatBytes } from '../lib/imageCompress';
import { FANTA } from '../lib/types';

const CARD = 'var(--card)';
const INK = 'var(--ink)';
const MUTED = 'var(--muted)';
const LINE = 'var(--line)';
// Text sitting on a FANTA-orange fill stays dark in both themes.
const ON_FANTA = '#0a0a0a';

/** Absolute URL — article HTML is rendered on the site domain, not the API domain. */
export function absoluteUrl(url: string) {
  return url.startsWith('http') ? url : `${API_BASE}${url}`;
}

export function imageHtml(url: string) {
  return `<img src="${absoluteUrl(url)}" alt="" style="width:100%;height:auto;display:block;margin:24px 0;" />`;
}

async function copy(text: string) {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    // clipboard API needs HTTPS / permission — fall back to the old trick.
    const ta = document.createElement('textarea');
    ta.value = text;
    ta.style.position = 'fixed';
    ta.style.opacity = '0';
    document.body.appendChild(ta);
    ta.select();
    const ok = document.execCommand('copy');
    document.body.removeChild(ta);
    return ok;
  }
}

export default function ArticleImageLibrary({
  password,
  onInsert,
}: {
  password: string;
  onInsert?: (html: string) => void;
}) {
  const [images, setImages] = useState<ArticleImage[]>([]);
  const [loading, setLoading] = useState(true);
  const [progress, setProgress] = useState('');
  const [error, setError] = useState('');
  const [flash, setFlash] = useState('');
  const [deleting, setDeleting] = useState<string | null>(null);
  const fileInput = useRef<HTMLInputElement>(null);

  // No synchronous setState here — the first statement awaits, so mounting this
  // effect does not trigger a cascading render.
  const load = useCallback(async () => {
    try {
      setImages(await api.getArticleImages(password));
      setError('');
    } catch {
      setError('Không tải được danh sách ảnh');
    } finally {
      setLoading(false);
    }
  }, [password]);

  // eslint-disable-next-line react-hooks/set-state-in-effect -- fetch-on-mount; every setState in load() happens after an await
  useEffect(() => { load(); }, [load]);

  function reload() {
    setLoading(true);
    load();
  }

  function notify(msg: string) {
    setFlash(msg);
    setTimeout(() => setFlash(''), 2500);
  }

  async function handleFiles(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;
    setError('');
    let saved = 0;
    let uploadedTotal = 0;

    for (let i = 0; i < files.length; i++) {
      const original = files[i];
      setProgress(`Đang nén ${i + 1}/${files.length}: ${original.name}`);
      try {
        const result = await compressImage(original);
        setProgress(`Đang tải lên ${i + 1}/${files.length}: ${formatBytes(result.originalSize)} → ${formatBytes(result.size)}`);
        await api.uploadArticleImage(result.file, password);
        saved += result.originalSize - result.size;
        uploadedTotal += result.size;
      } catch (err: unknown) {
        setError(`Upload "${original.name}" thất bại: ${(err as Error)?.message || 'lỗi không xác định'}`);
      }
    }

    setProgress('');
    if (fileInput.current) fileInput.current.value = '';
    await load();
    if (uploadedTotal > 0) {
      notify(saved > 0 ? `Đã tải lên, tiết kiệm ${formatBytes(saved)}` : 'Đã tải lên');
    }
  }

  async function handleDelete(img: ArticleImage) {
    if (!confirm(`Xóa ảnh "${img.filename}"?\n\nẢnh sẽ biến mất khỏi mọi bài viết đang nhúng nó.`)) return;
    setDeleting(img.filename);
    try {
      await api.deleteArticleImage(img.filename, password);
      setImages(list => list.filter(i => i.filename !== img.filename));
    } catch {
      setError('Xóa ảnh thất bại');
    } finally {
      setDeleting(null);
    }
  }

  const btn: React.CSSProperties = {
    background: 'var(--hover-bg)', color: INK, border: `1px solid ${LINE}`,
    padding: '5px 8px', fontFamily: 'inherit', fontSize: 11, cursor: 'pointer', flex: 1,
  };

  return (
    <div style={{ border: `1px solid ${LINE}`, background: 'var(--soft)', padding: 20 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 16, flexWrap: 'wrap', marginBottom: 14 }}>
        <div>
          <div style={{ fontFamily: 'Anton, sans-serif', fontSize: 18, textTransform: 'uppercase', color: FANTA }}>
            Thư viện ảnh
          </div>
          <div style={{ fontSize: 12, color: MUTED, marginTop: 2 }}>
            Ảnh được tự động nén (tối đa 1920px, WebP) trước khi tải lên. Bấm <b>Chèn</b> để thêm vào nội dung tại vị trí con trỏ.
          </div>
        </div>
        <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
          <input ref={fileInput} type="file" accept="image/*" multiple onChange={handleFiles} style={{ display: 'none' }} />
          <button
            type="button"
            onClick={() => fileInput.current?.click()}
            disabled={!!progress}
            style={{ background: FANTA, color: ON_FANTA, border: 'none', padding: '10px 20px', fontFamily: 'Anton, sans-serif', fontSize: 14, letterSpacing: '0.06em', textTransform: 'uppercase', cursor: progress ? 'default' : 'pointer', opacity: progress ? 0.6 : 1 }}
          >
            + Tải ảnh lên
          </button>
          <button type="button" onClick={reload} style={{ ...btn, flex: 'none', padding: '10px 14px' }}>Tải lại</button>
        </div>
      </div>

      {progress && <div style={{ fontSize: 12, color: FANTA, marginBottom: 10 }}>{progress}</div>}
      {flash && <div style={{ fontSize: 12, color: '#1f8a5b', marginBottom: 10 }}>✓ {flash}</div>}
      {error && <div style={{ fontSize: 12, color: '#cc4444', marginBottom: 10 }}>{error}</div>}

      {loading ? (
        <div style={{ color: MUTED, fontSize: 13, padding: '20px 0' }}>Đang tải ảnh...</div>
      ) : images.length === 0 ? (
        <div style={{ color: MUTED, fontSize: 13, padding: '20px 0' }}>Chưa có ảnh nào. Tải ảnh lên để lấy link nhúng.</div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(170px, 1fr))', gap: 12, maxHeight: 420, overflowY: 'auto' }}>
          {images.map(img => (
            <div key={img.filename} style={{ background: CARD, border: `1px solid ${LINE}`, display: 'flex', flexDirection: 'column' }}>
              <a href={absoluteUrl(img.url)} target="_blank" rel="noreferrer" style={{ display: 'block', height: 110, background: 'var(--alt-bg)', overflow: 'hidden' }}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={absoluteUrl(img.url)} alt={img.filename} loading="lazy" style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
              </a>
              <div style={{ padding: 8, display: 'grid', gap: 6 }}>
                <div style={{ fontSize: 10, color: MUTED, wordBreak: 'break-all', lineHeight: 1.3 }}>{img.filename}</div>
                <div style={{ fontSize: 10, color: MUTED }}>{formatBytes(img.size)}</div>
                <div style={{ display: 'flex', gap: 4 }}>
                  {onInsert && (
                    <button type="button" onClick={() => { onInsert(imageHtml(img.url)); notify('Đã chèn vào nội dung'); }}
                      style={{ ...btn, background: 'rgba(255,107,26,0.18)', color: FANTA, borderColor: `${FANTA}55` }}>
                      Chèn
                    </button>
                  )}
                  <button type="button" onClick={async () => notify(await copy(absoluteUrl(img.url)) ? 'Đã copy link' : 'Không copy được')} style={btn}>
                    Link
                  </button>
                  <button type="button" onClick={async () => notify(await copy(imageHtml(img.url)) ? 'Đã copy thẻ <img>' : 'Không copy được')} style={btn}>
                    HTML
                  </button>
                </div>
                <button type="button" onClick={() => handleDelete(img)} disabled={deleting === img.filename}
                  style={{ ...btn, background: 'rgba(204,68,68,0.1)', color: '#cc4444', borderColor: 'rgba(204,68,68,0.3)' }}>
                  {deleting === img.filename ? '...' : 'Xóa'}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
