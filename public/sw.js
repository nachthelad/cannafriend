/* global workbox */
/* eslint-disable no-undef */

// Workbox from CDN
importScripts('https://storage.googleapis.com/workbox-cdn/releases/6.5.4/workbox-sw.js');

// Enable logging in dev
workbox.setConfig({ debug: false });

// Precache minimal app shell and key routes
const PRECACHE_URLS = [
  '/',
  '/plants',
  '/journal',
  '/offline',
];

workbox.precaching.precacheAndRoute(PRECACHE_URLS.map((url) => ({ url, revision: null }))); // revision null for manual list

// Navigation preload
self.addEventListener('activate', (event) => {
  event.waitUntil((async () => {
    if ('navigationPreload' in self.registration) {
      await self.registration.navigationPreload.enable();
    }
    await self.clients.claim();
  })());
});

// Runtime caching
const { registerRoute } = workbox.routing;
const { CacheFirst, StaleWhileRevalidate, NetworkFirst } = workbox.strategies;
const { ExpirationPlugin } = workbox.expiration;
const { BackgroundSyncPlugin } = workbox.backgroundSync;

// Images (same-origin and Firebase Storage)
registerRoute(
  ({ request, url }) => request.destination === 'image' || url.hostname === 'firebasestorage.googleapis.com',
  new CacheFirst({
    cacheName: 'images-cache',
    plugins: [new ExpirationPlugin({ maxEntries: 200, maxAgeSeconds: 30 * 24 * 60 * 60 })],
  })
);

// Next static assets
registerRoute(
  ({ url }) => url.pathname.startsWith('/_next/static/'),
  new CacheFirst({ cacheName: 'next-static-cache', plugins: [new ExpirationPlugin({ maxEntries: 200, maxAgeSeconds: 365 * 24 * 60 * 60 })] })
);

// API/JSON responses
registerRoute(
  ({ url, request }) => url.pathname.startsWith('/api/') || request.destination === 'document' && url.pathname.endsWith('.json'),
  new StaleWhileRevalidate({ cacheName: 'api-json-cache' })
);

// Translations JSON (any JSON under /locales or /lib/locales)
registerRoute(
  ({ url }) => url.pathname.includes('/locales/') || url.pathname.includes('/lib/locales/'),
  new StaleWhileRevalidate({ cacheName: 'i18n-cache', plugins: [new ExpirationPlugin({ maxEntries: 100, maxAgeSeconds: 24 * 60 * 60 })] })
);

// HTML navigations: Network-first with offline fallback
registerRoute(
  ({ request }) => request.mode === 'navigate',
  new NetworkFirst({ cacheName: 'pages-cache' })
);

// Catch handler for failed navigations -> offline
workbox.routing.setCatchHandler(async ({ event }) => {
  if (event.request.destination === 'document') {
    const cache = await caches.open('pages-cache');
    const cached = await cache.match('/offline');
    if (cached) return cached;
    return Response.redirect('/offline', 302);
  }
  return Response.error();
});

// Background Sync for failed POSTs to /api/*
const apiQueue = new BackgroundSyncPlugin('api-post-queue', { maxRetentionTime: 24 * 60 });
registerRoute(
  ({ url, request }) => url.pathname.startsWith('/api/') && request.method === 'POST',
  new StaleWhileRevalidate({ cacheName: 'api-posts', plugins: [apiQueue] }),
  'POST'
);

