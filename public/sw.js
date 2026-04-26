/* global workbox */
/* eslint-disable no-undef */

// Cache version — increment this on each production deploy to force SW refresh
const CACHE_VERSION = "v10";

// Workbox from CDN
importScripts(
  "https://storage.googleapis.com/workbox-cdn/releases/6.5.4/workbox-sw.js"
);

// Enable logging in dev
workbox.setConfig({ debug: false });

// Precache minimal app shell and key routes
const PRECACHE_URLS = ["/offline"];

workbox.precaching.precacheAndRoute(
  PRECACHE_URLS.map((url) => ({ url, revision: null }))
); // revision null for manual list
workbox.precaching.cleanupOutdatedCaches();

// Navigation preload
self.addEventListener("activate", (event) => {
  event.waitUntil(
    (async () => {
      if ("navigationPreload" in self.registration) {
        await self.registration.navigationPreload.enable();
      }

      const apiCache = await caches.open("api-json-cache");
      const cachedRequests = await apiCache.keys();
      await Promise.all(
        cachedRequests
          .filter((request) => new URL(request.url).pathname === "/api/version")
          .map((request) => apiCache.delete(request))
      );

      // Remove legacy precached navigations that could serve stale shells
      const precacheCacheNames = await caches.keys();
      await Promise.all(
        precacheCacheNames
          .filter((name) => name.startsWith("workbox-precache"))
          .map(async (cacheName) => {
            const cache = await caches.open(cacheName);
            await Promise.all(
              ["/", "/plants", "/journal"].map((url) =>
                cache.delete(url).catch(() => false)
              )
            );
          })
      );

      await self.clients.claim();
    })()
  );
});

self.addEventListener("message", (event) => {
  // Allow clients to request immediate activation of the updated worker.
  if (event.data?.type === "SKIP_WAITING") {
    self.skipWaiting();

    event.waitUntil(
      (async () => {
        await new Promise((resolve) => {
          const checkActivation = () => {
            if (self.registration.active === self) {
              resolve();
              return;
            }
            setTimeout(checkActivation, 50);
          };
          checkActivation();
        });

        await self.clients.claim();

        const clientList = await self.clients.matchAll({
          type: "window",
          includeUncontrolled: true,
        });
        for (const client of clientList) {
          client.postMessage({ type: "RELOAD_PAGE" });
        }
      })()
    );
  }
});

// Runtime caching
const { registerRoute } = workbox.routing;
const { CacheFirst, StaleWhileRevalidate, NetworkFirst, NetworkOnly } =
  workbox.strategies;
const { ExpirationPlugin } = workbox.expiration;
const { BackgroundSyncPlugin } = workbox.backgroundSync;

// Firebase Storage images → CacheFirst (URLs are unique per upload, safe to cache long)
registerRoute(
  ({ url }) => url.hostname === "firebasestorage.googleapis.com",
  new CacheFirst({
    cacheName: `firebase-images-${CACHE_VERSION}`,
    plugins: [
      new ExpirationPlugin({
        maxEntries: 200,
        maxAgeSeconds: 30 * 24 * 60 * 60,
      }),
    ],
  })
);

// Same-origin images (favicon, logos, public assets) → StaleWhileRevalidate
// so updates are picked up on the next visit after a deploy
registerRoute(
  ({ request, url }) =>
    request.destination === "image" &&
    url.hostname === self.location.hostname,
  new StaleWhileRevalidate({
    cacheName: `images-${CACHE_VERSION}`,
    plugins: [
      new ExpirationPlugin({
        maxEntries: 100,
        maxAgeSeconds: 7 * 24 * 60 * 60,
      }),
    ],
  })
);

// Next static assets (content-hashed URLs → safe to cache forever)
registerRoute(
  ({ url }) => url.pathname.startsWith("/_next/static/"),
  new CacheFirst({
    cacheName: `next-static-${CACHE_VERSION}`,
    plugins: [
      new ExpirationPlugin({
        maxEntries: 200,
        maxAgeSeconds: 365 * 24 * 60 * 60,
      }),
    ],
  })
);

// API version endpoint – always fetch the latest version
registerRoute(({ url }) => url.pathname === "/api/version", new NetworkOnly());

// API/JSON responses
registerRoute(
  ({ url, request }) =>
    (url.pathname.startsWith("/api/") && url.pathname !== "/api/version") ||
    (request.destination === "document" && url.pathname.endsWith(".json")),
  new StaleWhileRevalidate({ cacheName: `api-json-${CACHE_VERSION}` })
);

// Translations JSON (any JSON under /locales or /lib/locales)
registerRoute(
  ({ url }) =>
    url.pathname.includes("/locales/") ||
    url.pathname.includes("/lib/locales/"),
  new StaleWhileRevalidate({
    cacheName: `i18n-${CACHE_VERSION}`,
    plugins: [
      new ExpirationPlugin({ maxEntries: 100, maxAgeSeconds: 24 * 60 * 60 }),
    ],
  })
);

// HTML navigations: Network-first with offline fallback
registerRoute(
  ({ request }) => request.mode === "navigate",
  new NetworkFirst({ cacheName: `pages-${CACHE_VERSION}` })
);

// Catch handler for failed navigations -> offline
workbox.routing.setCatchHandler(async ({ event }) => {
  if (event.request.destination === "document") {
    const cache = await caches.open("pages-cache");
    const cached = await cache.match("/offline");
    if (cached) return cached;
    return Response.redirect("/offline", 302);
  }
  return Response.error();
});

// Background Sync for failed POSTs to /api/*
// POST requests cannot be cached (Cache API doesn't support it), so use NetworkOnly
const apiQueue = new BackgroundSyncPlugin("api-post-queue", {
  maxRetentionTime: 24 * 60,
});
registerRoute(
  ({ url, request }) =>
    url.pathname.startsWith("/api/") && request.method === "POST",
  new NetworkOnly({ plugins: [apiQueue] }),
  "POST"
);

// End of Service Worker logic
