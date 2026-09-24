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

export const deleteCrop = async (cropId) => {
  const currentCrops = await getCrops();
  if (currentCrops && currentCrops[cropId]) {
    const updated = { ...currentCrops };
    delete updated[cropId];
    await saveCrops(updated);
    return true;
  }
  return false;
};

// ─── Users & Auth ─────────────────────────────────────────────────────────────
export const getUsers = async () => {
  const cached = await idbGet('users', 'all');
  const localUsers = cached ? cached.data : [];

  try {
    const res = await fetchWithAuth(`${API_BASE}/users`);
    if (res.ok) {
      const serverUsers = await res.json();
      
      // Smart merge: Preserve locally registered users and locally promoted roles/passwords
      const userMap = new Map();
      
      // Seed with local users
      for (const u of localUsers) {
        if (u && u.username) {
          userMap.set(u.username.toLowerCase(), u);
        }
      }
      
      // Overlay server users without losing local credentials or admin promotions
      for (const su of serverUsers) {
        if (!su || !su.username) continue;
        const key = su.username.toLowerCase();
        const existingLocal = userMap.get(key);
        if (existingLocal) {
          userMap.set(key, {
            ...su,
            ...existingLocal,
            // If user was made admin locally, preserve admin role across server spin-downs
            role: (existingLocal.role === 'admin' ? 'admin' : su.role) || existingLocal.role,
            status: existingLocal.status || su.status || 'active',
            permissions: existingLocal.permissions || su.permissions || []
          });
        } else {
          userMap.set(key, su);
        }
      }

      const mergedUsers = Array.from(userMap.values());
      await idbPut('users', { id: 'all', data: mergedUsers });
      return mergedUsers;
    }
  } catch (e) {
    // Offline fallback
  }
  return localUsers;
};

export const validateLogin = async (username, password) => {
  const normInput = (username || '').trim().toLowerCase();
  const digitsInput = normInput.replace(/\D/g, '');
  const hashed = await hashPassword(password);

  // Local fallback verifier for offline use or when Render free server restarts/sleeps
  const checkLocalLogin = async () => {
    const cachedUsersObj = await idbGet('users', 'all');
    const users = cachedUsersObj ? cachedUsersObj.data : [];
    const user = users.find(u => {
      const uName = (u.username || '').toLowerCase();
      const uEmail = (u.email || '').toLowerCase();
      const uPhoneDigits = (u.phone || '').replace(/\D/g, '');
      const match = uName === normInput || 
                    (uEmail && uEmail === normInput) || 
                    (digitsInput.length >= 6 && uPhoneDigits && (uPhoneDigits === digitsInput || uPhoneDigits.endsWith(digitsInput) || digitsInput.endsWith(uPhoneDigits)));
      return match && (u.password === hashed || !u.password);
    });
    if (user) {
      if (user.status === 'suspended') {
        throw new Error('Account has been suspended. Please contact the administrator.');
      }
      const { password: _password, ...userSession } = user;
      
      // Re-seed to server in the background so sleeping/restarted server restores the account
      try {
        fetchWithAuth(`${API_BASE}/auth/register`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ...user, password })
        }).catch(() => {});
      } catch (e) {}

      return userSession;
    }
    return null;
  };

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
      
      // Cache this user details locally with hashed password
      const cachedUsersObj = await idbGet('users', 'all');
      const localUsers = cachedUsersObj ? cachedUsersObj.data : [];
      const existingIdx = localUsers.findIndex(u => (u.username || '').toLowerCase() === (data.user.username || '').toLowerCase());
      const cachedUser = { ...data.user, password: hashed };
      if (existingIdx !== -1) {
        localUsers[existingIdx] = { ...localUsers[existingIdx], ...cachedUser };
      } else {
        localUsers.push(cachedUser);
      }
      await idbPut('users', { id: 'all', data: localUsers });
      
      return data.user;
    } else {
      // Server returned 401 or 404 (e.g. Render restarted and cleared in-memory DB)
      const localSession = await checkLocalLogin();
      if (localSession) return localSession;
    }
  } catch (e) {
    const localSession = await checkLocalLogin();
    if (localSession) return localSession;
  }
  return null;
};

export const registerUser = async (user) => {
  const hashed = await hashPassword(user.password);
  const newUser = { ...user, password: hashed, role: user.role || 'client', status: 'active' };

  // 1. Save to local IndexedDB first so registration is never lost
  const cachedUsersObj = await idbGet('users', 'all');
  const localUsers = cachedUsersObj ? cachedUsersObj.data : [];
  const targetUser = (user.username || '').toLowerCase();
  const existingIdx = localUsers.findIndex(u => (u.username || '').toLowerCase() === targetUser);
  if (existingIdx !== -1) {
    localUsers[existingIdx] = { ...localUsers[existingIdx], ...newUser };
  } else {
    localUsers.push(newUser);
  }
  await idbPut('users', { id: 'all', data: localUsers });

  // 2. Transmit to server
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
      return { success: true, user: data.user || newUser };
    }
    // If username existed on server or server rejected, return successful local user
    return { success: true, user: newUser };
  } catch (e) {
    await queueOfflineAction('registerUser', user);
    return { success: true, user: newUser };
  }
};

