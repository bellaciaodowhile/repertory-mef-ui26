// Service Worker for Música en Familia 2026 PWA - Network First
const CACHE_NAME = 'musica-en-familia-v3';

self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) {
            return caches.delete(key);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;

  const url = new URL(event.request.url);

  // Bypass chrome-extension and non-http schemes
  if (!url.protocol.startsWith('http')) return;

  // Never cache live dev requests or vite hot-modules
  if (
    url.pathname.startsWith('/src/') ||
    url.pathname.startsWith('/@vite') ||
    url.pathname.startsWith('/@fs') ||
    url.pathname.includes('node_modules')
  ) {
    event.respondWith(fetch(event.request));
    return;
  }

  // Network-First strategy: Always fetch freshest files from server first.
  // Fall back to cache only if device is completely offline.
  event.respondWith(
    fetch(event.request)
      .then((networkResponse) => {
        if (
          networkResponse &&
          networkResponse.status === 200 &&
          url.origin === self.location.origin
        ) {
          const cloned = networkResponse.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, cloned);
          });
        }
        return networkResponse;
      })
      .catch(() => {
        return caches.match(event.request).then((cached) => {
          if (cached) return cached;
          if (event.request.mode === 'navigate') {
            return caches.match('/index.html') || caches.match('/');
          }
          return null;
        });
      })
  );
});
