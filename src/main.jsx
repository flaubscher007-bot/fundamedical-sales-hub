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
}

// Auto-sync when app comes back online
window.addEventListener('online', () => flushSyncQueue());

ReactDOM.createRoot(document.getElementById('root')).render(
  <App />
)