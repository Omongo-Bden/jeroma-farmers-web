// Jeroma Farmers Client-Server Database Helper System (with Offline-First PWA Fallback)
import { 
  initIndexedDB, 
  idbGet, 
  idbGetAll, 
  idbPut, 
  idbDelete, 
  idbClear 
} from './indexedDbHelper';

// Client-side secure password hashing helper (useful for offline login)
export const hashPassword = async (password) => {
  const encoder = new TextEncoder();
  const data = encoder.encode(String(password));
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  return Array.from(new Uint8Array(hashBuffer))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
};

// Queue helper for offline-submitted actions
const queueOfflineAction = async (actionType, payload) => {
  try {
    await idbPut('offlineActions', {
      actionType,
      payload,
      timestamp: Date.now()
    });
    console.log(`[Offline Queue] Enqueued action: ${actionType}`);
  } catch (err) {
    console.error('Failed to queue offline action:', err);
  }
};

// API Base URL (Relative path works because Netlify redirect routes /api/* to Functions)
const API_BASE = '/api';

// Authenticated fetch wrapper
export const fetchWithAuth = async (url, options = {}) => {
  const token = localStorage.getItem('jeroma_jwt_token');
  const headers = options.headers || {};
  
  const authHeaders = {
    ...headers,
    'Content-Type': 'application/json',
  };
  
  if (token) {
    authHeaders['Authorization'] = `Bearer ${token}`;
  }
  
  // Set credentials to include cookies for session management
  options.credentials = 'include';
  
  const res = await window.fetch(url, {
    ...options,
    headers: authHeaders
  });
  
  if (res.status === 401 || res.status === 403) {
    localStorage.removeItem('jeroma_jwt_token');
    localStorage.removeItem('jeroma_logged_user');
    window.dispatchEvent(new Event('jeroma_unauthorized'));
  }
  
  if (res.status === 404 || res.status >= 500) {
    throw new Error(`Server returned status: ${res.status}`);
  }
  
  return res;
};

// ─── Database Initialisation ──────────────────────────────────────────────────
export const initDb = async () => {
  // Enforce IndexedDB initialization
  await initIndexedDB();

  // Call API to ensure backend is initialized, and also initialize local caches
  try {
    const [cropsRes, manualRes] = await Promise.all([
      fetchWithAuth(`${API_BASE}/crops`),
      fetchWithAuth(`${API_BASE}/manual`)
    ]);
    if (cropsRes.ok) {
      const crops = await cropsRes.json();
      await idbPut('crops', { id: 'all', data: crops });
    }
    if (manualRes.ok) {
      const manual = await manualRes.json();
      await idbPut('manual', { id: 'all', data: manual });
    }
  } catch (e) {
    // Offline - do nothing, use local storage fallback
  }

  // Seed default users if IndexedDB users is empty
  const cachedUsers = await idbGet('users', 'all');
  if (!cachedUsers || !cachedUsers.data || cachedUsers.data.length === 0) {
    const adminHash = await hashPassword('admin123');
    const okelloHash = await hashPassword('pass123');
    const akelloHash = await hashPassword('pass123');
    
    const defaultUsers = [
      { username: 'admin', password: adminHash, name: 'Center Administrator', role: 'admin', phone: '+256 773 623 196', district: 'Lira' },
      { username: 'okello', password: okelloHash, name: 'John Okello', role: 'client', phone: '+256 772 445 599', district: 'Lira', farmSize: '12 acres' },
      { username: 'akello', password: akelloHash, name: 'Florence Akello', role: 'client', phone: '+256 782 608 721', district: 'Kole', farmSize: '8 acres' }
    ];
    await idbPut('users', { id: 'all', data: defaultUsers });
  }
};

