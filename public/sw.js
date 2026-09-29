/*
 * Service worker tối giản cho PWA Lon Fanta FC.
 * Mục đích: đủ điều kiện "cài đặt lên màn hình chính" và có trang dự phòng
 * khi mất mạng. KHÔNG cache nội dung động (HTML, API) để dữ liệu luôn mới;
 * chỉ cache icon/font tĩnh theo kiểu stale-while-revalidate.
 */
const VERSION = 'lffc-v1';
const OFFLINE_URL = '/offline.html';
const STATIC_CACHE = `${VERSION}-static`;

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(STATIC_CACHE).then((cache) => cache.addAll([OFFLINE_URL, '/icons/icon-192.png'])),
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k.startsWith('lffc-') && k !== STATIC_CACHE).map((k) => caches.delete(k))),
    ).then(() => self.clients.claim()),
  );
});

self.addEventListener('fetch', (event) => {
  const { request } = event;
  if (request.method !== 'GET') return;

  // Điều hướng trang: luôn lấy từ mạng; mất mạng thì hiện trang offline.
  if (request.mode === 'navigate') {
    event.respondWith(fetch(request).catch(() => caches.match(OFFLINE_URL)));
    return;
  }

  // Icon / ảnh tĩnh cùng origin: trả cache trước, cập nhật ngầm.
  const url = new URL(request.url);
  if (url.origin === self.location.origin && (url.pathname.startsWith('/icons/') || url.pathname.startsWith('/images/'))) {
    event.respondWith(
      caches.open(STATIC_CACHE).then(async (cache) => {
        const cached = await cache.match(request);
        const network = fetch(request).then((res) => {
          if (res.ok) cache.put(request, res.clone());
          return res;
        }).catch(() => cached);
        return cached || network;
      }),
    );
  }
});
