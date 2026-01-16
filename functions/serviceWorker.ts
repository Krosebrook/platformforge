/**
 * Service Worker for Base44 Platform
 * Provides offline functionality, caching strategies, and background sync
 */

Deno.serve(async (req) => {
  const serviceWorkerScript = `
const CACHE_NAME = 'base44-v1';
const RUNTIME_CACHE = 'base44-runtime-v1';

// Critical assets to cache on install
const PRECACHE_ASSETS = [
  '/',
  '/index.html',
  '/globals.css'
];

// Cache-first resources (static assets)
const CACHE_FIRST_PATTERNS = [
  /\.(?:js|css|woff2?|ttf|eot|svg)$/,
  /\\/components\\//,
  /\\/pages\\//
];

// Network-first resources (API calls, dynamic data)
const NETWORK_FIRST_PATTERNS = [
  /\\/api\\//,
  /base44\\.entities/,
  /base44\\.integrations/
];

// Install event - precache critical assets
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.addAll(PRECACHE_ASSETS))
      .then(() => self.skipWaiting())
  );
});

// Activate event - cleanup old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames
            .filter((name) => name !== CACHE_NAME && name !== RUNTIME_CACHE)
            .map((name) => caches.delete(name))
        );
      })
      .then(() => self.clients.claim())
  );
});

// Fetch event - implement caching strategies
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip cross-origin requests
  if (url.origin !== location.origin) {
    return;
  }

  // Cache-first strategy for static assets
  if (CACHE_FIRST_PATTERNS.some(pattern => pattern.test(url.pathname))) {
    event.respondWith(cacheFirst(request));
    return;
  }

  // Network-first strategy for API calls
  if (NETWORK_FIRST_PATTERNS.some(pattern => pattern.test(url.href))) {
    event.respondWith(networkFirst(request));
    return;
  }

  // Default: Network-first with cache fallback
  event.respondWith(networkFirst(request));
});

// Cache-first strategy
async function cacheFirst(request) {
  const cached = await caches.match(request);
  if (cached) return cached;

  try {
    const response = await fetch(request);
    if (response.ok) {
      const cache = await caches.open(RUNTIME_CACHE);
      cache.put(request, response.clone());
    }
    return response;
  } catch (error) {
    return new Response('Offline', { status: 503, statusText: 'Service Unavailable' });
  }
}

// Network-first strategy
async function networkFirst(request) {
  try {
    const response = await fetch(request);
    if (response.ok) {
      const cache = await caches.open(RUNTIME_CACHE);
      cache.put(request, response.clone());
    }
    return response;
  } catch (error) {
    const cached = await caches.match(request);
    if (cached) return cached;
    return new Response('Offline', { status: 503, statusText: 'Service Unavailable' });
  }
}

// Background sync for offline actions
self.addEventListener('sync', (event) => {
  if (event.tag === 'sync-data') {
    event.waitUntil(syncData());
  }
});

async function syncData() {
  console.log('Background sync triggered');
}

// Push notifications handler
self.addEventListener('push', (event) => {
  const options = {
    body: event.data ? event.data.text() : 'New notification',
    icon: '/icon-192.png',
    badge: '/icon-192.png',
    vibrate: [200, 100, 200],
    tag: 'base44-notification',
    requireInteraction: false
  };

  event.waitUntil(
    self.registration.showNotification('Base44 Platform', options)
  );
});
`;

  return new Response(serviceWorkerScript, {
    status: 200,
    headers: {
      'Content-Type': 'application/javascript',
      'Cache-Control': 'public, max-age=3600'
    }
  });
});