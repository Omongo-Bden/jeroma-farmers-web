import React, { useState, useEffect } from 'react';
import { subscribeToSyncState, processOfflineSyncQueue } from '../utils/offlineSync';
import { fetchWithAuth } from '../utils/db';

export default function NetworkSyncStatus() {
  const [syncState, setSyncState] = useState({
    isOnline: typeof navigator !== 'undefined' ? navigator.onLine : true,
    pendingCount: 0
  });
  const [isSyncing, setIsSyncing] = useState(false);

  useEffect(() => {
    const unsubscribe = subscribeToSyncState((state) => {
      setSyncState(state);
    });
    return () => unsubscribe();
  }, []);

  const handleManualSync = async () => {
    if (!syncState.isOnline || isSyncing) return;
    setIsSyncing(true);
    try {
      await processOfflineSyncQueue(fetchWithAuth);
    } catch (e) {
      console.error('Manual sync failed:', e);
    } finally {
      setIsSyncing(false);
    }
  };

  // If online and nothing is queued, render an unobtrusive tiny badge
  if (syncState.isOnline && syncState.pendingCount === 0) {
    return (
      <div
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '6px',
          padding: '4px 10px',
          background: 'rgba(16, 185, 129, 0.1)',
          border: '1px solid #10b981',
          borderRadius: '20px',
          fontSize: '0.75rem',
          color: '#065f46',
          fontWeight: 600
        }}
        title="All records synchronized with cloud server"
      >
        <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#10b981', display: 'inline-block' }}></span>
        <span>Online · Synced</span>
      </div>
    );
  }

  // If offline or there are pending records queued
  return (
    <div
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '8px',
        padding: '6px 12px',
        background: syncState.isOnline ? '#fef3c7' : '#fee2e2',
        border: `1.5px solid ${syncState.isOnline ? '#f59e0b' : '#ef4444'}`,
        borderRadius: '20px',
        fontSize: '0.78rem',
        color: syncState.isOnline ? '#92400e' : '#991b1b',
        fontWeight: 700,
        boxShadow: '0 2px 8px rgba(0,0,0,0.06)'
      }}
    >
      <span
        style={{
          width: '8px',
          height: '8px',
          borderRadius: '50%',
          background: syncState.isOnline ? '#f59e0b' : '#ef4444',
          display: 'inline-block'
        }}
      ></span>
      <span>
        {!syncState.isOnline
          ? `Offline Mode (${syncState.pendingCount} pending)`
          : `${syncState.pendingCount} queued change${syncState.pendingCount > 1 ? 's' : ''}`}
      </span>
      {syncState.isOnline && syncState.pendingCount > 0 && (
        <button
          type="button"
          onClick={handleManualSync}
          disabled={isSyncing}
          style={{
            background: '#d97706',
            color: '#fff',
            border: 'none',
            borderRadius: '12px',
            padding: '2px 8px',
            fontSize: '0.72rem',
            cursor: isSyncing ? 'wait' : 'pointer',
            fontWeight: 700
          }}
        >
          {isSyncing ? 'Syncing...' : 'Sync Now'}
        </button>
      )}
    </div>
  );
}
