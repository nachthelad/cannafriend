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

// =============================================================================
// PUSH NOTIFICATIONS
// =============================================================================

// Listen for push events
self.addEventListener('push', (event) => {
  console.log('Push event received:', event);

  let notificationData = {
    title: 'Cannafriend',
    body: 'You have a new notification',
    icon: '/icon-192x192.png',
    badge: '/icon-192x192.png',
    tag: 'default',
    data: {},
    actions: []
  };

  // Parse push data if available
  if (event.data) {
    try {
      const pushData = event.data.json();
      notificationData = { ...notificationData, ...pushData };
    } catch (error) {
      console.error('Error parsing push data:', error);
      notificationData.body = event.data.text() || notificationData.body;
    }
  }

  // Show notification
  const notificationPromise = self.registration.showNotification(notificationData.title, {
    body: notificationData.body,
    icon: notificationData.icon,
    badge: notificationData.badge,
    tag: notificationData.tag,
    data: notificationData.data,
    actions: notificationData.actions,
    requireInteraction: false,
    silent: false,
    vibrate: [200, 100, 200], // Vibration pattern for mobile
    renotify: true // Allow replacing existing notifications with same tag
  });

  event.waitUntil(notificationPromise);
});

// Listen for notification click events
self.addEventListener('notificationclick', (event) => {
  console.log('Notification clicked:', event);

  event.notification.close();

  // Determine what to do based on action
  let urlToOpen = null;

  if (event.action === 'mark_done') {
    // Just close notification, don't navigate
    console.log('Mark done clicked, closing notification');
    return;
  } else if (event.action === 'view_plant') {
    // Navigate to plant page
    urlToOpen = event.notification.data?.url || '/plants';
  } else if (event.action === 'view_journal') {
    // Navigate to journal
    urlToOpen = '/journal';
  } else if (event.action === 'open_app') {
    // Navigate to home
    urlToOpen = '/';
  } else if (!event.action) {
    // User clicked notification body (not action buttons, not dismiss)
    // Navigate to the URL specified in notification data
    urlToOpen = event.notification.data?.url || '/';
  }

  // Only navigate if we have a URL (ignore dismiss clicks)
  if (!urlToOpen) {
    console.log('No URL to navigate to, just closing notification');
    return;
  }

  // Focus existing window or open new one
  const promiseChain = clients.matchAll({
    type: 'window',
    includeUncontrolled: true
  }).then((windowClients) => {
    // Check if there's already a window open
    let matchingClient = null;

    for (let i = 0; i < windowClients.length; i++) {
      const windowClient = windowClients[i];

      // If we find a window that matches our domain, focus it
      if (windowClient.url.includes(self.location.origin)) {
        matchingClient = windowClient;
        break;
      }
    }

    if (matchingClient) {
      // Navigate existing window to the target URL and focus it
      return matchingClient.navigate(urlToOpen).then(() => matchingClient.focus());
    } else {
      // Open new window
      return clients.openWindow(urlToOpen);
    }
  });

  event.waitUntil(promiseChain);
});

// Listen for notification close events (optional analytics)
self.addEventListener('notificationclose', (event) => {
  console.log('Notification closed:', event.notification.tag);

  // Optional: Track notification dismissal analytics
  // You could send this data to your analytics endpoint
});

