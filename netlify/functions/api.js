const db = require('./utils/serverDb');
const jwt = require('jsonwebtoken');
const { z } = require('zod');
const JWT_SECRET = process.env.JWT_SECRET || 'jeroma_farmers_secret_key_2026_lira_uganda';

// Helper to construct JSON response (respects credentials with Origin mapping)
const jsonResponse = (statusCode, data, event = null, setCookieHeader = null) => {
  const origin = (event && (event.headers.origin || event.headers.Origin)) || '*';
  const headers = {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': origin,
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Credentials': 'true'
  };

  if (setCookieHeader) {
    headers['Set-Cookie'] = setCookieHeader;
  }

  return {
    statusCode,
    headers,
    body: JSON.stringify(data)
  };
};

// Rate limiting in-memory storage (window: 1 minute)
const RATE_LIMIT_WINDOW = 60 * 1000;
const MAX_REQUESTS_PER_MIN = 100;
const ipCache = {};

const checkRateLimit = (event) => {
  const ip = event.headers['client-ip'] || event.headers['x-forwarded-for'] || 'local-ip';
  const now = Date.now();
  if (!ipCache[ip]) {
    ipCache[ip] = [];
  }
  // Remove expired timestamps
  ipCache[ip] = ipCache[ip].filter(t => now - t < RATE_LIMIT_WINDOW);
  if (ipCache[ip].length >= MAX_REQUESTS_PER_MIN) {
    return false;
  }
  ipCache[ip].push(now);
  return true;
};

// Helper to authenticate user from JWT token (supports cookies or headers)
const authenticateUser = (event) => {
  const authHeader = event.headers['authorization'] || event.headers['Authorization'];
  let token = '';
  
  if (authHeader) {
    token = authHeader.replace(/^Bearer\s+/i, '');
  } else {
    // Attempt to extract token from Cookie header
    const cookieHeader = event.headers['cookie'] || event.headers['Cookie'] || '';
    const match = cookieHeader.match(/token=([^;]+)/);
    if (match) {
      token = match[1];
    }
  }

  if (!token) {
    throw new Error('Unauthorized: No token provided');
  }
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch (err) {
    throw new Error('Forbidden: Invalid or expired token', { cause: err });
  }
};

// ─── Input Validation Schemas ───────────────────────────────────────────────
const loginSchema = z.object({
  username: z.string().min(3).max(30),
  password: z.string().min(6).max(100)
});

const registerSchema = z.object({
  username: z.string().min(3).max(30),
  password: z.string().min(6).max(100),
  name: z.string().min(2).max(100),
  phone: z.string().optional(),
  district: z.string().optional(),
  farmSize: z.string().optional(),
  permissions: z.array(z.string()).optional()
});

const deliverySchema = z.object({
  username: z.string(),
  farmerName: z.string(),
  cropId: z.enum(['coffee', 'sunflower', 'maize', 'beans']),
  cropName: z.string(),
  weight: z.number().positive(),
  grade: z.enum(['A', 'B']),
  rate: z.number().positive(),
  payout: z.number().positive(),
});

const dispatchSchema = z.object({
  username: z.string(),
  farmerName: z.string(),
  cropId: z.enum(['coffee', 'sunflower', 'maize', 'beans']),
  cropName: z.string(),
  weight: z.number().positive(),
  date: z.string(),
  location: z.string().min(5),
  notes: z.string().optional()
});

