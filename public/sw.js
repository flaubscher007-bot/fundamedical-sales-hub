const CACHE_NAME = 'fundamedical-v1';
const OFFLINE_QUEUE_STORE = 'offline-sync-queue';

const STATIC_ASSETS = [
  '/',
  '/index.html',
];

// Install: cache static assets
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(STATIC_ASSETS))
  );
  self.skipWaiting();
});

// Activate: clean old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

// Fetch: network-first for API, cache-first for assets
self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);

  // Let API calls pass through; don't cache them
  if (url.pathname.startsWith('/api/') || url.hostname !== self.location.hostname) {
    return;
  }

  // Cache-first for static assets
  event.respondWith(
    caches.match(event.request).then((cached) => {
      return (
        cached ||
        fetch(event.request)
          .then((resp) => {
            const clone = resp.clone();
            caches.open(CACHE_NAME).then((c) => c.put(event.request, clone));
            return resp;
          })
          .catch(() => caches.match('/index.html'))
      );
    })
  );
});

// Background Sync: flush queued offline writes
self.addEventListener('sync', (event) => {
  if (event.tag === 'offline-sync') {
    event.waitUntil(flushOfflineQueue());
  }
});

async function flushOfflineQueue() {
  const db = await openDB();
  const tx = db.transaction(OFFLINE_QUEUE_STORE, 'readwrite');
  const store = tx.objectStore(OFFLINE_QUEUE_STORE);
  const items = await getAllItems(store);

  for (const item of items) {
    try {
      const resp = await fetch(item.url, {
        method: item.method,
        headers: { 'Content-Type': 'application/json', ...item.headers },
        body: item.body ? JSON.stringify(item.body) : undefined,
      });
      if (resp.ok) {
        const delTx = db.transaction(OFFLINE_QUEUE_STORE, 'readwrite');
        delTx.objectStore(OFFLINE_QUEUE_STORE).delete(item.id);
        await delTx.done;
      }
    } catch (e) {
      // Will retry next sync
    }
  }
}

function openDB() {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open('FundaMedicalOffline', 1);
    req.onupgradeneeded = (e) => {
      const db = e.target.result;
      if (!db.objectStoreNames.contains(OFFLINE_QUEUE_STORE)) {
        db.createObjectStore(OFFLINE_QUEUE_STORE, { keyPath: 'id', autoIncrement: true });
      }
      if (!db.objectStoreNames.contains('offline-notes')) {
        db.createObjectStore('offline-notes', { keyPath: 'id' });
      }
      if (!db.objectStoreNames.contains('offline-recordings')) {
        db.createObjectStore('offline-recordings', { keyPath: 'id' });
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

function getAllItems(store) {
  return new Promise((resolve, reject) => {
    const req = store.getAll();
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

// Listen for messages from the app
self.addEventListener('message', (event) => {
  if (event.data?.type === 'SKIP_WAITING') self.skipWaiting();
  if (event.data?.type === 'TRIGGER_SYNC') {
    self.registration.sync?.register('offline-sync');
  }
});
