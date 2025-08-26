// Service Worker for Cannafriend PWA
const CACHE_VERSION = "v4";
const STATIC_CACHE = `cannafriend-static-${CACHE_VERSION}`;
const DYNAMIC_CACHE = `cannafriend-dynamic-${CACHE_VERSION}`;
const IMAGE_CACHE = `cannafriend-images-${CACHE_VERSION}`;
const API_CACHE = `cannafriend-api-${CACHE_VERSION}`;

// Resources to precache - essential static assets only
const urlsToCache = [
  "/offline.html",
  "/manifest.json",
  "/icon-192x192.png",
  "/icon-512x512.png",
  "/favicon-16x16.png",
  "/favicon-32x32.png",
  "/placeholder.jpg",
  "/placeholder.svg",
  "/placeholder-logo.svg",
  "/placeholder-user.jpg",
];

// API endpoints to cache with short TTL
const API_CACHE_PATTERNS = [
  /\/api\/(?!ai-consumer|analyze-plant)/, // Cache most APIs except AI endpoints
];

// Image patterns to cache with long TTL
const IMAGE_PATTERNS = [
  /\.(jpg|jpeg|png|gif|webp|avif|svg)$/i,
  /firebasestorage\.googleapis\.com/,
];

// Cache controls
const IMAGE_TTL_MS = 7 * 24 * 60 * 60 * 1000; // 7 days
const API_TTL_MS = 60 * 1000; // 60 seconds
const MAX_IMAGE_ENTRIES = 150;
const MAX_API_ENTRIES = 200;

// Helper functions
const isApiRequest = (url) => {
  return API_CACHE_PATTERNS.some((pattern) => pattern.test(url));
};

const isImageRequest = (url) => {
  return IMAGE_PATTERNS.some((pattern) => pattern.test(url));
};

const isStaleWhileRevalidate = (request) => {
  return isApiRequest(request.url) || isImageRequest(request.url);
};

const getCacheTimestamp = (response) => {
  try {
    const ts = response.headers.get("X-Cache-Timestamp");
    return ts ? parseInt(ts, 10) : undefined;
  } catch (_e) {
    return undefined;
  }
};

const isExpired = (response, ttlMs) => {
  if (!ttlMs) return false;
  const ts = getCacheTimestamp(response);
  if (!ts) return true;
  return Date.now() - ts > ttlMs;
};

const withCacheTimestamp = async (response) => {
  try {
    const headers = new Headers(response.headers);
    headers.set("X-Cache-Timestamp", String(Date.now()));
    return new Response(await response.clone().arrayBuffer(), {
      status: response.status,
      statusText: response.statusText,
      headers,
    });
  } catch (_e) {
    return response;
  }
};

async function limitCacheSize(cacheName, maxEntries) {
  try {
    const cache = await caches.open(cacheName);
    const keys = await cache.keys();
    if (keys.length <= maxEntries) return;
    const deletions = keys
      .slice(0, Math.max(0, keys.length - maxEntries))
      .map((request) => cache.delete(request));
    await Promise.all(deletions);
  } catch (_e) {
    // No-op if cache operations fail
  }
}

// Install event - cache resources
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(STATIC_CACHE).then((cache) => {
      console.log("SW: Opened static cache");
      return cache.addAll(urlsToCache);
    })
  );
  self.skipWaiting(); // Activate immediately
});

// Fetch event - advanced caching strategies
self.addEventListener("fetch", (event) => {
  const { request } = event;
  const url = request.url;

  // Skip non-GET requests, chrome-extension requests, and auth-related requests
  if (request.method !== "GET" || 
      url.startsWith("chrome-extension://") ||
      url.includes("apis.google.com") ||
      url.includes("accounts.google.com") ||
      url.includes("oauth2.googleapis.com") ||
      url.includes("securetoken.googleapis.com") ||
      url.includes("identitytoolkit.googleapis.com") ||
      url.includes("firebase-analytics.com") ||
      url.includes("google-analytics.com") ||
      url.includes("firebaseapp.com") ||
      url.includes("firebase.googleapis.com") ||
      url.includes("googleusercontent.com") ||
      url.includes("gstatic.com") ||
      url.includes("firebaseio.com")) {
    return;
  }

  event.respondWith(handleFetch(event));
});