export const registerAdmin = async (user) => {
  const hashed = await hashPassword(user.password);
  const newAdmin = { ...user, password: hashed, role: 'admin', status: 'active' };

  // 1. Save locally first
  const cachedUsersObj = await idbGet('users', 'all');
  const localUsers = cachedUsersObj ? cachedUsersObj.data : [];
  const targetUser = (user.username || '').toLowerCase();
  const existingIdx = localUsers.findIndex(u => (u.username || '').toLowerCase() === targetUser);
  if (existingIdx !== -1) {
    localUsers[existingIdx] = { ...localUsers[existingIdx], ...newAdmin };
  } else {
    localUsers.push(newAdmin);
  }
  await idbPut('users', { id: 'all', data: localUsers });

  // 2. Transmit to server
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
      return { success: true, user: data.user || newAdmin };
    }
    return { success: true, user: newAdmin };
  } catch (e) {
    await queueOfflineAction('registerAdmin', user);
    return { success: true, user: newAdmin };
  }
};

export const updateUser = async (username, updatedData) => {
  const targetUser = (username || '').toLowerCase();

  // 1. Update logged user in localStorage if updating self
  const loggedUser = JSON.parse(localStorage.getItem('jeroma_logged_user') || '{}');
  if ((loggedUser.username || '').toLowerCase() === targetUser) {
    const newLoggedUser = { ...loggedUser, ...updatedData };
    localStorage.setItem('jeroma_logged_user', JSON.stringify(newLoggedUser));
  }

  // 2. Update local users database immediately
  const cachedUsersObj = await idbGet('users', 'all');
  const localUsers = cachedUsersObj ? cachedUsersObj.data : [];
  const idx = localUsers.findIndex(u => (u.username || '').toLowerCase() === targetUser);
  if (idx !== -1) {
    let passwordHash = localUsers[idx].password;
    if (updatedData.password) {
      passwordHash = await hashPassword(updatedData.password);
    }
    localUsers[idx] = { 
      ...localUsers[idx], 
      ...updatedData,
      ...(passwordHash ? { password: passwordHash } : {})
    };
    await idbPut('users', { id: 'all', data: localUsers });
  }

  // 3. Transmit update to server
  try {
    const res = await fetchWithAuth(`${API_BASE}/users/update`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, updatedData })
    });
    if (res.ok) {
      return true;
    }
  } catch (e) {
    await queueOfflineAction('updateUser', { username, updatedData });
  }
  return true;
};

export const deleteUser = async (username) => {
  const targetUser = (username || '').toLowerCase();
  const cachedUsersObj = await idbGet('users', 'all');
  const localUsers = cachedUsersObj ? cachedUsersObj.data : [];
  const filtered = localUsers.filter(u => (u.username || '').toLowerCase() !== targetUser);
  await idbPut('users', { id: 'all', data: filtered });

  try {
    await fetchWithAuth(`${API_BASE}/users/delete`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username })
    });
  } catch (e) {
    // ignore
  }
  return true;
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

export const updateDispatch = async (id, updatedFields) => {
  try {
    const res = await fetchWithAuth(`${API_BASE}/dispatches/update`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, ...updatedFields })
    });
    if (res.ok) {
      const dispatches = await getDispatches();
      await idbPut('dispatches', { id: 'all', data: dispatches });
      return true;
    }
  } catch (e) {
    // Offline fallback
  }
  const cachedDispatchesObj = await idbGet('dispatches', 'all');
  const dispatches = cachedDispatchesObj ? cachedDispatchesObj.data : [];
  const idx = dispatches.findIndex(d => d.id === id);
  if (idx !== -1) {
    dispatches[idx] = { ...dispatches[idx], ...updatedFields, _localTimestamp: Date.now() };
    await idbPut('dispatches', { id: 'all', data: dispatches });
    await queueOfflineAction('updateDispatch', { id, ...updatedFields });
    return true;
  }
  return false;
};

