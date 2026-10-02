'use client';

import { useEffect, useState, useSyncExternalStore } from 'react';
import { trackEvent } from '../lib/gtag';

const FANTA = '#FF6B1A';

type Props = { url: string; title: string; id: string | number };

const ICON = { width: 18, height: 18, viewBox: '0 0 24 24', fill: 'currentColor', 'aria-hidden': true } as const;

function FacebookIcon() {
  return (
    <svg {...ICON}>
      <path d="M24 12.073C24 5.405 18.629 0 12 0S0 5.405 0 12.073C0 18.1 4.388 23.094 10.125 24v-8.437H7.078v-3.49h3.047V9.41c0-3.025 1.792-4.697 4.533-4.697 1.312 0 2.686.236 2.686.236v2.97h-1.514c-1.491 0-1.956.93-1.956 1.884v2.25h3.328l-.532 3.49h-2.796V24C19.612 23.094 24 18.1 24 12.073z"/>
    </svg>
  );
}

function XIcon() {
  return (
    <svg {...ICON}>
      <path d="M18.901 1.153h3.68l-8.04 9.19L24 22.846h-7.406l-5.8-7.584-6.638 7.584H.474l8.6-9.83L0 1.154h7.594l5.243 6.932ZM17.61 20.644h2.039L6.486 3.24H4.298Z"/>
    </svg>
  );
}

function TelegramIcon() {
  return (
    <svg {...ICON}>
      <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z"/>
    </svg>
  );
}

function LinkIcon() {
  return (
    <svg {...ICON} fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
      <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
    </svg>
  );
}

function CheckIcon() {
  return (
    <svg {...ICON} fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
      <path d="M20 6 9 17l-5-5" />
    </svg>
  );
}

function ShareIcon() {
  return (
    <svg {...ICON} fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <circle cx="18" cy="5" r="3" /><circle cx="6" cy="12" r="3" /><circle cx="18" cy="19" r="3" />
      <path d="m8.59 13.51 6.83 3.98M15.41 6.51l-6.82 3.98" />
    </svg>
  );
}

const noopSubscribe = () => () => {};

/**
 * Nút chia sẻ bài viết. Zalo / Messenger không có link chia sẻ dùng được trên
 * web mà không cần app ID, nên trên điện thoại dựa vào nút "Chia sẻ" gốc của
 * hệ điều hành (Web Share API) — bảng chọn đó có sẵn Zalo, Messenger...
 */
export default function ShareButtons({ url, title, id }: Props) {
  // navigator.share chỉ biết được ở client — server snapshot = false để không lệch hydration.
  const canNativeShare = useSyncExternalStore(
    noopSubscribe,
    () => typeof navigator.share === 'function',
    () => false,
  );
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!copied) return;
    const timer = setTimeout(() => setCopied(false), 2000);
    return () => clearTimeout(timer);
  }, [copied]);

  const track = (method: string) => trackEvent('share', { method, content_type: 'article', item_id: String(id) });

  const u = encodeURIComponent(url);
  const t = encodeURIComponent(title);
  const links = [
    { method: 'facebook', label: 'Facebook', href: `https://www.facebook.com/sharer/sharer.php?u=${u}`, icon: <FacebookIcon /> },
    { method: 'x', label: 'X', href: `https://x.com/intent/post?url=${u}&text=${t}`, icon: <XIcon /> },
    { method: 'telegram', label: 'Telegram', href: `https://t.me/share/url?url=${u}&text=${t}`, icon: <TelegramIcon /> },
  ];

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(url);
    } catch {
      // Clipboard API bị chặn (http, iframe cũ) — fallback qua textarea ẩn.
      const el = document.createElement('textarea');
      el.value = url;
      el.style.position = 'fixed';
      el.style.opacity = '0';
      document.body.appendChild(el);
      el.select();
      document.execCommand('copy');
      el.remove();
    }
    setCopied(true);
    track('copy_link');
  }

  async function nativeShare() {
    try {
      await navigator.share({ title, url });
      track('native');
    } catch {
      // Người dùng đóng bảng chia sẻ — không làm gì.
    }
  }

  return (
    <div className="share-bar">
      {/* Nút chia sẻ gốc đã ghi "Chia sẻ" — bỏ nhãn cho khỏi lặp chữ. */}
      {!canNativeShare && <span className="share-bar-label">Chia sẻ</span>}
      <div className="share-bar-buttons">
        {canNativeShare && (
          <button type="button" className="share-btn share-btn-native" onClick={nativeShare} aria-label="Chia sẻ qua ứng dụng khác">
            <ShareIcon /><span>Chia sẻ</span>
          </button>
        )}
        {links.map((l) => (
          <a
            key={l.method}
            className="share-btn"
            href={l.href}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={`Chia sẻ lên ${l.label}`}
            title={`Chia sẻ lên ${l.label}`}
            onClick={() => track(l.method)}
          >
            {l.icon}
          </a>
        ))}
        <button
          type="button"
          className="share-btn"
          onClick={copyLink}
          aria-label="Sao chép liên kết"
          title={copied ? 'Đã sao chép liên kết' : 'Sao chép liên kết'}
          style={copied ? { borderColor: FANTA, color: FANTA } : undefined}
        >
          {copied ? <CheckIcon /> : <LinkIcon />}
        </button>
        <span role="status" aria-live="polite" className="sr-only">
          {copied ? 'Đã sao chép liên kết' : ''}
        </span>
      </div>
    </div>
  );
}
