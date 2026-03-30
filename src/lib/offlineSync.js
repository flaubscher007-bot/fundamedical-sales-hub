/**
 * Offline Sync Utility
 * Handles queuing writes to IndexedDB when offline,
 * and auto-syncing when connectivity is restored.
 */

const DB_NAME = 'FundaMedicalOffline';
const DB_VERSION = 1;
const QUEUE_STORE = 'offline-sync-queue';
const NOTES_STORE = 'offline-notes';
const RECORDINGS_STORE = 'offline-recordings';

let db = null;

async function getDB() {
  if (db) return db;
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = (e) => {
      const d = e.target.result;
      if (!d.objectStoreNames.contains(QUEUE_STORE))
        d.createObjectStore(QUEUE_STORE, { keyPath: 'id', autoIncrement: true });
      if (!d.objectStoreNames.contains(NOTES_STORE))
        d.createObjectStore(NOTES_STORE, { keyPath: 'id' });
      if (!d.objectStoreNames.contains(RECORDINGS_STORE))
        d.createObjectStore(RECORDINGS_STORE, { keyPath: 'id' });
    };
    req.onsuccess = () => { db = req.result; resolve(db); };
    req.onerror = () => reject(req.error);
  });
}

async function storeOperation(store, data) {
  const d = await getDB();
  return new Promise((resolve, reject) => {
    const tx = d.transaction(store, 'readwrite');
    const s = tx.objectStore(store);
    const req = s.put(data);
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

async function getAllFromStore(store) {
  const d = await getDB();
  return new Promise((resolve, reject) => {
    const tx = d.transaction(store, 'readonly');
    const s = tx.objectStore(store);
    const req = s.getAll();
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

async function deleteFromStore(store, key) {
  const d = await getDB();
  return new Promise((resolve, reject) => {
    const tx = d.transaction(store, 'readwrite');
    const s = tx.objectStore(store);
    const req = s.delete(key);
    req.onsuccess = () => resolve();
    req.onerror = () => reject(req.error);
  });
}

// Save a meeting note offline
export async function saveNoteOffline(note) {
  const entry = { ...note, id: note.id || `offline-${Date.now()}`, _offline: true, _savedAt: new Date().toISOString() };
  await storeOperation(NOTES_STORE, entry);
  return entry;
}

// Get all offline notes
export async function getOfflineNotes() {
  return getAllFromStore(NOTES_STORE);
}

// Delete an offline note
export async function deleteOfflineNote(id) {
  return deleteFromStore(NOTES_STORE, id);
}

// Save a recording reference offline
export async function saveRecordingOffline(recording) {
  const entry = { ...recording, id: recording.id || `rec-${Date.now()}`, _offline: true, _savedAt: new Date().toISOString() };
  await storeOperation(RECORDINGS_STORE, entry);
  return entry;
}

// Get all offline recordings
export async function getOfflineRecordings() {
  return getAllFromStore(RECORDINGS_STORE);
}

// Queue an API write for background sync
export async function queueForSync(operation) {
  await storeOperation(QUEUE_STORE, { ...operation, _queuedAt: new Date().toISOString() });
  // Trigger background sync if service worker supports it
  if ('serviceWorker' in navigator && 'SyncManager' in window) {
    const reg = await navigator.serviceWorker.ready;
    await reg.sync.register('offline-sync');
  }
}

// Flush queue manually (called when back online)
export async function flushSyncQueue(onProgress) {
  const queue = await getAllFromStore(QUEUE_STORE);
  let synced = 0;
  for (const item of queue) {
    try {
      const { base44 } = await import('@/api/base44Client');
      if (item.type === 'create') {
        await base44.entities[item.entity].create(item.data);
      } else if (item.type === 'update') {
        await base44.entities[item.entity].update(item.id, item.data);
      }
      await deleteFromStore(QUEUE_STORE, item.id);
      synced++;
      if (onProgress) onProgress(synced, queue.length);
    } catch (e) {
      console.warn('Sync failed for item', item.id, e);
    }
  }
  return { synced, total: queue.length };
}

// Get pending sync count
export async function getPendingSyncCount() {
  const queue = await getAllFromStore(QUEUE_STORE);
  const notes = await getAllFromStore(NOTES_STORE);
  const recordings = await getAllFromStore(RECORDINGS_STORE);
  return { queue: queue.length, notes: notes.length, recordings: recordings.length };
}

// Register service worker
export function registerServiceWorker() {
  if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
      navigator.serviceWorker.register('/sw.js').then((reg) => {
        console.log('SW registered:', reg.scope);
      }).catch((err) => {
        console.warn('SW registration failed:', err);
      });
    });
  }
}