/**
 * Jeroma Farmers Offline-First Synchronization Engine
 * Automatically queues mutative actions (deliveries, dispatches, cooperatives)
 * when connectivity drops and replays them when back online.
 */

const QUEUE_KEY = 'jeroma_offline_sync_queue';
const listeners = new Set();

export const getOfflineQueue = () => {
  try {
    const raw = localStorage.getItem(QUEUE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch (e) {
    console.error('Error reading offline queue:', e);
    return [];
  }
};

const saveOfflineQueue = (queue) => {
  try {
    localStorage.setItem(QUEUE_KEY, JSON.stringify(queue));
    notifyListeners();
  } catch (e) {
    console.error('Error saving offline queue:', e);
  }
};

const notifyListeners = () => {
  const state = {
    isOnline: typeof navigator !== 'undefined' ? navigator.onLine : true,
    pendingCount: getOfflineQueue().length,
    queue: getOfflineQueue()
  };
  listeners.forEach((fn) => {
    try {
      fn(state);
    } catch (e) {
      console.error('Error in sync listener:', e);
    }
  });
};

export const subscribeToSyncState = (callback) => {
  listeners.add(callback);
  callback({
    isOnline: typeof navigator !== 'undefined' ? navigator.onLine : true,
    pendingCount: getOfflineQueue().length,
    queue: getOfflineQueue()
  });
  return () => listeners.delete(callback);
};

/**
 * Enqueue a mutation to be synchronized with the backend.
 */
export const enqueueOfflineAction = (action) => {
  const item = {
    id: `sync-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
    createdAt: new Date().toISOString(),
    retryCount: 0,
    ...action
  };
  const queue = getOfflineQueue();
  queue.push(item);
  saveOfflineQueue(queue);
  console.log(`[OfflineSync] Enqueued action: ${item.type} (${item.id})`);
  return item;
};

/**
 * Replay all pending actions against the server.
 */
export const processOfflineSyncQueue = async (fetchWithAuth) => {
  if (typeof navigator !== 'undefined' && !navigator.onLine) {
    console.log('[OfflineSync] Device is offline; sync deferred.');
    return { success: false, reason: 'offline' };
  }

  const queue = getOfflineQueue();
  if (queue.length === 0) return { success: true, processed: 0 };

  console.log(`[OfflineSync] Processing ${queue.length} pending offline actions...`);
  const remaining = [];
  let processed = 0;

  for (const item of queue) {
    try {
      const res = await fetchWithAuth(item.endpoint, {
        method: item.method || 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(item.payload)
      });
      if (res.ok) {
        processed++;
        console.log(`[OfflineSync] Successfully synced: ${item.type} (${item.id})`);
      } else if (res.status >= 400 && res.status < 500) {
        // Client error (e.g. 400 bad payload), do not infinitely retry
        console.warn(`[OfflineSync] Dropping invalid action ${item.id}: status ${res.status}`);
      } else {
        // Server error (500), keep in queue
        item.retryCount = (item.retryCount || 0) + 1;
        remaining.push(item);
      }
    } catch (err) {
      console.error(`[OfflineSync] Network error syncing ${item.id}:`, err);
      item.retryCount = (item.retryCount || 0) + 1;
      remaining.push(item);
    }
  }

  saveOfflineQueue(remaining);
  return { success: true, processed, remaining: remaining.length };
};

// Set up automatic reconnection listeners in browser
if (typeof window !== 'undefined') {
  window.addEventListener('online', () => {
    console.log('[OfflineSync] Network restored! Ready to process queue.');
    notifyListeners();
  });
  window.addEventListener('offline', () => {
    console.log('[OfflineSync] Network lost. Switching to offline caching.');
    notifyListeners();
  });
}
