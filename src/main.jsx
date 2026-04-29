import React from 'react'
import ReactDOM from 'react-dom/client'
import App from '@/App.jsx'
import '@/index.css'
import { registerServiceWorker, flushSyncQueue } from '@/lib/offlineSync';

registerServiceWorker();

// Listen for background sync messages from service worker
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.addEventListener('message', (event) => {
    if (event.data?.type === 'BACKGROUND_SYNC') {
      flushSyncQueue();
    }
  });

  // Force any waiting service worker to activate immediately
  // This ensures stale JS bundles are never served after a deploy
  navigator.serviceWorker.ready.then((reg) => {
    if (reg.waiting) {
      reg.waiting.postMessage({ type: 'SKIP_WAITING' });
    }
    reg.addEventListener('updatefound', () => {
      const newWorker = reg.installing;
      if (newWorker) {
        newWorker.addEventListener('statechange', () => {
          if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
            // New version available — reload to get fresh bundles
            window.location.reload();
          }
        });
      }
    });
  }).catch(() => {});
}

// Auto-sync when app comes back online
window.addEventListener('online', () => flushSyncQueue());

ReactDOM.createRoot(document.getElementById('root')).render(
  <App />
)