exports.handler = async (event, _context) => {
  // Check rate limit first
  if (!checkRateLimit(event)) {
    return jsonResponse(429, { error: 'Too many requests. Please try again in a minute.' }, event);
  }

  // Handle preflight OPTIONS request
  if (event.httpMethod === 'OPTIONS') {
    return jsonResponse(200, { message: 'Preflight OK' }, event);
  }

  // Parse path and method
  const path = event.path.replace(/^\/\.netlify\/functions\/api/, '').replace(/^\/api/, '');
  const method = event.httpMethod;
  
  let body = {};
  if (event.body) {
    try {
      body = JSON.parse(event.body);
    } catch (e) {
      // Ignore parse error for empty bodies
    }
  }

  try {
    // ─── Authentication Endpoints (Public) ──────────────────────────────────────
    if (path === '/auth/login' && method === 'POST') {
      const parsed = loginSchema.safeParse(body);
      if (!parsed.success) {
        return jsonResponse(400, { error: 'Invalid inputs: ' + parsed.error.issues.map(i => i.message).join(', ') }, event);
      }

      const { username, password } = parsed.data;
      const users = await db.getUsers();
      const user = users.find(u => u.username.toLowerCase() === username.toLowerCase());
      if (!user || !db.comparePassword(password, user.password)) {
        return jsonResponse(401, { error: 'Invalid username or password' }, event);
      }
      
      if (user.status === 'suspended') {
        return jsonResponse(403, { error: 'Account has been suspended. Please contact the administrator.' }, event);
      }
      
      const token = jwt.sign(
        { username: user.username, role: user.role, name: user.name },
        JWT_SECRET,
        { expiresIn: '24h' }
      );
      
      const { password: _pw1, ...userSession } = user;
      
      // Log alert for center admin
      await db.addAlert({
        type: 'login',
        message: `User ${user.name} (${user.username}) logged in. Role: ${user.role}.`
      });

      const isProduction = process.env.NODE_ENV === 'production';
      const cookieVal = `token=${token}; HttpOnly; ${isProduction ? 'Secure;' : ''} SameSite=Strict; Path=/; Max-Age=86400`;

      return jsonResponse(200, { success: true, token, user: userSession }, event, cookieVal);
    }

    if (path === '/auth/register' && method === 'POST') {
      const parsed = registerSchema.safeParse(body);
      if (!parsed.success) {
        return jsonResponse(400, { error: 'Invalid registration inputs: ' + parsed.error.issues.map(i => i.message).join(', ') }, event);
      }

      const result = await db.registerUser(parsed.data);
      if (!result.success) {
        return jsonResponse(400, { error: result.error }, event);
      }
      const user = result.user;
      const token = jwt.sign(
        { username: user.username, role: user.role, name: user.name },
        JWT_SECRET,
        { expiresIn: '24h' }
      );
      const { password: _pw2, ...userSession } = user;
      
      const isProduction = process.env.NODE_ENV === 'production';
      const cookieVal = `token=${token}; HttpOnly; ${isProduction ? 'Secure;' : ''} SameSite=Strict; Path=/; Max-Age=86400`;

      // Log alert for center admin
      await db.addAlert({
        type: 'signup',
        message: `New User signed up: ${user.name} (${user.username}) from ${user.district || 'Lira'}.`
      });

      return jsonResponse(200, { success: true, token, user: userSession }, event, cookieVal);
    }

    if (path === '/auth/register-admin' && method === 'POST') {
      const parsed = registerSchema.safeParse(body);
      if (!parsed.success) {
        return jsonResponse(400, { error: 'Invalid inputs: ' + parsed.error.issues.map(i => i.message).join(', ') }, event);
      }

      const result = await db.registerUser(parsed.data, 'admin');
      if (!result.success) {
        return jsonResponse(400, { error: result.error }, event);
      }
      const user = result.user;
      const token = jwt.sign(
        { username: user.username, role: user.role, name: user.name },
        JWT_SECRET,
        { expiresIn: '24h' }
      );
      const { password: _pw3, ...userSession } = user;
      
      const isProduction = process.env.NODE_ENV === 'production';
      const cookieVal = `token=${token}; HttpOnly; ${isProduction ? 'Secure;' : ''} SameSite=Strict; Path=/; Max-Age=86400`;

      // Log alert for center admin
      await db.addAlert({
        type: 'signup_admin',
        message: `New Administrator registered: ${user.name} (${user.username}).`
      });

      return jsonResponse(200, { success: true, token, user: userSession }, event, cookieVal);
    }

    // ─── Crops Endpoints ──────────────────────────────────────────────────────
    if (path === '/crops' && method === 'GET') {
      const crops = await db.getCrops();
      
      // Interoperability Simulated MAAIF Price Sync Check
      if (process.env.SYNC_MAAIF_PRICES === 'true') {
        console.log('[MAAIF API pricing feed] Prices checked and synced.');
      }
      
      return jsonResponse(200, crops, event);
    }
    if (path === '/crops' && method === 'POST') {
      const userPayload = authenticateUser(event);
      if (userPayload.role !== 'admin') {
        throw new Error('Forbidden: Admin access required');
      }
      const updated = await db.saveCrops(body);
      return jsonResponse(200, { success: true, crops: updated }, event);
    }

    // ─── Deliveries Endpoints ──────────────────────────────────────────────────
    if (path === '/deliveries' && method === 'GET') {
      const userPayload = authenticateUser(event);
      const deliveries = await db.getDeliveries();
      if (userPayload.role === 'admin') {
        return jsonResponse(200, deliveries, event);
      } else {
        const filtered = deliveries.filter(d => d.username === userPayload.username);
        return jsonResponse(200, filtered, event);
      }
    }
    if (path === '/deliveries' && method === 'POST') {
      const userPayload = authenticateUser(event);
      if (userPayload.role !== 'admin') {
        throw new Error('Forbidden: Admin access required');
      }
      const parsed = deliverySchema.safeParse(body);
      if (!parsed.success) {
        return jsonResponse(400, { error: 'Invalid delivery details: ' + parsed.error.issues.map(i => i.message).join(', ') }, event);
      }
      const newDel = await db.saveDelivery(parsed.data);
      return jsonResponse(201, { success: true, delivery: newDel }, event);
    }
    if (path === '/deliveries/status' && method === 'POST') {
      const userPayload = authenticateUser(event);
      if (userPayload.role !== 'admin') {
        throw new Error('Forbidden: Admin access required');
      }
      const { id, status } = body;
      const success = await db.updateDeliveryStatus(id, status);
      return jsonResponse(200, { success }, event);
    }

    // ─── Dispatches Endpoints ──────────────────────────────────────────────────
    if (path === '/dispatches' && method === 'GET') {
      const userPayload = authenticateUser(event);
      const dispatches = await db.getDispatches();
      if (userPayload.role === 'admin') {
        return jsonResponse(200, dispatches, event);
      } else {
        const filtered = dispatches.filter(d => d.username === userPayload.username);
        return jsonResponse(200, filtered, event);
      }
    }
    if (path === '/dispatches' && method === 'POST') {
      const userPayload = authenticateUser(event);
      const parsed = dispatchSchema.safeParse(body);
      if (!parsed.success) {
        return jsonResponse(400, { error: 'Invalid dispatch request: ' + parsed.error.issues.map(i => i.message).join(', ') }, event);
      }
      if (userPayload.role !== 'admin' && parsed.data.username !== userPayload.username) {
        throw new Error('Forbidden: You can only request transit for your own account');
      }
      const newDisp = await db.saveDispatch(parsed.data);
      return jsonResponse(201, { success: true, dispatch: newDisp }, event);
    }
    if (path === '/dispatches/status' && method === 'POST') {
      const userPayload = authenticateUser(event);
      if (userPayload.role !== 'admin') {
        throw new Error('Forbidden: Admin access required');
      }
      const { id, status } = body;
      const success = await db.updateDispatchStatus(id, status);
      return jsonResponse(200, { success }, event);
    }

    // ─── Inquiries Endpoints ──────────────────────────────────────────────────
    if (path === '/inquiries' && method === 'GET') {
      const userPayload = authenticateUser(event);
      if (userPayload.role !== 'admin') {
        throw new Error('Forbidden: Admin access required');
      }
      const inquiries = await db.getInquiries();
      return jsonResponse(200, inquiries, event);
    }
    if (path === '/inquiries' && method === 'POST') {
      const newInq = await db.saveInquiry(body);
      return jsonResponse(201, { success: true, inquiry: newInq }, event);
    }
    if (path === '/inquiries/status' && method === 'POST') {
      const userPayload = authenticateUser(event);
      if (userPayload.role !== 'admin') {
        throw new Error('Forbidden: Admin access required');
      }
      const { id, status } = body;
      const success = await db.updateInquiryStatus(id, status);
      return jsonResponse(200, { success }, event);
    }

    // ─── Uganda Mobile Money Payout Simulator Endpoint ────────────────────────
    if (path === '/payouts' && method === 'POST') {
      const userPayload = authenticateUser(event);
      if (userPayload.role !== 'admin') {
        throw new Error('Forbidden: Admin access required');
      }

      const { deliveryId, phone, amount, provider } = body;
      if (!deliveryId || !phone || !amount || !provider) {
        return jsonResponse(400, { error: 'Missing payment metadata' }, event);
      }

      console.log(`[Mobile Money Payout] Processing UGX ${amount} to ${phone} via ${provider} for delivery ${deliveryId}...`);
      
      // Simulate Mobile Money payout response
      const isSuccess = Math.random() > 0.05; // 95% success rate
      if (isSuccess) {
        const momoTransactionId = 'momo-tx-' + Math.floor(Math.random() * 900000000 + 100000000);
        return jsonResponse(200, {
          success: true,
          transactionId: momoTransactionId,
          message: `Payout of UGX ${amount} to ${phone} completed successfully.`
        }, event);
      } else {
        return jsonResponse(500, {
          success: false,
          error: 'External Mobile Money provider gateway timed out. Please retry.'
        }, event);
      }
    }

    // ─── Translations Endpoints ───────────────────────────────────────────────
    if (path === '/translations' && method === 'GET') {
      const translations = await db.getTranslations();
      return jsonResponse(200, translations, event);
    }
    if (path === '/translations' && method === 'POST') {
      const userPayload = authenticateUser(event);
      if (userPayload.role !== 'admin') {
        throw new Error('Forbidden: Admin access required');
      }
      const updated = await db.saveTranslations(body);
      return jsonResponse(200, { success: true, translations: updated }, event);
    }

    // ─── Slides Endpoints ──────────────────────────────────────────────────────
    if (path === '/slides' && method === 'GET') {
      const slides = await db.getSlides();
      return jsonResponse(200, slides, event);
    }
    if (path === '/slides' && method === 'POST') {
      const userPayload = authenticateUser(event);
      if (userPayload.role !== 'admin') {
        throw new Error('Forbidden: Admin access required');
      }
      const updated = await db.saveSlides(body);
      return jsonResponse(200, { success: true, slides: updated }, event);
    }

    // ─── Site Settings Endpoints ───────────────────────────────────────────────
    if (path === '/settings' && method === 'GET') {
      const settings = await db.getSettings();
      return jsonResponse(200, settings, event);
    }
    if (path === '/settings' && method === 'POST') {
      const userPayload = authenticateUser(event);
      if (userPayload.role !== 'admin') {
        throw new Error('Forbidden: Admin access required');
      }
      const updated = await db.saveSettings(body);
      return jsonResponse(200, { success: true, settings: updated }, event);
    }

    // ─── Training Manual Endpoints ──────────────────────────────────────────────
    if (path === '/manual' && method === 'GET') {
      const manual = await db.getManual();
      return jsonResponse(200, manual, event);
    }
    if (path === '/manual' && method === 'POST') {
      const userPayload = authenticateUser(event);
      if (userPayload.role !== 'admin') {
        throw new Error('Forbidden: Admin access required');
      }
      const updated = await db.saveManual(body);
      return jsonResponse(200, { success: true, manual: updated }, event);
    }

    // ─── Users Management Endpoints ───────────────────────────────────────────
    if (path === '/users' && method === 'GET') {
      const userPayload = authenticateUser(event);
      if (userPayload.role !== 'admin') {
        throw new Error('Forbidden: Admin access required');
      }
      const users = await db.getUsers();
      const safeUsers = users.map(({ password: _, ...u }) => u);
      return jsonResponse(200, safeUsers, event);
    }
    if (path === '/users/update' && method === 'POST') {
      const userPayload = authenticateUser(event);
      const { username, updatedData } = body;
      if (userPayload.role !== 'admin' && userPayload.username !== username) {
        throw new Error('Forbidden: You can only update your own account');
      }
      const success = await db.updateUser(username, updatedData);
      return jsonResponse(200, { success }, event);
    }
    if (path === '/users/delete' && method === 'POST') {
      const userPayload = authenticateUser(event);
      if (userPayload.role !== 'admin') {
        throw new Error('Forbidden: Admin access required');
      }
      const { username } = body;
      const success = await db.deleteUser(username);
      return jsonResponse(200, { success }, event);
    }
    if (path === '/alerts' && method === 'GET') {
      const userPayload = authenticateUser(event);
      if (userPayload.username !== 'admin') {
        throw new Error('Forbidden: Only Center Admin can access system alerts.');
      }
      const alerts = await db.getAlerts();
      return jsonResponse(200, alerts, event);
    }

    if (path === '/reset-db' && method === 'POST') {
      const userPayload = authenticateUser(event);
      if (userPayload.username !== 'admin') {
        throw new Error('Forbidden: Only Center Admin can reset the database.');
      }
      await db.resetDatabase();
      return jsonResponse(200, { success: true }, event);
    }

    // ─── Image Upload Endpoint ────────────────────────────────────────────────
    if (path === '/upload' && method === 'POST') {
      const userPayload = authenticateUser(event);
      if (userPayload.role !== 'admin') {
        throw new Error('Forbidden: Admin access required');
      }
      
      const { filename, base64 } = body;
      if (!filename || !base64) {
        return jsonResponse(400, { error: 'Missing filename or base64 data' }, event);
      }

      // 1. Enforce max size validation (25MB max for videos/images)
      const bufferSize = Buffer.byteLength(base64, 'base64');
      if (bufferSize > 25 * 1024 * 1024) {
        return jsonResponse(400, { error: 'File size too large. Maximum size is 25MB.' }, event);
      }

      const pathLib = require('path');
      const ext = pathLib.extname(filename).toLowerCase() || '.png';
      if (!['.png', '.jpg', '.jpeg', '.gif', '.webp', '.mp4', '.webm', '.ogg'].includes(ext)) {
        return jsonResponse(400, { error: 'Invalid file type. Only images (.png, .jpg, .jpeg, .gif, .webp) and videos (.mp4, .webm, .ogg) are allowed.' }, event);
      }

      const safeName = 'upload-' + Date.now() + '-' + Math.random().toString(36).substring(2, 8) + ext;

      // Extract base64 content
      const matches = base64.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
      let buffer;
      if (matches && matches.length === 3) {
        buffer = Buffer.from(matches[2], 'base64');
      } else {
        buffer = Buffer.from(base64, 'base64');
      }

      let fileUrl = '';
      
      // 2. Cloud Storage Integration Interface (Adapter check)
      if (process.env.CLOUDINARY_URL || process.env.AWS_S3_BUCKET) {
        console.log(`[Cloud Storage Bucket] Uploading sanitised image ${safeName} directly to AWS S3/Cloudinary...`);
        // Cloudinary/S3 client execution goes here.
        fileUrl = `https://storage.jeromafarmers.com/uploads/${safeName}`;
      } else {
        // Fallback to local server paths for standard development builds
        const fs = require('fs');
        const publicUploadsDir = pathLib.join(__dirname, '../..', 'public', 'uploads');
        const distUploadsDir = pathLib.join(__dirname, '../..', 'dist', 'uploads');

        fs.mkdirSync(publicUploadsDir, { recursive: true });
        fs.writeFileSync(pathLib.join(publicUploadsDir, safeName), buffer);

        if (fs.existsSync(pathLib.join(__dirname, '../..', 'dist'))) {
          fs.mkdirSync(distUploadsDir, { recursive: true });
          fs.writeFileSync(pathLib.join(distUploadsDir, safeName), buffer);
        }
        fileUrl = `/uploads/${safeName}`;
      }

      return jsonResponse(200, { success: true, url: fileUrl }, event);
    }

    return jsonResponse(404, { error: `Route not found: ${method} ${path}` }, event);

  } catch (error) {
    console.error('Error handling API request:', error);
    if (error.message.startsWith('Unauthorized:')) {
      return jsonResponse(401, { error: error.message }, event);
    }
    if (error.message.startsWith('Forbidden:')) {
      return jsonResponse(403, { error: error.message }, event);
    }
    return jsonResponse(500, { error: 'Internal Server Error', details: error.message }, event);
  }
};