// ─── Crops pricing ────────────────────────────────────────────────────────────
export const getCrops = async () => {
  try {
    const res = await fetchWithAuth(`${API_BASE}/crops`);
    if (res.ok) {
      const crops = await res.json();
      await idbPut('crops', { id: 'all', data: crops });
      return crops;
    }
  } catch (e) {
    // Offline fallback
  }
  const cached = await idbGet('crops', 'all');
  return cached ? cached.data : {};
};

export const saveCrops = async (crops) => {
  // Inject timestamp for conflict-resolution tracking
  const updatedCrops = {
    ...crops,
    _lastUpdated: Date.now()
  };
  try {
    const res = await fetchWithAuth(`${API_BASE}/crops`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updatedCrops)
    });
    if (res.ok) {
      const data = await res.json();
      await idbPut('crops', { id: 'all', data: updatedCrops });
      return data;
    }
  } catch (e) {
    // Offline fallback
    await idbPut('crops', { id: 'all', data: updatedCrops });
    await queueOfflineAction('saveCrops', updatedCrops);
    return { success: true, crops: updatedCrops };
  }
};

// ─── Users & Auth ─────────────────────────────────────────────────────────────
export const getUsers = async () => {
  try {
    const res = await fetchWithAuth(`${API_BASE}/users`);
    if (res.ok) {
      const users = await res.json();
      await idbPut('users', { id: 'all', data: users });
      return users;
    }
  } catch (e) {
    // Offline fallback
  }
  const cached = await idbGet('users', 'all');
  return cached ? cached.data : [];
};

export const validateLogin = async (username, password) => {
  try {
    const res = await fetchWithAuth(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password })
    });
    if (res.ok) {
      const data = await res.json();
      if (data.token) {
        localStorage.setItem('jeroma_jwt_token', data.token);
      }
      
      // Cache this user details locally with their hashed password so they can log in offline next time
      const cachedUsersObj = await idbGet('users', 'all');
      const localUsers = cachedUsersObj ? cachedUsersObj.data : [];
      const hashed = await hashPassword(password);
      const existingIdx = localUsers.findIndex(u => u.username.toLowerCase() === data.user.username.toLowerCase());
      const cachedUser = { ...data.user, password: hashed };
      if (existingIdx !== -1) {
        localUsers[existingIdx] = cachedUser;
      } else {
        localUsers.push(cachedUser);
      }
      await idbPut('users', { id: 'all', data: localUsers });
      
      return data.user;
    }
  } catch (e) {
    // Offline authentication fallback using local cached users
    const cachedUsersObj = await idbGet('users', 'all');
    const users = cachedUsersObj ? cachedUsersObj.data : [];
    const hashed = await hashPassword(password);
    const user = users.find(u => u.username.toLowerCase() === username.toLowerCase() && u.password === hashed);
    if (user) {
      if (user.status === 'suspended') {
        throw new Error('Account has been suspended. Please contact the administrator.');
      }
      const { password: _password, ...userSession } = user;
      return userSession;
    }
  }
  return null;
};

