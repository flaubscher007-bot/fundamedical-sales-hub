import React, { useState, useEffect } from 'react';
import { Wifi, WifiOff, RefreshCw, CheckCircle } from 'lucide-react';
import { flushSyncQueue, getPendingSyncCount } from '@/lib/offlineSync';

export default function OfflineIndicator() {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [pendingCount, setPendingCount] = useState(0);
  const [syncing, setSyncing] = useState(false);
  const [syncDone, setSyncDone] = useState(false);

  useEffect(() => {
    const onOnline = async () => {
      setIsOnline(true);
      const counts = await getPendingSyncCount();
      const total = counts.queue + counts.notes;
      if (total > 0) {
        setSyncing(true);
        await flushSyncQueue();
        setSyncing(false);
        setSyncDone(true);
        setPendingCount(0);
        setTimeout(() => setSyncDone(false), 3000);
      }
    };
    const onOffline = () => setIsOnline(false);

    window.addEventListener('online', onOnline);
    window.addEventListener('offline', onOffline);

    // Check pending on mount
    getPendingSyncCount().then((c) => setPendingCount(c.queue + c.notes));

    return () => {
      window.removeEventListener('online', onOnline);
      window.removeEventListener('offline', onOffline);
    };
  }, []);

  const handleManualSync = async () => {
    if (!isOnline || syncing) return;
    setSyncing(true);
    await flushSyncQueue();
    setSyncing(false);
    setSyncDone(true);
    setPendingCount(0);
    setTimeout(() => setSyncDone(false), 3000);
  };

  if (isOnline && !syncing && !syncDone && pendingCount === 0) return null;

  return (
    <div
      className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium shadow-lg"
      style={{
        backgroundColor: syncDone ? '#092e1a' : isOnline ? '#0a2d52' : '#3b1a1a',
        border: `1px solid ${syncDone ? '#92F21D' : isOnline ? '#34CCD0' : '#ef4444'}`,
        color: syncDone ? '#92F21D' : isOnline ? '#34CCD0' : '#ef4444',
      }}
    >
      {syncDone ? (
        <>
          <CheckCircle className="w-4 h-4" />
          <span>All changes synced</span>
        </>
      ) : syncing ? (
        <>
          <RefreshCw className="w-4 h-4 animate-spin" />
          <span>Syncing offline data...</span>
        </>
      ) : !isOnline ? (
        <>
          <WifiOff className="w-4 h-4" />
          <span>Offline — changes saved locally{pendingCount > 0 ? ` (${pendingCount} pending)` : ''}</span>
        </>
      ) : pendingCount > 0 ? (
        <>
          <Wifi className="w-4 h-4" />
          <span>{pendingCount} changes pending sync</span>
          <button onClick={handleManualSync} className="underline ml-1 hover:opacity-80">Sync now</button>
        </>
      ) : null}
    </div>
  );
}