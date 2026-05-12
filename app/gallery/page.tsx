'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { api } from '../lib/api';
import type { DriveLink } from '../lib/types';

const FANTA = '#FF6B1A';

function getDriveEmbedUrl(url: string): string {
  // Extract file ID from full URL: https://drive.google.com/file/d/FILE_ID/view
  const fileMatch = url.match(/\/file\/d\/([^/]+)/);
  if (fileMatch) {
    return `https://drive.google.com/thumbnail?id=${fileMatch[1]}&sz=w800`;
  }
  // If input is just the file ID (alphanumeric, 20-60 chars)
  if (/^[a-zA-Z0-9_-]{20,}$/.test(url.trim())) {
    return `https://drive.google.com/thumbnail?id=${url.trim()}&sz=w800`;
  }
  // Extract from ?id= query param
  const openMatch = url.match(/[?&]id=([^&]+)/);
  if (openMatch) {
    return `https://drive.google.com/thumbnail?id=${openMatch[1]}&sz=w800`;
  }
  // Fallback to original
  return url;
}

export default function GalleryPage() {
  const [links, setLinks] = useState<DriveLink[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [lightbox, setLightbox] = useState<DriveLink | null>(null);

  useEffect(() => {
    api.getDriveLinksPublic()
      .then(setLinks)
      .catch(() => setError('Không thể tải dữ liệu'))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') setLightbox(null);
      if (e.key === 'ArrowRight' && lightbox) {
        const idx = links.findIndex(l => l.id === lightbox.id);
        if (idx < links.length - 1) setLightbox(links[idx + 1]);
      }
      if (e.key === 'ArrowLeft' && lightbox) {
        const idx = links.findIndex(l => l.id === lightbox.id);
        if (idx > 0) setLightbox(links[idx - 1]);
      }
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [lightbox, links]);

  return (
    <div style={{ background: 'var(--bg)', color: 'var(--ink)', fontFamily: '"Space Grotesk", system-ui, sans-serif', minHeight: '100vh' }}>
      {/* Header */}
      <header className="mob-gallery-hdr" style={{ padding: '48px 48px 32px', borderBottom: `1px solid ${FANTA}33` }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 20 }}>
          <Link href="/" style={{ color: FANTA, textDecoration: 'none', fontSize: 14, fontWeight: 600 }}>← Trang chủ</Link>
        </div>
        <h1 style={{ fontFamily: 'Anton, sans-serif', fontSize: 'clamp(48px, 8vw, 96px)', lineHeight: 0.92, textTransform: 'uppercase', margin: 0 }}>
          GALLERY <span style={{ color: FANTA }}>ẢNH</span>
        </h1>
        <p style={{ color: 'var(--muted)', fontSize: 15, marginTop: 12 }}>
          Khoảnh khắc đáng nhớ của Lon Fanta FC
        </p>
      </header>

      <main className="mob-gallery-main" style={{ padding: '48px' }}>
        {loading && (
          <div style={{ textAlign: 'center', padding: '80px 0', color: 'var(--muted)', fontSize: 16 }}>
            Đang tải ảnh...
          </div>
        )}

        {error && (
          <div style={{ textAlign: 'center', padding: '80px 0', color: '#f87171', fontSize: 16 }}>
            {error}
          </div>
        )}

        {!loading && !error && links.length === 0 && (
          <div style={{ textAlign: 'center', padding: '80px 0', color: 'var(--muted)', fontSize: 16 }}>
            Chưa có ảnh nào được đăng tải.
          </div>
        )}

        {links.length > 0 && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 20 }}>
            {links.map(link => {
              const embedUrl = getDriveEmbedUrl(link.url);
              return (
                <div
                  key={link.id}
                  onClick={() => setLightbox(link)}
                  style={{
                    cursor: 'pointer', background: 'var(--card)',
                    border: `1px solid ${FANTA}22`,
                    overflow: 'hidden', transition: 'all 0.2s ease',
                  }}
                  onMouseEnter={e => {
                    (e.currentTarget as HTMLElement).style.borderColor = `${FANTA}88`;
                    (e.currentTarget as HTMLElement).style.transform = 'translateY(-2px)';
                  }}
                  onMouseLeave={e => {
                    (e.currentTarget as HTMLElement).style.borderColor = `${FANTA}22`;
                    (e.currentTarget as HTMLElement).style.transform = 'none';
                  }}
                >
                  {/* Image container */}
                  <div style={{ aspectRatio: '4/3', overflow: 'hidden', background: '#111', position: 'relative' }}>
                    {embedUrl ? (
                      <img
                        src={embedUrl}
                        alt={link.title}
                        style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
                        loading="lazy"
                        onError={e => {
                          (e.currentTarget as HTMLImageElement).style.display = 'none';
                          const parent = (e.currentTarget as HTMLImageElement).parentElement;
                          if (parent) {
                            parent.innerHTML = `
                              <div style="display:flex;flex-direction:column;align-items:center;justify-content:center;height:100%;color:#666;font-size:12px;padding:16px;text-align:center;background:#0a0a0a">
                                <div style="margin-bottom:8px">❌ File ID không hợp lệ</div>
                                <div style="font-size:11px;color:#555">Lấy File ID từ:</div>
                                <div style="font-size:10px;color:#555;margin-top:4px">drive.google.com/file/d/<strong>ID_HERE</strong>/view</div>
                              </div>
                            `;
                          }
                        }}
                      />
                    ) : (
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: '#555', fontSize: 13 }}>
                        ❓ URL không hỗ trợ
                      </div>
                    )}
                  </div>
                  {/* Info */}
                  <div style={{ padding: '14px 16px' }}>
                    <div style={{ fontSize: 15, fontWeight: 600, color: 'var(--ink)' }}>{link.title}</div>
                    {link.description && <div style={{ fontSize: 13, color: 'var(--muted)', marginTop: 4 }}>{link.description}</div>}
                    {embedUrl && (
                      <a
                        href={embedUrl}
                        target="_blank"
                        rel="noreferrer"
                        onClick={e => e.stopPropagation()}
                        style={{ display: 'inline-block', marginTop: 8, fontSize: 12, color: FANTA, textDecoration: 'none', fontWeight: 600 }}
                      >
                        Mở hình ↗
                      </a>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>

      {/* Lightbox */}
      {lightbox && (
        <div
          onClick={() => setLightbox(null)}
          style={{
            position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.92)',
            zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24,
          }}
        >
          <div onClick={e => e.stopPropagation()} style={{ maxWidth: '90vw', maxHeight: '90vh', display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ color: '#fff', fontFamily: 'Anton, sans-serif', fontSize: 20, letterSpacing: '0.04em' }}>{lightbox.title}</div>
              <button onClick={() => setLightbox(null)} style={{ background: 'none', border: 'none', color: '#fff', fontSize: 24, cursor: 'pointer', padding: '4px 8px', lineHeight: 1 }}>×</button>
            </div>
            <img
              src={getDriveEmbedUrl(lightbox.url)}
              alt={lightbox.title}
              style={{ maxWidth: '85vw', maxHeight: '75vh', objectFit: 'contain', display: 'block' }}
              onError={e => {
                (e.currentTarget as HTMLImageElement).style.display = 'none';
                const parent = (e.currentTarget as HTMLImageElement).parentElement;
                if (parent) {
                  parent.innerHTML = `
                    <div style="color:#f87171;padding:40px;text-align:center;font-size:14px">
                      <div>❌ Không thể load ảnh</div>
                      <div style="margin-top:12px;font-size:12px;color:#999">File ID có thể không hợp lệ hoặc file đã bị xóa</div>
                    </div>
                  `;
                }
              }}
            />
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <button
                onClick={() => {
                  const idx = links.findIndex(l => l.id === lightbox.id);
                  if (idx > 0) setLightbox(links[idx - 1]);
                }}
                disabled={links.findIndex(l => l.id === lightbox.id) === 0}
                style={{ background: 'none', border: `1px solid rgba(255,255,255,0.2)`, color: '#fff', padding: '8px 16px', cursor: 'pointer', fontSize: 14 }}
              >
                ← Trước
              </button>
              <a href={getDriveEmbedUrl(lightbox.url)} target="_blank" rel="noreferrer" style={{ color: FANTA, fontSize: 13, textDecoration: 'none' }}>
                Mở hình ↗
              </a>
              <button
                onClick={() => {
                  const idx = links.findIndex(l => l.id === lightbox.id);
                  if (idx < links.length - 1) setLightbox(links[idx + 1]);
                }}
                disabled={links.findIndex(l => l.id === lightbox.id) === links.length - 1}
                style={{ background: 'none', border: `1px solid rgba(255,255,255,0.2)`, color: '#fff', padding: '8px 16px', cursor: 'pointer', fontSize: 14 }}
              >
                Sau →
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
