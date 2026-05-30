const CACHE_VERSION = 'timemark-v1';
const CORE_CACHE = `core-${CACHE_VERSION}`;
const FONT_CACHE = `fonts-${CACHE_VERSION}`;

const CORE_ASSETS = [
  './',
  './index.html',
  './manifest.webmanifest',
  './assets/js/heic2jpg.js',
  './assets/images/real.jpg',
  './assets/icons/timemark-icon.svg',
  './assets/icons/shield-check-svgrepo-com.svg',
  'https://html2canvas.hertzen.com/dist/html2canvas.min.js'
];

const FONT_HOSTS = ['fonts.googleapis.com', 'fonts.gstatic.com'];

self.addEventListener('install', event => {
  event.waitUntil((async () => {
    const cache = await caches.open(CORE_CACHE);
    await cache.addAll(CORE_ASSETS);
    self.skipWaiting();
  })());
});

self.addEventListener('activate', event => {
  event.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(
      keys.filter(key => key !== CORE_CACHE && key !== FONT_CACHE)
        .map(key => caches.delete(key))
    );
    await self.clients.claim();
  })());
});

self.addEventListener('fetch', event => {
  if (event.request.method !== 'GET') {
    return;
  }

  const requestUrl = new URL(event.request.url);

  if (event.request.mode === 'navigate') {
    event.respondWith((async () => {
      try {
        const networkResponse = await fetch(event.request);
        const cache = await caches.open(CORE_CACHE);
        cache.put('./', networkResponse.clone());
        return networkResponse;
      } catch (error) {
        const cache = await caches.open(CORE_CACHE);
        const cachedResponse = await cache.match('./');
        return cachedResponse || cache.match('./index.html');
      }
    })());
    return;
  }

  if (FONT_HOSTS.includes(requestUrl.hostname)) {
    event.respondWith((async () => {
      const cache = await caches.open(FONT_CACHE);
      const cachedResponse = await cache.match(event.request);
      if (cachedResponse) {
        return cachedResponse;
      }

      try {
        const networkResponse = await fetch(event.request);
        if (networkResponse && (networkResponse.ok || networkResponse.type === 'opaque')) {
          cache.put(event.request, networkResponse.clone());
        }
        return networkResponse;
      } catch (error) {
        return cachedResponse;
      }
    })());
    return;
  }

  if (requestUrl.origin === self.location.origin || requestUrl.href === 'https://html2canvas.hertzen.com/dist/html2canvas.min.js') {
    event.respondWith((async () => {
      const cache = await caches.open(CORE_CACHE);
      const cachedResponse = await cache.match(event.request);
      if (cachedResponse) {
        return cachedResponse;
      }

      try {
        const networkResponse = await fetch(event.request);
        if (networkResponse && (networkResponse.ok || networkResponse.type === 'opaque')) {
          cache.put(event.request, networkResponse.clone());
        }
        return networkResponse;
      } catch (error) {
        return cachedResponse;
      }
    })());
  }
});