async function handleFetch(event) {
  const { request } = event;
  const url = request.url;

  try {
    // Strategy 1: Images - Cache First with long TTL
    if (isImageRequest(url)) {
      return await cacheFirst(request, IMAGE_CACHE, IMAGE_TTL_MS);
    }

    // Strategy 2: API requests - Stale While Revalidate with short TTL
    if (isApiRequest(url)) {
      return await staleWhileRevalidate(request, API_CACHE, API_TTL_MS);
    }

    // Strategy 3: Static assets - Cache First
    if (url.includes("/_next/static/")) {
      return await cacheFirst(request, STATIC_CACHE);
    }

    // Strategy 4: Navigation requests - Try preload, then Network First with cache fallback
    if (request.mode === "navigate") {
      try {
        const preload = self.registration.navigationPreload
          ? await event.preloadResponse
          : null;
        if (preload) return preload;
      } catch (_e) {}
      return await networkFirstWithOfflineFallback(request);
    }

    // Strategy 5: Everything else - Network First with cache fallback
    return await networkFirst(request, DYNAMIC_CACHE);
  } catch (error) {
    console.log("SW: Fetch failed:", error);

    // Return offline page for navigation requests
    if (request.mode === "navigate") {
      return caches.match("/offline.html");
    }

    // Return cached version if available
    const cached = await caches.match(request);
    if (cached) return cached;
    // If it's an image, try a placeholder
    if (isImageRequest(url)) {
      const placeholder =
        (await caches.match("/placeholder.jpg")) ||
        (await caches.match("/placeholder.svg"));
      if (placeholder) return placeholder;
    }
    return cached;
  }
}

// Cache strategies
async function cacheFirst(request, cacheName, ttlMs) {
  const cache = await caches.open(cacheName);
  const cached = await cache.match(request);

  if (cached && !isExpired(cached, ttlMs)) {
    return cached;
  }

  try {
    const response = await fetch(request);
    if (response.status === 200) {
      const stamped = await withCacheTimestamp(response.clone());
      cache.put(request, stamped.clone());
      if (cacheName === IMAGE_CACHE) {
        await limitCacheSize(IMAGE_CACHE, MAX_IMAGE_ENTRIES);
      }
    }
    return response;
  } catch (_e) {
    // On failure, return cached or placeholder for images
    if (cached) return cached;
    if (isImageRequest(request.url)) {
      const placeholder =
        (await caches.match("/placeholder.jpg")) ||
        (await caches.match("/placeholder.svg"));
      if (placeholder) return placeholder;
    }
    throw _e;
  }
}

async function staleWhileRevalidate(request, cacheName, ttlMs) {
  const cache = await caches.open(cacheName);
  const cached = await cache.match(request);

  const fetchPromise = fetch(request).then(async (response) => {
    if (response.status === 200) {
      const stamped = await withCacheTimestamp(response.clone());
      await cache.put(request, stamped.clone());
      if (cacheName === API_CACHE) {
        await limitCacheSize(API_CACHE, MAX_API_ENTRIES);
      }
    }
    return response;
  });

  if (cached) {
    if (!isExpired(cached, ttlMs)) {
      return cached;
    }
    try {
      return await fetchPromise;
    } catch (_e) {
      return cached;
    }
  }
  return fetchPromise;
}

async function networkFirst(request, cacheName) {
  try {
    const response = await fetch(request);
    if (response.status === 200) {
      const cache = await caches.open(cacheName);
      cache.put(request, response.clone());
    }
    return response;
  } catch (error) {
    return caches.match(request);
  }
}

async function networkFirstWithOfflineFallback(request) {
  try {
    const response = await fetch(request);
    if (response.status === 200) {
      const cache = await caches.open(DYNAMIC_CACHE);
      cache.put(request, response.clone());
    }
    return response;
  } catch (error) {
    const cached = await caches.match(request);
    return cached || caches.match("/offline.html");
  }
}

// Activate event - clean up old caches and claim clients
self.addEventListener("activate", (event) => {
  const currentCaches = [STATIC_CACHE, DYNAMIC_CACHE, IMAGE_CACHE, API_CACHE];

  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all([
        // Delete old caches
        ...cacheNames.map((cacheName) => {
          if (!currentCaches.includes(cacheName)) {
            console.log("SW: Deleting old cache:", cacheName);
            return caches.delete(cacheName);
          }
        }),
        // Claim all clients
        self.clients.claim(),
      ]);
    })
  );
});

// Background sync for offline actions (when supported)
self.addEventListener("sync", (event) => {
  if (event.tag === "background-sync") {
    event.waitUntil(syncOfflineActions());
  }
});

async function syncOfflineActions() {
  // Get offline actions from IndexedDB/localStorage when implemented
  console.log("SW: Background sync triggered");
}
