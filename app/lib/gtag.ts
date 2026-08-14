/** Helper bắn event GA4 từ phía client. No-op khi gtag chưa nạp (dev, ad-blocker). */

declare global {
  interface Window {
    gtag?: (command: 'event' | 'config' | 'js', target: string, params?: Record<string, unknown>) => void;
  }
}

export function trackEvent(name: string, params?: Record<string, unknown>) {
  if (typeof window === 'undefined' || typeof window.gtag !== 'function') return;
  window.gtag('event', name, params);
}
