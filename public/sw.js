// Service Worker for Cannafriend PWA
const CACHE_VERSION = "v2";
const STATIC_CACHE = `cannafriend-static-${CACHE_VERSION}`;
const DYNAMIC_CACHE = `cannafriend-dynamic-${CACHE_VERSION}`;
const IMAGE_CACHE = `cannafriend-images-${CACHE_VERSION}`;
const API_CACHE = `cannafriend-api-${CACHE_VERSION}`;

// Resources to precache - core functionality only
const urlsToCache = [
  "/",
  "/login",
  "/dashboard", 
  "/plants",
  "/journal",
  "/offline.html",
  "/manifest.json",
  "/icon-192x192.png", 
  "/icon-512x512.png",
  "/favicon-16x16.png",
  "/favicon-32x32.png"
];

// API endpoints to cache with short TTL
const API_CACHE_PATTERNS = [
  /\/api\/(?!ai-consumer|analyze-plant)/,  // Cache most APIs except AI endpoints
];

// Image patterns to cache with long TTL  
const IMAGE_PATTERNS = [
  /\.(jpg|jpeg|png|gif|webp|avif|svg)$/i,
  /firebasestorage\.googleapis\.com/,
];

// Helper functions
const isApiRequest = (url) => {
  return API_CACHE_PATTERNS.some(pattern => pattern.test(url));
};

const isImageRequest = (url) => {
  return IMAGE_PATTERNS.some(pattern => pattern.test(url));
};

const isStaleWhileRevalidate = (request) => {
  return isApiRequest(request.url) || isImageRequest(request.url);
};

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

  // Skip non-GET requests and chrome-extension requests
  if (request.method !== 'GET' || url.startsWith('chrome-extension://')) {
    return;
  }

  event.respondWith(handleFetch(request));
});

async function handleFetch(request) {
  const url = request.url;

  try {
    // Strategy 1: Images - Cache First with long TTL
    if (isImageRequest(url)) {
      return await cacheFirst(request, IMAGE_CACHE);
    }

    // Strategy 2: API requests - Stale While Revalidate with short TTL  
    if (isApiRequest(url)) {
      return await staleWhileRevalidate(request, API_CACHE);
    }

    // Strategy 3: Static assets - Cache First
    if (url.includes('/_next/static/')) {
      return await cacheFirst(request, STATIC_CACHE);
    }

    // Strategy 4: Navigation requests - Network First with cache fallback
    if (request.mode === 'navigate') {
      return await networkFirstWithOfflineFallback(request);
    }

    // Strategy 5: Everything else - Network First with cache fallback
    return await networkFirst(request, DYNAMIC_CACHE);

  } catch (error) {
    console.log('SW: Fetch failed:', error);
    
    // Return offline page for navigation requests
    if (request.mode === 'navigate') {
      return caches.match('/offline.html');
    }
    
    // Return cached version if available
    return caches.match(request);
  }
}

// Cache strategies
async function cacheFirst(request, cacheName) {
  const cache = await caches.open(cacheName);
  const cached = await cache.match(request);
  
  if (cached) {
    return cached;
  }

  const response = await fetch(request);
  if (response.status === 200) {
    cache.put(request, response.clone());
  }
  return response;
}

async function staleWhileRevalidate(request, cacheName) {
  const cache = await caches.open(cacheName);
  const cached = await cache.match(request);
  
  const fetchPromise = fetch(request).then(response => {
    if (response.status === 200) {
      cache.put(request, response.clone());
    }
    return response;
  });

  return cached || fetchPromise;
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
    return cached || caches.match('/offline.html');
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
        self.clients.claim()
      ]);
    })
  );
});

// Background sync for offline actions (when supported)
self.addEventListener('sync', (event) => {
  if (event.tag === 'background-sync') {
    event.waitUntil(syncOfflineActions());
  }
});

async function syncOfflineActions() {
  // Get offline actions from IndexedDB/localStorage when implemented
  console.log('SW: Background sync triggered');
}
