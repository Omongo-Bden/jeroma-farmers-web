// Native, zero-dependency IndexedDB helper wrapper for Jeroma Farmers PWA
const DB_NAME = 'JeromaFarmersDB';
const DB_VERSION = 1;
const STORES = [
  'crops',
  'manual',
  'users',
  'deliveries',
  'dispatches',
  'inquiries',
  'translations',
  'slides',
  'offlineActions'
];

let dbInstance = null;

export const initIndexedDB = () => {
  if (dbInstance) return Promise.resolve(dbInstance);

  return new Promise((resolve, reject) => {
    if (typeof indexedDB === 'undefined') {
      console.warn('IndexedDB not supported in this environment');
      resolve(null);
      return;
    }
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = (event) => {
      console.error('IndexedDB open error:', event.target.error);
      reject(event.target.error);
    };

    request.onsuccess = (event) => {
      dbInstance = event.target.result;
      resolve(dbInstance);
    };

    request.onupgradeneeded = (event) => {
      const db = event.target.result;
      STORES.forEach(storeName => {
        if (!db.objectStoreNames.contains(storeName)) {
          // Use auto-generated keys for offlineActions to act as an ordered queue
          if (storeName === 'offlineActions') {
            db.createObjectStore(storeName, { keyPath: 'id', autoIncrement: true });
          } else {
            // Standard stores use key as name/id, or custom key
            db.createObjectStore(storeName, { keyPath: 'id' });
          }
        }
      });
    };
  });
};

const getStore = async (storeName, mode = 'readonly') => {
  const db = await initIndexedDB();
  if (!db) throw new Error('IndexedDB not initialized');
  const transaction = db.transaction(storeName, mode);
  return transaction.objectStore(storeName);
};

export const idbGet = async (storeName, key) => {
  try {
    const store = await getStore(storeName, 'readonly');
    return new Promise((resolve, reject) => {
      const request = store.get(key);
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  } catch (e) {
    console.error(`idbGet error on ${storeName}:`, e);
    return null;
  }
};

export const idbGetAll = async (storeName) => {
  try {
    const store = await getStore(storeName, 'readonly');
    return new Promise((resolve, reject) => {
      const request = store.getAll();
      request.onsuccess = () => resolve(request.result || []);
      request.onerror = () => reject(request.error);
    });
  } catch (e) {
    console.error(`idbGetAll error on ${storeName}:`, e);
    return [];
  }
};

export const idbPut = async (storeName, item) => {
  try {
    const store = await getStore(storeName, 'readwrite');
    return new Promise((resolve, reject) => {
      const request = store.put(item);
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  } catch (e) {
    console.error(`idbPut error on ${storeName}:`, e);
    return null;
  }
};

export const idbDelete = async (storeName, key) => {
  try {
    const store = await getStore(storeName, 'readwrite');
    return new Promise((resolve, reject) => {
      const request = store.delete(key);
      request.onsuccess = () => resolve(true);
      request.onerror = () => reject(request.error);
    });
  } catch (e) {
    console.error(`idbDelete error on ${storeName}:`, e);
    return false;
  }
};

export const idbClear = async (storeName) => {
  try {
    const store = await getStore(storeName, 'readwrite');
    return new Promise((resolve, reject) => {
      const request = store.clear();
      request.onsuccess = () => resolve(true);
      request.onerror = () => reject(request.error);
    });
  } catch (e) {
    console.error(`idbClear error on ${storeName}:`, e);
    return false;
  }
};