export const registerUser = async (user) => {
  try {
    const res = await fetchWithAuth(`${API_BASE}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(user)
    });
    const data = await res.json();
    if (res.ok) {
      if (data.token) {
        localStorage.setItem('jeroma_jwt_token', data.token);
      }
      // Cache this registered user details in local users database without calling getUsers()
      const cachedUsersObj = await idbGet('users', 'all');
      const localUsers = cachedUsersObj ? cachedUsersObj.data : [];
      if (!localUsers.find(u => u.username === data.user.username)) {
        const hashed = await hashPassword(user.password);
        localUsers.push({ ...data.user, password: hashed });
        await idbPut('users', { id: 'all', data: localUsers });
      }
      return { success: true, user: data.user };
    }
    return { success: false, error: data.error };
  } catch (e) {
    // Offline registration fallback
    const cachedUsersObj = await idbGet('users', 'all');
    const users = cachedUsersObj ? cachedUsersObj.data : [];
    if (users.find(u => u.username === user.username)) {
      return { success: false, error: 'Username already exists' };
    }
    const hashed = await hashPassword(user.password);
    const newUser = { ...user, password: hashed, role: 'client' };
    users.push(newUser);
    await idbPut('users', { id: 'all', data: users });
    await queueOfflineAction('registerUser', user);
    return { success: true, user: newUser };
  }
};

export const registerAdmin = async (user) => {
  try {
    const res = await fetchWithAuth(`${API_BASE}/auth/register-admin`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(user)
    });
    const data = await res.json();
    if (res.ok) {
      if (data.token) {
        localStorage.setItem('jeroma_jwt_token', data.token);
      }
      // Cache this admin details in local users database without calling getUsers()
      const cachedUsersObj = await idbGet('users', 'all');
      const localUsers = cachedUsersObj ? cachedUsersObj.data : [];
      if (!localUsers.find(u => u.username === data.user.username)) {
        const hashed = await hashPassword(user.password);
        localUsers.push({ ...data.user, password: hashed });
        await idbPut('users', { id: 'all', data: localUsers });
      }
      return { success: true, user: data.user };
    }
    return { success: false, error: data.error };
  } catch (e) {
    // Offline registration fallback
    const cachedUsersObj = await idbGet('users', 'all');
    const users = cachedUsersObj ? cachedUsersObj.data : [];
    if (users.find(u => u.username === user.username)) {
      return { success: false, error: 'Username already exists' };
    }
    const hashed = await hashPassword(user.password);
    const newUser = { ...user, password: hashed, role: 'admin' };
    users.push(newUser);
    await idbPut('users', { id: 'all', data: users });
    await queueOfflineAction('registerAdmin', user);
    return { success: true, user: newUser };
  }
};

export const updateUser = async (username, updatedData) => {
  try {
    const res = await fetchWithAuth(`${API_BASE}/users/update`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, updatedData })
    });
    if (res.ok) {
      // Update logged user details if they updated their own account
      const loggedUser = JSON.parse(localStorage.getItem('jeroma_logged_user') || '{}');
      if (loggedUser.username === username) {
        const newLoggedUser = { ...loggedUser, ...updatedData };
        localStorage.setItem('jeroma_logged_user', JSON.stringify(newLoggedUser));
      }
      
      // Update local users database
      const cachedUsersObj = await idbGet('users', 'all');
      const localUsers = cachedUsersObj ? cachedUsersObj.data : [];
      const idx = localUsers.findIndex(u => u.username === username);
      if (idx !== -1) {
        if (updatedData.password) {
          updatedData.password = await hashPassword(updatedData.password);
        }
        localUsers[idx] = { ...localUsers[idx], ...updatedData };
        await idbPut('users', { id: 'all', data: localUsers });
      }
      
      // If admin, sync the entire users list from server
      if (loggedUser.role === 'admin') {
        try {
          const users = await getUsers();
          await idbPut('users', { id: 'all', data: users });
        } catch (e) {
          // ignore sync failure
        }
      }
      return true;
    }
  } catch (e) {
    // Offline fallback
    const cachedUsersObj = await idbGet('users', 'all');
    const users = cachedUsersObj ? cachedUsersObj.data : [];
    const idx = users.findIndex(u => u.username === username);
    if (idx !== -1) {
      if (updatedData.password) {
        updatedData.password = await hashPassword(updatedData.password);
      }
      users[idx] = { ...users[idx], ...updatedData };
      await idbPut('users', { id: 'all', data: users });
      await queueOfflineAction('updateUser', { username, updatedData });
      return true;
    }
  }
  return false;
};

export const deleteUser = async (username) => {
  try {
    const res = await fetchWithAuth(`${API_BASE}/users/delete`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username })
    });
    if (res.ok) {
      const users = await getUsers();
      await idbPut('users', { id: 'all', data: users });
      return true;
    }
  } catch (e) {
    // Offline fallback
    const cachedUsersObj = await idbGet('users', 'all');
    const users = cachedUsersObj ? cachedUsersObj.data : [];
    const filtered = users.filter(u => u.username !== username);
    if (filtered.length !== users.length) {
      await idbPut('users', { id: 'all', data: filtered });
      await queueOfflineAction('deleteUser', username);
      return true;
    }
  }
  return false;
};

// ─── Deliveries ───────────────────────────────────────────────────────────────
export const getDeliveries = async () => {
  try {
    const res = await fetchWithAuth(`${API_BASE}/deliveries`);
    if (res.ok) {
      const deliveries = await res.json();
      await idbPut('deliveries', { id: 'all', data: deliveries });
      return deliveries;
    }
  } catch (e) {
    // Offline fallback
  }
  const cached = await idbGet('deliveries', 'all');
  return cached ? cached.data : [];
};

export const saveDelivery = async (delivery) => {
  try {
    const res = await fetchWithAuth(`${API_BASE}/deliveries`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(delivery)
    });
    if (res.ok) {
      const data = await res.json();
      const deliveries = await getDeliveries();
      await idbPut('deliveries', { id: 'all', data: deliveries });
      return data.delivery;
    }
  } catch (e) {
    // Offline fallback
    const cachedDeliveriesObj = await idbGet('deliveries', 'all');
    const deliveries = cachedDeliveriesObj ? cachedDeliveriesObj.data : [];
    const newDelivery = {
      id: 'del-' + Math.floor(Math.random() * 900000 + 100000),
      status: 'Processing',
      date: new Date().toISOString().split('T')[0],
      _localTimestamp: Date.now(),
      ...delivery
    };
    deliveries.unshift(newDelivery);
    await idbPut('deliveries', { id: 'all', data: deliveries });
    await queueOfflineAction('saveDelivery', delivery);
    return newDelivery;
  }
};

export const updateDeliveryStatus = async (id, status) => {
  try {
    const res = await fetchWithAuth(`${API_BASE}/deliveries/status`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, status })
    });
    if (res.ok) {
      const deliveries = await getDeliveries();
      await idbPut('deliveries', { id: 'all', data: deliveries });
      return true;
    }
  } catch (e) {
    // Offline fallback
    const cachedDeliveriesObj = await idbGet('deliveries', 'all');
    const deliveries = cachedDeliveriesObj ? cachedDeliveriesObj.data : [];
    const idx = deliveries.findIndex(d => d.id === id);
    if (idx !== -1) {
      deliveries[idx].status = status;
      deliveries[idx]._localTimestamp = Date.now();
      await idbPut('deliveries', { id: 'all', data: deliveries });
      await queueOfflineAction('updateDeliveryStatus', { id, status });
      return true;
    }
  }
  return false;
};

// ─── Dispatches ───────────────────────────────────────────────────────────────
export const getDispatches = async () => {
  try {
    const res = await fetchWithAuth(`${API_BASE}/dispatches`);
    if (res.ok) {
      const dispatches = await res.json();
      await idbPut('dispatches', { id: 'all', data: dispatches });
      return dispatches;
    }
  } catch (e) {
    // Offline fallback
  }
  const cached = await idbGet('dispatches', 'all');
  return cached ? cached.data : [];
};

export const saveDispatch = async (dispatch) => {
  try {
    const res = await fetchWithAuth(`${API_BASE}/dispatches`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(dispatch)
    });
    if (res.ok) {
      const data = await res.json();
      const dispatches = await getDispatches();
      await idbPut('dispatches', { id: 'all', data: dispatches });
      return data.dispatch;
    }
  } catch (e) {
    // Offline fallback
    const cachedDispatchesObj = await idbGet('dispatches', 'all');
    const dispatches = cachedDispatchesObj ? cachedDispatchesObj.data : [];
    const newDispatch = {
      id: 'disp-' + Math.floor(Math.random() * 900000 + 100000),
      status: 'Pending',
      _localTimestamp: Date.now(),
      ...dispatch
    };
    dispatches.unshift(newDispatch);
    await idbPut('dispatches', { id: 'all', data: dispatches });
    await queueOfflineAction('saveDispatch', dispatch);
    return newDispatch;
  }
};

export const updateDispatchStatus = async (id, status) => {
  try {
    const res = await fetchWithAuth(`${API_BASE}/dispatches/status`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, status })
    });
    if (res.ok) {
      const dispatches = await getDispatches();
      await idbPut('dispatches', { id: 'all', data: dispatches });
      return true;
    }
  } catch (e) {
    // Offline fallback
    const cachedDispatchesObj = await idbGet('dispatches', 'all');
    const dispatches = cachedDispatchesObj ? cachedDispatchesObj.data : [];
    const idx = dispatches.findIndex(d => d.id === id);
    if (idx !== -1) {
      dispatches[idx].status = status;
      dispatches[idx]._localTimestamp = Date.now();
      await idbPut('dispatches', { id: 'all', data: dispatches });
      await queueOfflineAction('updateDispatchStatus', { id, status });
      return true;
    }
  }
  return false;
};

// ─── Inquiries ────────────────────────────────────────────────────────────────
export const getInquiries = async () => {
  try {
    const res = await fetchWithAuth(`${API_BASE}/inquiries`);
    if (res.ok) {
      const inquiries = await res.json();
      await idbPut('inquiries', { id: 'all', data: inquiries });
      return inquiries;
    }
  } catch (e) {
    // Offline fallback
  }
  const cached = await idbGet('inquiries', 'all');
  return cached ? cached.data : [];
};

export const saveInquiry = async (inquiry) => {
  try {
    const res = await fetchWithAuth(`${API_BASE}/inquiries`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(inquiry)
    });
    if (res.ok) {
      const data = await res.json();
      const inquiries = await getInquiries();
      await idbPut('inquiries', { id: 'all', data: inquiries });
      return data.inquiry;
    }
  } catch (e) {
    // Offline fallback
    const cachedInquiriesObj = await idbGet('inquiries', 'all');
    const inquiries = cachedInquiriesObj ? cachedInquiriesObj.data : [];
    const newInquiry = {
      id: 'inq-' + Math.floor(Math.random() * 900000 + 100000),
      status: 'Unread',
      date: new Date().toISOString().split('T')[0],
      _localTimestamp: Date.now(),
      ...inquiry
    };
    inquiries.unshift(newInquiry);
    await idbPut('inquiries', { id: 'all', data: inquiries });
    await queueOfflineAction('saveInquiry', inquiry);
    return newInquiry;
  }
};

export const updateInquiryStatus = async (id, status) => {
  try {
    const res = await fetchWithAuth(`${API_BASE}/inquiries/status`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, status })
    });
    if (res.ok) {
      const inquiries = await getInquiries();
      await idbPut('inquiries', { id: 'all', data: inquiries });
      return true;
    }
  } catch (e) {
    // Offline fallback
    const cachedInquiriesObj = await idbGet('inquiries', 'all');
    const inquiries = cachedInquiriesObj ? cachedInquiriesObj.data : [];
    const idx = inquiries.findIndex(i => i.id === id);
    if (idx !== -1) {
      inquiries[idx].status = status;
      inquiries[idx]._localTimestamp = Date.now();
      await idbPut('inquiries', { id: 'all', data: inquiries });
      await queueOfflineAction('updateInquiryStatus', { id, status });
      return true;
    }
  }
  return false;
};

// ─── Reset Data ───────────────────────────────────────────────────────────────
export const resetToDefaults = async () => {
  try {
    // Restore default state on server
    await fetchWithAuth(`${API_BASE}/crops`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(null) // Server will restore defaults if passed null
    });
  } catch (e) {
    // Offline
  }
  await idbDelete('crops', 'all');
  await idbDelete('users', 'all');
  await idbDelete('deliveries', 'all');
  await idbDelete('dispatches', 'all');
  await idbDelete('inquiries', 'all');
  await idbDelete('translations', 'all');
  await idbDelete('slides', 'all');
  await idbDelete('manual', 'all');
  await idbClear('offlineActions');
  await initDb();
};

// ─── Translations ─────────────────────────────────────────────────────────────
export const initTranslations = async (defaultTranslations) => {
  const cached = await idbGet('translations', 'all');
  if (!cached || !cached.data) {
    try {
      const res = await fetchWithAuth(`${API_BASE}/translations`);
      if (res.ok) {
        const translations = await res.json();
        if (translations) {
          await idbPut('translations', { id: 'all', data: translations });
          return;
        }
      }
    } catch (e) {
      // Offline
    }
    // Fallback to defaults
    await idbPut('translations', { id: 'all', data: defaultTranslations });
  }
};

export const getTranslations = async () => {
  try {
    const res = await fetchWithAuth(`${API_BASE}/translations`);
    if (res.ok) {
      const translations = await res.json();
      if (translations) {
        await idbPut('translations', { id: 'all', data: translations });
        return translations;
      }
    }
  } catch (e) {
    // Offline fallback
  }
  const cached = await idbGet('translations', 'all');
  return cached ? cached.data : null;
};

export const updateTranslation = async (lang, key, value) => {
  const cached = await idbGet('translations', 'all');
  const current = cached ? cached.data : {};
  if (!current[lang]) current[lang] = {};
  current[lang][key] = value;
  await idbPut('translations', { id: 'all', data: current });

  try {
    await fetchWithAuth(`${API_BASE}/translations`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(current)
    });
  } catch (e) {
    // Offline fallback
    await queueOfflineAction('updateTranslation', current);
  }
};

export const resetTranslations = async () => {
  await idbDelete('translations', 'all');
  try {
    await fetchWithAuth(`${API_BASE}/translations`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(null)
    });
  } catch (e) {
    // Offline
  }
};

// Sequential synchronizer for offline queued actions (with timestamp conflict-resolution checking)
export const syncOfflineData = async () => {
  const queue = await idbGetAll('offlineActions');
  if (queue.length === 0) return { success: true, count: 0 };

  // Sort queue chronologically to maintain transaction order
  queue.sort((a, b) => a.timestamp - b.timestamp);

  let successCount = 0;
  let errorCount = 0;

  // Fetch the latest server data version to check for conflict updates
  let serverCrops = {};
  try {
    const cropsRes = await fetchWithAuth(`${API_BASE}/crops`);
    if (cropsRes.ok) {
      serverCrops = await cropsRes.json();
    }
  } catch (e) {
    // If we can't connect, stop syncing
    return { success: false, successCount: 0, errorCount: queue.length };
  }

  for (const item of queue) {
    const { actionType, payload, id } = item;
    try {
      let res;
      
      // Timestamp Conflict Check:
      // If client attempts to upload an offline crop config, check if the server has a newer version.
      if (actionType === 'saveCrops') {
        const serverTimestamp = serverCrops._lastUpdated || 0;
        if (payload._lastUpdated && payload._lastUpdated < serverTimestamp) {
          console.warn(`[Sync Conflict] Dropped local 'saveCrops' action since server has a newer version.`);
          await idbDelete('offlineActions', id);
          successCount++;
          continue;
        }
      }

      if (actionType === 'saveCrops') {
        res = await fetchWithAuth(`${API_BASE}/crops`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
      } else if (actionType === 'registerUser') {
        res = await fetchWithAuth(`${API_BASE}/auth/register`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
      } else if (actionType === 'registerAdmin') {
        res = await fetchWithAuth(`${API_BASE}/auth/register-admin`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
      } else if (actionType === 'updateUser') {
        res = await fetchWithAuth(`${API_BASE}/users/update`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
      } else if (actionType === 'deleteUser') {
        res = await fetchWithAuth(`${API_BASE}/users/delete`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ username: payload })
        });
      } else if (actionType === 'saveDelivery') {
        res = await fetchWithAuth(`${API_BASE}/deliveries`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
      } else if (actionType === 'updateDeliveryStatus') {
        res = await fetchWithAuth(`${API_BASE}/deliveries/status`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
      } else if (actionType === 'saveDispatch') {
        res = await fetchWithAuth(`${API_BASE}/dispatches`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
      } else if (actionType === 'updateDispatchStatus') {
        res = await fetchWithAuth(`${API_BASE}/dispatches/status`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
      } else if (actionType === 'saveInquiry') {
        res = await fetchWithAuth(`${API_BASE}/inquiries`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
      } else if (actionType === 'updateInquiryStatus') {
        res = await fetchWithAuth(`${API_BASE}/inquiries/status`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
      } else if (actionType === 'updateTranslation') {
        res = await fetchWithAuth(`${API_BASE}/translations`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
      }

      if (res && res.ok) {
        successCount++;
        await idbDelete('offlineActions', id);
      } else {
        errorCount++;
      }
    } catch (e) {
      console.error(`Failed to sync offline action ${actionType}:`, e);
      errorCount++;
    }
  }

  return { success: errorCount === 0, successCount, errorCount };
};

// ─── Slides Management ────────────────────────────────────────────────────────
export const getSlides = async () => {
  try {
    const res = await fetchWithAuth(`${API_BASE}/slides`);
    if (res.ok) {
      const slides = await res.json();
      await idbPut('slides', { id: 'all', data: slides });
      return slides;
    }
  } catch (e) {
    console.error('Offline or error getting slides:', e);
  }
  const cached = await idbGet('slides', 'all');
  return cached ? cached.data : [];
};

export const saveSlides = async (slides) => {
  try {
    const res = await fetchWithAuth(`${API_BASE}/slides`, {
      method: 'POST',
      body: JSON.stringify(slides)
    });
    if (res.ok) {
      const result = await res.json();
      if (result.success) {
        await idbPut('slides', { id: 'all', data: result.slides });
        return result.slides;
      }
    }
  } catch (e) {
    console.error('Offline or error saving slides:', e);
  }
  await idbPut('slides', { id: 'all', data: slides });
  return slides;
};

// ─── Image Uploading Helper ───────────────────────────────────────────────────
export const uploadImage = async (file) => {
  const token = localStorage.getItem('jeroma_jwt_token');
  
  // Convert file to base64
  const base64Data = await new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result);
    reader.onerror = error => reject(error);
  });

  const headers = {
    'Content-Type': 'application/json'
  };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const res = await window.fetch(`${API_BASE}/upload`, {
    method: 'POST',
    headers,
    body: JSON.stringify({
      filename: file.name,
      base64: base64Data
    })
  });

  if (!res.ok) {
    const errorData = await res.json();
    throw new Error(errorData.error || 'Upload failed');
  }

  return res.json();
};

// ─── Training Manual Database Helpers ──────────────────────────────────────────
export const getManual = async () => {
  try {
    const res = await fetchWithAuth(`${API_BASE}/manual`);
    if (res.ok) {
      const manual = await res.json();
      await idbPut('manual', { id: 'all', data: manual });
      return manual;
    }
  } catch (e) {
    console.error('Offline or error getting manual stages:', e);
  }
  const cached = await idbGet('manual', 'all');
  return cached ? cached.data : null;
};

export const saveManual = async (manual) => {
  try {
    const res = await fetchWithAuth(`${API_BASE}/manual`, {
      method: 'POST',
      body: JSON.stringify(manual)
    });
    if (res.ok) {
      const result = await res.json();
      if (result.success) {
        await idbPut('manual', { id: 'all', data: result.manual });
        return result.manual;
      }
    }
  } catch (e) {
    console.error('Offline or error saving manual stages:', e);
  }
  await idbPut('manual', { id: 'all', data: manual });
  return manual;
};