export const deleteDispatch = async (id) => {
  try {
    const res = await fetchWithAuth(`${API_BASE}/dispatches/delete`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id })
    });
    if (res.ok) {
      const dispatches = await getDispatches();
      await idbPut('dispatches', { id: 'all', data: dispatches });
      return true;
    }
  } catch (e) {
    // Offline fallback
  }
  const cachedDispatchesObj = await idbGet('dispatches', 'all');
  const dispatches = cachedDispatchesObj ? cachedDispatchesObj.data : [];
  const filtered = dispatches.filter(d => d.id !== id);
  if (filtered.length !== dispatches.length) {
    await idbPut('dispatches', { id: 'all', data: filtered });
    await queueOfflineAction('deleteDispatch', { id });
    return true;
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
    await fetchWithAuth(`${API_BASE}/reset-db`, {
      method: 'POST'
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
      } else if (actionType === 'saveSettings') {
        res = await fetchWithAuth(`${API_BASE}/settings`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
      } else if (actionType === 'saveSlides') {
        res = await fetchWithAuth(`${API_BASE}/slides`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
      } else if (actionType === 'saveManual') {
        res = await fetchWithAuth(`${API_BASE}/manual`, {
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
const DEFAULT_SLIDES = [
  {
    id: 'districts',
    icon: '📢',
    tag_en: 'News',
    tag_ach: 'Kop Manyen',
    title_en: 'Jeroma Farmers Now Operational in 7 Districts!',
    title_ach: 'Jeroma Farmers Do tye ka tic i District 7!',
    body_en: 'Pader, Agago, Kitgum, Abim, Karenga, Lira and Kole districts are all connected to Jeroma\'s collection network. More than 1,200 registered farmers benefit from daily pickup routes.',
    body_ach: 'District me Pader, Agago, Kitgum, Abim, Karenga, Lira ki Kole ducu dong ocokke i kabedo me cogo keyo me Jeroma. Lupur ma okwoye makato 1,200 dong gunongo ber me tic man.',
    image: '/jeroma_banner_7_districts.jpg',
    color: '#081c15',
    accent: '#52b788',
    fit: 'contain',
  },
  {
    id: 'training',
    icon: '🌱',
    tag_en: 'Activity',
    tag_ach: 'Ginnipiny',
    title_en: 'GAP Farmer Training Sessions Underway',
    title_ach: 'Dwol me Pwonj me GAP pi Lupur Tye ka Medde',
    body_en: 'Our extension officers are conducting Good Agronomic Practice (GAP) training workshops for registered farmers across all 7 districts — covering soil health, pest management, and post-harvest handling.',
    body_ach: 'Lutic mwa me extension tye ka kuto pwonj me Good Agronomic Practice (GAP) bot lupur ma okwoye i district ducu 7 — lok i kom ngom maber, gengo kwoyo, ki cogo keyo maber.',
    image: '/farmers_training_1.jpg',
    color: '#081c15',
    accent: '#52b788',
    fit: 'cover',
  },
  {
    id: 'sunflower',
    icon: '🌻',
    tag_en: 'Activity',
    tag_ach: 'Ginnipiny',
    title_en: 'Sunflower Season: Grades Now Open for Delivery',
    title_ach: 'Cawa me Anyim (Sunflower): Rwom me Cogo tye Ayela',
    body_en: 'Sunflower is accepted at all collection hubs. Target moisture: 9–10%. Grade-A payout is UGX 2,200/Kg. Ensure proper drying on raised racks before delivery to secure premium rates.',
    body_ach: 'Cogo anyim (sunflower) dong tye i kabedo mwa ducu me cogo keyo. Dit me pii: 9-10%. Wel Grade-A payout tye UGX 2,200/Kg. Tim be itoyo maber anyim ma peya itero botwa.',
    image: '/maize_crop_banner.jpg',
    color: '#081c15',
    accent: '#52b788',
    fit: 'cover',
  },
  {
    id: 'team',
    icon: '👥',
    tag_en: 'Team',
    tag_ach: 'Lutic mwa',
    title_en: 'Meet Our Dedicated Jeroma FCC Ltd. Staff',
    title_ach: 'Nen Lutic mwa me Jeroma FCC Ltd.',
    body_en: 'Our professional team of managers, agronomy experts, extension officers, and support staff are committed to transforming subsistence farming into commercial agriculture and improving rural livelihoods.',
    body_ach: 'Team mwa me lutic madito, lutic me agronomy, extension officers, ki lutic ducu gubed guwankere pi loko pur me codo keyo me donyo i lobo me biro biyo kwo maber.',
    image: '/jeroma_staffs.jpg',
    color: '#081c15',
    accent: '#52b788',
    fit: 'cover',
  },
  {
    id: 'video_a2i_lira',
    icon: '🎥',
    tag_en: 'Training Video',
    tag_ach: 'Video me Pwonj',
    title_en: 'A2I Lira Farmer Training in Action',
    title_ach: 'Pwonj me A2I i Lira pi Lupur',
    body_en: 'Watch Jeroma, Access to Innovation (A2I), and partner bank teams conducting practical field training with local farmers and SACCOs in Lira on modern agro-machinery and financial literacy.',
    body_ach: 'Nen team me Jeroma, A2I, kede Bank tye ka pwonjo lupur kede SACCOs i Lira kom mashini me pur kede neno cente.',
    video: '/videos/a2i_lira_training.mp4',
    color: '#081c15',
    accent: '#52b788',
    fit: 'cover',
  },
  {
    id: 'video_fallarmy_worm',
    icon: '🐛',
    tag_en: 'Crop Protection Video',
    tag_ach: 'Gengo Kwoyo (Video)',
    title_en: 'Fall Armyworm Field Scouting & Protection',
    title_ach: 'Gengo Fall Armyworm kede Kwoyo i Cam',
    body_en: 'Field extension guidance on scouting, early detection, and safe biological control techniques to protect maize and sunflower crops against fall armyworm outbreaks.',
    body_ach: 'Pwonj me poto kom gengo Fall Armyworm ma balu anwanyi kede cam, pwonjo lupur yore me yeyi kabilo maber wek cam obed ma kwo.',
    video: '/videos/fallarmy_worm.mp4',
    color: '#081c15',
    accent: '#52b788',
    fit: 'cover',
  },
  {
    id: 'partnership_a2i',
    icon: '🚀',
    tag_en: 'Implementation',
    tag_ach: 'Dwol me Tic',
    title_en: 'A2I Cohort 1: Implementation Stage & Joint Farmer Trainings',
    title_ach: 'A2I Cohort 1: Dwol me Tic & Pwonj me Lupur ki Bank, Jeroma & A2I',
    body_en: 'The Agricultural Modernization & Capacity Building Initiative (Cohort 1) is now under the Implementation Stage! In conjunction with Access to Innovation (A2I) and supported by the Danish Government, joint farmer trainings are actively underway conducted by commercial partner banks, Jeroma agronomy experts, and A2I teams.',
    body_ach: 'Prujek me A2I Cohort 1 dong ocopo i dwol me tic me poto! I ribbe tic ki Access to Innovation (A2I) kede Gavumenti me Denmark, pwonj dongo bot lupur tye ka medde ma team me commercial banks, Jeroma, kede A2I tye ka miyo kanyacel.',
    image: '/a2i_project_2.jpg',
    color: '#081c15',
    accent: '#52b788',
    fit: 'cover',
  }
];

export const getSlides = async () => {
  try {
    const res = await fetchWithAuth(`${API_BASE}/slides`);
    if (res.ok) {
      const slides = await res.json();
      if (Array.isArray(slides) && slides.length > 0) {
        const slideIds = new Set(slides.map(s => s.id));
        const missingDefaults = DEFAULT_SLIDES.filter(ds => !slideIds.has(ds.id));
        const merged = missingDefaults.length > 0 ? [...slides, ...missingDefaults] : slides;
        await idbPut('slides', { id: 'all', data: merged });
        return merged;
      }
    }
  } catch (e) {
    console.error('Offline or error getting slides:', e);
  }
  const cached = await idbGet('slides', 'all');
  if (cached && Array.isArray(cached.data) && cached.data.length > 0) {
    const slideIds = new Set(cached.data.map(s => s.id));
    const missingDefaults = DEFAULT_SLIDES.filter(ds => !slideIds.has(ds.id));
    return missingDefaults.length > 0 ? [...cached.data, ...missingDefaults] : cached.data;
  }
  return DEFAULT_SLIDES;
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
  await queueOfflineAction('saveSlides', slides);
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

  try {
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

    if (res.ok) {
      return await res.json();
    }
  } catch (err) {
    console.warn('Server upload endpoint unreachable, using local data URL fallback:', err);
  }

  // Graceful fallback to data URL directly
  return { success: true, url: base64Data };
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

export const getAlerts = async () => {
  try {
    const res = await fetchWithAuth(`${API_BASE}/alerts`);
    if (res.ok) {
      return await res.json();
    }
  } catch (e) {
    console.error('Error fetching system alerts:', e);
  }
  return [];
};

export const getLogins = async () => {
  try {
    const res = await fetchWithAuth(`${API_BASE}/logins`);
    if (res.ok) {
      return await res.json();
    }
  } catch (e) {
    console.error('Error fetching login history:', e);
  }
  return [];
};

export const getSettings = async () => {
  try {
    const res = await fetchWithAuth(`${API_BASE}/settings`);
    if (res.ok) {
      const settings = await res.json();
      await idbPut('settings', { id: 'all', data: settings });
      return settings;
    }
  } catch (e) {
    console.error('Offline or error getting settings:', e);
  }
  const cached = await idbGet('settings', 'all');
  return cached ? cached.data : { hideManual: false };
};

export const saveSettings = async (settings) => {
  try {
    const res = await fetchWithAuth(`${API_BASE}/settings`, {
      method: 'POST',
      body: JSON.stringify(settings)
    });
    if (res.ok) {
      const result = await res.json();
      if (result.success) {
        await idbPut('settings', { id: 'all', data: result.settings });
        return result.settings;
      }
    }
  } catch (e) {
    console.error('Offline or error saving settings:', e);
  }
  const current = await getSettings();
  const updated = { ...current, ...settings };
  await idbPut('settings', { id: 'all', data: updated });
  await queueOfflineAction('saveSettings', settings);
  return updated;
};

export const replyToInquiry = async (id, reply) => {
  try {
    const res = await fetchWithAuth(`${API_BASE}/inquiries/reply`, {
      method: 'POST',
      body: JSON.stringify({ id, reply })
    });
    if (res.ok) {
      const cached = await idbGet('inquiries', 'all');
      if (cached && cached.data) {
        const idx = cached.data.findIndex(i => i.id === id);
        if (idx !== -1) {
          cached.data[idx].reply = reply;
          cached.data[idx].status = 'Replied';
          await idbPut('inquiries', cached);
        }
      }
      return await res.json();
    }
  } catch (e) {
    console.error('Error replying to inquiry:', e);
  }
  return { success: false };
};

export const replyToDispatch = async (id, reply) => {
  try {
    const res = await fetchWithAuth(`${API_BASE}/dispatches/reply`, {
      method: 'POST',
      body: JSON.stringify({ id, reply })
    });
    if (res.ok) {
      const cached = await idbGet('dispatches', 'all');
      if (cached && cached.data) {
        const idx = cached.data.findIndex(d => d.id === id);
        if (idx !== -1) {
          cached.data[idx].reply = reply;
          await idbPut('dispatches', cached);
        }
      }
      return await res.json();
    }
  } catch (e) {
    console.error('Error replying to dispatch:', e);
  }
  return { success: false };
};

export const restoreServerFromLocalBackup = async () => {
  try {
    const crops = (await idbGet('crops', 'all'))?.data;
    const users = (await idbGet('users', 'all'))?.data;
    const deliveries = (await idbGet('deliveries', 'all'))?.data;
    const dispatches = (await idbGet('dispatches', 'all'))?.data;
    const inquiries = (await idbGet('inquiries', 'all'))?.data;
    const translations = (await idbGet('translations', 'all'))?.data;
    const manual = (await idbGet('manual', 'all'))?.data;
    const slides = (await idbGet('slides', 'all'))?.data;
    const settings = (await idbGet('settings', 'all'))?.data;
    const projects = (await idbGet('projects', 'all'))?.data;
    const staff = (await idbGet('staff', 'all'))?.data;
    const cooperatives = (await idbGet('cooperatives', 'all'))?.data;
    const machinery = (await idbGet('machinery', 'all'))?.data;
    const finance = (await idbGet('finance', 'all'))?.data;
    const nurseries = (await idbGet('nurseries', 'all'))?.data;
    const formSubmissions = (await idbGet('formSubmissions', 'all'))?.data;

    const res = await fetchWithAuth(`${API_BASE}/restore-backup`, {
      method: 'POST',
      body: JSON.stringify({
        crops, users, deliveries, dispatches, inquiries,
        translations, manual, slides, settings,
        projects, staff, cooperatives, machinery,
        finance, nurseries, formSubmissions
      })
    });
    
    if (res.ok) {
      return { success: true };
    }
  } catch (e) {
    console.error('Error restoring backup to server:', e);
  }
  return { success: false };
};

// ─── Universal Projects Management ────────────────────────────────────────────
export const getProjects = async () => {
  try {
    const res = await fetchWithAuth(`${API_BASE}/projects`);
    if (res.ok) {
      const projects = await res.json();
      if (Array.isArray(projects)) {
        await idbPut('projects', { id: 'all', data: projects });
        return projects;
      }
    }
  } catch (e) {
    console.error('Offline or error getting projects:', e);
  }
  const cached = await idbGet('projects', 'all');
  return cached ? cached.data : [];
};

export const saveProject = async (project) => {
  try {
    const res = await fetchWithAuth(`${API_BASE}/projects`, {
      method: 'POST',
      body: JSON.stringify(project)
    });
    if (res.ok) {
      const data = await res.json();
      const current = await getProjects();
      await idbPut('projects', { id: 'all', data: current });
      return data.project || project;
    }
  } catch (e) {
    console.error('Offline saving project:', e);
  }
  const cached = await idbGet('projects', 'all');
  let list = cached ? cached.data : [];
  if (!project.id) project.id = 'proj-' + Date.now();
  const idx = list.findIndex(p => p.id === project.id);
  if (idx !== -1) {
    list[idx] = { ...list[idx], ...project };
  } else {
    list.unshift(project);
  }
  await idbPut('projects', { id: 'all', data: list });
  await queueOfflineAction('saveProject', project);
  return project;
};

export const deleteProject = async (id) => {
  try {
    const res = await fetchWithAuth(`${API_BASE}/projects/delete`, {
      method: 'POST',
      body: JSON.stringify({ id })
    });
    if (res.ok) {
      const current = await getProjects();
      await idbPut('projects', { id: 'all', data: current });
      return true;
    }
  } catch (e) {
    console.error('Offline deleting project:', e);
  }
  const cached = await idbGet('projects', 'all');
  if (cached && cached.data) {
    const filtered = cached.data.filter(p => p.id !== id);
    await idbPut('projects', { id: 'all', data: filtered });
  }
  await queueOfflineAction('deleteProject', { id });
  return true;
};

// ─── Staff & Positions HR Management ───────────────────────────────────────────
export const getStaffMembers = async () => {
  try {
    const res = await fetchWithAuth(`${API_BASE}/staff`);
    if (res.ok) {
      const staff = await res.json();
      if (Array.isArray(staff)) {
        await idbPut('staff', { id: 'all', data: staff });
        return staff;
      }
    }
  } catch (e) {
    console.error('Offline or error getting staff:', e);
  }
  const cached = await idbGet('staff', 'all');
  return cached ? cached.data : [];
};

export const saveStaffMember = async (staffMember) => {
  try {
    const res = await fetchWithAuth(`${API_BASE}/staff`, {
      method: 'POST',
      body: JSON.stringify(staffMember)
    });
    if (res.ok) {
      const data = await res.json();
      const current = await getStaffMembers();
      await idbPut('staff', { id: 'all', data: current });
      return data.staffMember || staffMember;
    }
  } catch (e) {
    console.error('Offline saving staff:', e);
  }
  const cached = await idbGet('staff', 'all');
  let list = cached ? cached.data : [];
  if (!staffMember.id) staffMember.id = 'stf-' + Date.now();
  const idx = list.findIndex(s => s.id === staffMember.id);
  if (idx !== -1) {
    list[idx] = { ...list[idx], ...staffMember };
  } else {
    list.unshift(staffMember);
  }
  await idbPut('staff', { id: 'all', data: list });
  await queueOfflineAction('saveStaffMember', staffMember);
  return staffMember;
};

export const deleteStaffMember = async (id) => {
  try {
    const res = await fetchWithAuth(`${API_BASE}/staff/delete`, {
      method: 'POST',
      body: JSON.stringify({ id })
    });
    if (res.ok) {
      const current = await getStaffMembers();
      await idbPut('staff', { id: 'all', data: current });
      return true;
    }
  } catch (e) {
    console.error('Offline deleting staff:', e);
  }
  const cached = await idbGet('staff', 'all');
  if (cached && cached.data) {
    const filtered = cached.data.filter(s => s.id !== id);
    await idbPut('staff', { id: 'all', data: filtered });
  }
  await queueOfflineAction('deleteStaffMember', { id });
  return true;
};

// ─── Cooperatives & SACCOs Directory ───────────────────────────────────────────
export const getCooperatives = async () => {
  try {
    const res = await fetchWithAuth(`${API_BASE}/cooperatives`);
    if (res.ok) {
      const cooperatives = await res.json();
      if (Array.isArray(cooperatives)) {
        await idbPut('cooperatives', { id: 'all', data: cooperatives });
        return cooperatives;
      }
    }
  } catch (e) {
    console.error('Offline or error getting cooperatives:', e);
  }
  const cached = await idbGet('cooperatives', 'all');
  return cached ? cached.data : [];
};

export const saveCooperative = async (cooperative) => {
  try {
    const res = await fetchWithAuth(`${API_BASE}/cooperatives`, {
      method: 'POST',
      body: JSON.stringify(cooperative)
    });
    if (res.ok) {
      const data = await res.json();
      const current = await getCooperatives();
      await idbPut('cooperatives', { id: 'all', data: current });
      return data.cooperative || cooperative;
    }
  } catch (e) {
    console.error('Offline saving cooperative:', e);
  }
  const cached = await idbGet('cooperatives', 'all');
  let list = cached ? cached.data : [];
  if (!cooperative.id) cooperative.id = 'coop-' + Date.now();
  const idx = list.findIndex(c => c.id === cooperative.id);
  if (idx !== -1) {
    list[idx] = { ...list[idx], ...cooperative };
  } else {
    list.unshift(cooperative);
  }
  await idbPut('cooperatives', { id: 'all', data: list });
  await queueOfflineAction('saveCooperative', cooperative);
  return cooperative;
};

export const deleteCooperative = async (id) => {
  try {
    const res = await fetchWithAuth(`${API_BASE}/cooperatives/delete`, {
      method: 'POST',
      body: JSON.stringify({ id })
    });
    if (res.ok) {
      const current = await getCooperatives();
      await idbPut('cooperatives', { id: 'all', data: current });
      return true;
    }
  } catch (e) {
    console.error('Offline deleting cooperative:', e);
  }
  const cached = await idbGet('cooperatives', 'all');
  if (cached && cached.data) {
    const filtered = cached.data.filter(c => c.id !== id);
    await idbPut('cooperatives', { id: 'all', data: filtered });
  }
  await queueOfflineAction('deleteCooperative', { id });
  return true;
};

// ─── Machinery & Technology Allocation ─────────────────────────────────────────
export const getMachineryAssets = async () => {
  try {
    const res = await fetchWithAuth(`${API_BASE}/machinery`);
    if (res.ok) {
      const machinery = await res.json();
      if (Array.isArray(machinery)) {
        await idbPut('machinery', { id: 'all', data: machinery });
        return machinery;
      }
    }
  } catch (e) {
    console.error('Offline or error getting machinery:', e);
  }
  const cached = await idbGet('machinery', 'all');
  return cached ? cached.data : [];
};

export const saveMachineryAsset = async (machine) => {
  try {
    const res = await fetchWithAuth(`${API_BASE}/machinery`, {
      method: 'POST',
      body: JSON.stringify(machine)
    });
    if (res.ok) {
      const data = await res.json();
      const current = await getMachineryAssets();
      await idbPut('machinery', { id: 'all', data: current });
      return data.machinery || machine;
    }
  } catch (e) {
    console.error('Offline saving machine:', e);
  }
  const cached = await idbGet('machinery', 'all');
  let list = cached ? cached.data : [];
  if (!machine.id) machine.id = 'mac-' + Date.now();
  const idx = list.findIndex(m => m.id === machine.id);
  if (idx !== -1) {
    list[idx] = { ...list[idx], ...machine };
  } else {
    list.unshift(machine);
  }
  await idbPut('machinery', { id: 'all', data: list });
  await queueOfflineAction('saveMachineryAsset', machine);
  return machine;
};

export const deleteMachineryAsset = async (id) => {
  try {
    const res = await fetchWithAuth(`${API_BASE}/machinery/delete`, {
      method: 'POST',
      body: JSON.stringify({ id })
    });
    if (res.ok) {
      const current = await getMachineryAssets();
      await idbPut('machinery', { id: 'all', data: current });
      return true;
    }
  } catch (e) {
    console.error('Offline deleting machine:', e);
  }
  const cached = await idbGet('machinery', 'all');
  if (cached && cached.data) {
    const filtered = cached.data.filter(m => m.id !== id);
    await idbPut('machinery', { id: 'all', data: filtered });
  }
  await queueOfflineAction('deleteMachineryAsset', { id });
  return true;
};

// ─── Department Operations: Finance ───────────────────────────────────────────
export const getFinancialRecords = async () => {
  try {
    const res = await fetchWithAuth(`${API_BASE}/departments/finance`);
    if (res.ok) {
      const finance = await res.json();
      if (Array.isArray(finance)) {
        await idbPut('finance', { id: 'all', data: finance });
        return finance;
      }
    }
  } catch (e) {
    console.error('Offline or error getting finance:', e);
  }
  const cached = await idbGet('finance', 'all');
  return cached ? cached.data : [];
};

export const saveFinancialRecord = async (record) => {
  try {
    const res = await fetchWithAuth(`${API_BASE}/departments/finance`, {
      method: 'POST',
      body: JSON.stringify(record)
    });
    if (res.ok) {
      const data = await res.json();
      const current = await getFinancialRecords();
      await idbPut('finance', { id: 'all', data: current });
      return data.record || record;
    }
  } catch (e) {
    console.error('Offline saving finance:', e);
  }
  const cached = await idbGet('finance', 'all');
  let list = cached ? cached.data : [];
  if (!record.id) record.id = 'fin-' + Date.now();
  const idx = list.findIndex(f => f.id === record.id);
  if (idx !== -1) {
    list[idx] = { ...list[idx], ...record };
  } else {
    list.unshift(record);
  }
  await idbPut('finance', { id: 'all', data: list });
  await queueOfflineAction('saveFinancialRecord', record);
  return record;
};

export const deleteFinancialRecord = async (id) => {
  try {
    const res = await fetchWithAuth(`${API_BASE}/departments/finance/delete`, {
      method: 'POST',
      body: JSON.stringify({ id })
    });
    if (res.ok) {
      const current = await getFinancialRecords();
      await idbPut('finance', { id: 'all', data: current });
      return true;
    }
  } catch (e) {
    console.error('Offline deleting finance record:', e);
  }
  const cached = await idbGet('finance', 'all');
  if (cached && cached.data) {
    const filtered = cached.data.filter(f => f.id !== id);
    await idbPut('finance', { id: 'all', data: filtered });
  }
  await queueOfflineAction('deleteFinancialRecord', { id });
  return true;
};

// ─── Department Operations: Tree Nurseries ─────────────────────────────────────
export const getNurseries = async () => {
  try {
    const res = await fetchWithAuth(`${API_BASE}/departments/nurseries`);
    if (res.ok) {
      const nurseries = await res.json();
      if (Array.isArray(nurseries)) {
        await idbPut('nurseries', { id: 'all', data: nurseries });
        return nurseries;
      }
    }
  } catch (e) {
    console.error('Offline or error getting nurseries:', e);
  }
  const cached = await idbGet('nurseries', 'all');
  return cached ? cached.data : [];
};

export const saveNursery = async (nursery) => {
  try {
    const res = await fetchWithAuth(`${API_BASE}/departments/nurseries`, {
      method: 'POST',
      body: JSON.stringify(nursery)
    });
    if (res.ok) {
      const data = await res.json();
      const current = await getNurseries();
      await idbPut('nurseries', { id: 'all', data: current });
      return data.nursery || nursery;
    }
  } catch (e) {
    console.error('Offline saving nursery:', e);
  }
  const cached = await idbGet('nurseries', 'all');
  let list = cached ? cached.data : [];
  if (!nursery.id) nursery.id = 'nur-' + Date.now();
  const idx = list.findIndex(n => n.id === nursery.id);
  if (idx !== -1) {
    list[idx] = { ...list[idx], ...nursery };
  } else {
    list.unshift(nursery);
  }
  await idbPut('nurseries', { id: 'all', data: list });
  await queueOfflineAction('saveNursery', nursery);
  return nursery;
};

// ─── Google Forms & Survey Ingestion ───────────────────────────────────────────
export const getFormSubmissions = async () => {
  try {
    const res = await fetchWithAuth(`${API_BASE}/forms/submissions`);
    if (res.ok) {
      const submissions = await res.json();
      if (Array.isArray(submissions)) {
        await idbPut('formSubmissions', { id: 'all', data: submissions });
        return submissions;
      }
    }
  } catch (e) {
    console.error('Offline or error getting submissions:', e);
  }
  const cached = await idbGet('formSubmissions', 'all');
  return cached ? cached.data : [];
};

export const submitFormResponse = async (submission) => {
  try {
    const res = await fetch(`${API_BASE}/forms/submit`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(submission)
    });
    if (res.ok) {
      return await res.json();
    }
  } catch (e) {
    console.error('Offline submitting form response:', e);
  }
  const cached = await idbGet('formSubmissions', 'all');
  let list = cached ? cached.data : [];
  const localSubmission = {
    id: 'sub-' + Date.now(),
    submittedAt: new Date().toISOString(),
    status: 'New (Local)',
    ...submission
  };
  list.unshift(localSubmission);
  await idbPut('formSubmissions', { id: 'all', data: list });
  await queueOfflineAction('submitFormResponse', submission);
  return { success: true, id: localSubmission.id };
};

export const deleteFormSubmission = async (id) => {
  try {
    const res = await fetchWithAuth(`${API_BASE}/forms/submissions/delete`, {
      method: 'POST',
      body: JSON.stringify({ id })
    });
    if (res.ok) {
      const current = await getFormSubmissions();
      await idbPut('formSubmissions', { id: 'all', data: current });
      return true;
    }
  } catch (e) {
    console.error('Offline deleting submission:', e);
  }
  const cached = await idbGet('formSubmissions', 'all');
  if (cached && cached.data) {
    const filtered = cached.data.filter(s => s.id !== id);
    await idbPut('formSubmissions', { id: 'all', data: filtered });
  }
  await queueOfflineAction('deleteFormSubmission', { id });
  return true;
};

export const syncGoogleSheet = async (sheetUrl, rawData = null) => {
  try {
    const res = await fetchWithAuth(`${API_BASE}/forms/sync-sheet`, {
      method: 'POST',
      body: JSON.stringify({ sheetUrl, rawData })
    });
    if (res.ok) {
      const result = await res.json();
      if (result.submissions) {
        await idbPut('formSubmissions', { id: 'all', data: result.submissions });
      }
      return result;
    } else {
      const errData = await res.json().catch(() => ({}));
      throw new Error(errData.error || 'Failed to sync Google Sheet');
    }
  } catch (e) {
    console.error('syncGoogleSheet error:', e);
    throw e;
  }
};

export const DEFAULT_SOCIALS = {
  whatsapp: { enabled: true, handle: '+256 773 623 196', url: 'https://wa.me/256773623196', title: 'WhatsApp Business', subtitle: 'Direct Chat & Agro Input Inquiries', greeting: 'Hello Jeroma Farmers, I would like to inquire about input subsidies, crop collection, and prices.' },
  facebook: { enabled: true, handle: '@jeromafarmers', url: 'https://www.facebook.com/jeromafarmers', title: 'Facebook Page', subtitle: 'Jeroma Farmers Collection Centre Ltd' },
  tiktok: { enabled: true, handle: '@jeromafarmers', url: 'https://www.tiktok.com/@jeromafarmers', title: 'TikTok Channel', subtitle: 'Farmer Training & Field Operations' },
  x: { enabled: true, handle: '@JeromaFarmers', url: 'https://x.com/JeromaFarmers', title: 'X (Twitter)', subtitle: 'Real-time Bulletins & Commodity Updates' },
  youtube: { enabled: true, handle: '@jeromafarmers', url: 'https://www.youtube.com/@jeromafarmers', title: 'YouTube Channel', subtitle: 'Farmer Testimonials & Machinery Field Operations' },
  linkedin: { enabled: true, handle: 'jeromafarmers', url: 'https://www.linkedin.com/company/jeromafarmers', title: 'LinkedIn', subtitle: 'Corporate & Institutional Partnerships' },
  instagram: { enabled: true, handle: '@jeromafarmers', url: 'https://www.instagram.com/jeromafarmers', title: 'Instagram', subtitle: 'Farm Photography & Community Highlights' },
  telegram: { enabled: false, handle: '@jeromafarmers', url: 'https://t.me/jeromafarmers', title: 'Telegram Community', subtitle: 'Broadcasts & Cooperative Alerts' }
};

export const getSocials = async () => {
  try {
    const res = await window.fetch(`${API_BASE}/socials`);
    if (res.ok) {
      const data = await res.json();
      if (data && typeof data === 'object') {
        await idbPut('socials', { id: 'all', data });
        return data;
      }
    }
  } catch (e) {
    // network fallback
  }
  const cached = await idbGet('socials', 'all');
  if (cached && cached.data) return cached.data;
  return { ...DEFAULT_SOCIALS };
};

export const saveSocials = async (socialsData) => {
  try {
    const res = await fetchWithAuth(`${API_BASE}/socials`, {
      method: 'POST',
      body: JSON.stringify(socialsData)
    });
    if (res.ok) {
      const result = await res.json();
      const saved = result.socials || socialsData;
      await idbPut('socials', { id: 'all', data: saved });
      return saved;
    }
  } catch (e) {
    console.error('Offline saving socials:', e);
  }
  await idbPut('socials', { id: 'all', data: socialsData });
  await queueOfflineAction('saveSocials', socialsData);
  return socialsData;
};

// ─── Interoperability: Uganda Mobile Money (MTN & Airtel) ─────────────────────
export const disburseMomoPayout = async ({ phone, amountUGX, receiptNumber, farmerName }) => {
  try {
    const res = await fetchWithAuth(`${API_BASE}/momo/disburse`, {
      method: 'POST',
      body: JSON.stringify({ phone, amountUGX, receiptNumber, farmerName })
    });
    return await res.json();
  } catch (err) {
    console.error('Mobile money payout error:', err);
    return { success: false, error: err.message };
  }
};

// ─── Interoperability: Africa's Talking Uganda SMS Gateway ────────────────────
export const sendReceiptSms = async ({ phone, farmerName, receiptNumber, crop, netWeightKg, unitPrice, totalAmountUGX }) => {
  try {
    const res = await fetchWithAuth(`${API_BASE}/sms/send-receipt`, {
      method: 'POST',
      body: JSON.stringify({ phone, farmerName, receiptNumber, crop, netWeightKg, unitPrice, totalAmountUGX })
    });
    return await res.json();
  } catch (err) {
    console.error('SMS send error:', err);
    return { success: false, error: err.message };
  }
};

export const broadcastPriceSms = async ({ phoneNumbers, pricesText }) => {
  try {
    const res = await fetchWithAuth(`${API_BASE}/sms/broadcast`, {
      method: 'POST',
      body: JSON.stringify({ phoneNumbers, pricesText })
    });
    return await res.json();
  } catch (err) {
    console.error('SMS broadcast error:', err);
    return { success: false, error: err.message };
  }
};


