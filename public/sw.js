// FundaMedical Service Worker
// Strategy: Network-first for ALL JS/CSS/HTML (app code), Cache-only for static assets (icons/fonts)
// This prevents stale React bundles from causing "Invalid hook call" errors

const CACHE_NAME = 'fundamedical-static-v3';

// Only cache truly static assets — never JS/CSS module chunks
const STATIC_ASSETS = [
  '/manifest.json',
];

self.addEventListener('install', (event) => {
  // Skip waiting so new SW activates immediately
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(STATIC_ASSETS))
  );
});

self.addEventListener('activate', (event) => {
  // Take control of all clients immediately
  event.waitUntil(
    Promise.all([
      self.clients.claim(),
      // Delete ALL old caches
      caches.keys().then((keys) =>
        Promise.all(
          keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))
        )
      ),
    ])
  );
});

self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Never intercept cross-origin requests (API calls, CDN, etc.)
  if (url.origin !== self.location.origin) {
    return;
  }

  // Never cache JS or CSS — always fetch fresh from network
  // This is the critical fix: stale JS bundles cause React hook errors
  if (
    url.pathname.includes('/src/') ||
    url.pathname.endsWith('.js') ||
    url.pathname.endsWith('.jsx') ||
    url.pathname.endsWith('.ts') ||
    url.pathname.endsWith('.tsx') ||
    url.pathname.endsWith('.css') ||
    url.pathname.includes('?') // versioned assets with query params
  ) {
    event.respondWith(fetch(request));
    return;
  }

  // For HTML navigation — always network first, fallback to cache
  if (request.mode === 'navigate' || request.headers.get('accept')?.includes('text/html')) {
    event.respondWith(
      fetch(request).catch(() => caches.match('/index.html'))
    );
    return;
  }

  // For static assets (icons, images, manifest) — cache first
  event.respondWith(
    caches.match(request).then((cached) => cached || fetch(request))
  );
});

// Handle background sync messages
self.addEventListener('message', (event) => {
  if (event.data?.type === 'BACKGROUND_SYNC') {
    event.ports[0]?.postMessage({ type: 'SYNC_TRIGGERED' });
  }
  // Force update on demand
  if (event.data?.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});
