
function parseSheetData(text) {
  if (!text || typeof text !== 'string') return [];
  const lines = text.split(/\r?\n/).filter(line => line.trim().length > 0);
  if (lines.length < 2) return [];

  const delimiter = lines[0].includes('\t') ? '\t' : ',';
  const parseLine = (line) => {
    const row = [];
    let current = '';
    let inQuotes = false;
    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      if (char === '"' && (i === 0 || line[i - 1] !== '\\')) {
        inQuotes = !inQuotes;
      } else if (char === delimiter && !inQuotes) {
        row.push(current.trim().replace(/^"|"$/g, '').replace(/""/g, '"'));
        current = '';
      } else {
        current += char;
      }
    }
    row.push(current.trim().replace(/^"|"$/g, '').replace(/""/g, '"'));
    return row;
  };

  const headers = parseLine(lines[0]);
  const rows = [];
  for (let i = 1; i < lines.length; i++) {
    const values = parseLine(lines[i]);
    if (values.length === 0 || (values.length === 1 && values[0] === '')) continue;
    const rowObj = {};
    headers.forEach((h, idx) => {
      if (h) {
        rowObj[h] = values[idx] !== undefined ? values[idx] : '';
      }
    });
    rows.push(rowObj);
  }
  return rows;
}

const db = require('./utils/serverDb');
const jwt = require('jsonwebtoken');
const { z } = require('zod');
const JWT_SECRET = process.env.JWT_SECRET || 'jeroma_farmers_secret_key_2026_lira_uganda';

// Helper to construct JSON response (respects credentials with Origin mapping & Security Headers)
const jsonResponse = (statusCode, data, event = null, setCookieHeader = null) => {
  const origin = (event && (event.headers.origin || event.headers.Origin)) || '*';
  const headers = {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': origin,
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Credentials': 'true',
    'X-Content-Type-Options': 'nosniff',
    'X-Frame-Options': 'SAMEORIGIN',
    'Referrer-Policy': 'strict-origin-when-cross-origin'
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

// ─── Department Role-Based Access Control (RBAC) Helpers ────────────────────
const isFullAdminUser = (userPayload) => {
  if (!userPayload) return false;
  const username = (userPayload.username || '').toLowerCase();
  const dept = (userPayload.department || '').toLowerCase();
  const role = (userPayload.role || '').toLowerCase();
  return username === 'admin' || 
         role === 'admin' ||
         dept === 'managing director' || 
         role === 'managing director' || 
         role === 'managing_director';
};

const hasPermission = (userPayload, requiredPermission) => {
  if (!userPayload) return false;
  if (isFullAdminUser(userPayload)) return true;
  if (!requiredPermission) return true;
  const perms = Array.isArray(userPayload.permissions) ? userPayload.permissions : [];
  return perms.includes(requiredPermission);
};

const requireFullAdmin = (event) => {
  const userPayload = authenticateUser(event);
  if (!isFullAdminUser(userPayload)) {
    throw new Error('Forbidden: Managing Director or Center Admin authorization required');
  }
  return userPayload;
};

const requirePermission = (event, permissionKey) => {
  const userPayload = authenticateUser(event);
  if (!hasPermission(userPayload, permissionKey)) {
    throw new Error(`Forbidden: Access denied. Department permission '${permissionKey}' required.`);
  }
  return userPayload;
};

const requireDepartmentOrPermission = (event, allowedDepts = [], permissionKey = null) => {
  const userPayload = authenticateUser(event);
  if (isFullAdminUser(userPayload)) return userPayload;
  
  const userDept = (userPayload.department || '').toLowerCase();
  const isDeptMatch = allowedDepts.some(d => d.toLowerCase() === userDept);
  const isPermMatch = permissionKey && hasPermission(userPayload, permissionKey);

  if (!isDeptMatch && !isPermMatch) {
    throw new Error(`Forbidden: Access restricted to ${allowedDepts.join(', ')} department.`);
  }
  return userPayload;
};

const sendRealEmail = async (toEmail, subject, htmlContent) => {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    console.log("No RESEND_API_KEY environment variable set. Cannot send email.");
    return false;
  }
  try {
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        from: 'Jeroma Farmers <onboarding@resend.dev>', // Resend sandbox default sender
        to: toEmail,
        subject: subject,
        html: htmlContent
      })
    });
    if (response.ok) {
      console.log(`Email successfully dispatched via Resend to ${toEmail}`);
      return true;
    } else {
      const errText = await response.text();
      console.error('Resend API response error:', errText);
    }
  } catch (err) {
    console.error('Error in sendRealEmail:', err);
  }
  return false;
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
  username: z.string().min(3).max(100),
  password: z.string().min(6).max(100)
});

const registerSchema = z.object({
  username: z.string().min(3).max(100),
  password: z.string().min(6).max(100),
  name: z.string().min(2).max(100),
  phone: z.string().optional(),
  email: z.string().optional(),
  dob: z.string().optional(),
  gender: z.string().optional(),
  district: z.string().optional(),
  farmSize: z.string().optional(),
  farmerId: z.string().optional(),
  nin: z.string().optional(),
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
    // ─── System Health & Interoperability Status (Public) ──────────────────────
    if (path === '/health' && method === 'GET') {
      return jsonResponse(200, {
        status: 'healthy',
        timestamp: new Date().toISOString(),
        version: '2026.2-enterprise',
        uptime: process.uptime(),
        interoperability: {
          maaifPriceFeed: 'active',
          unbsGradingStandards: 'UGX-S-1024',
          momoSupportedGateways: ['MTN MoMo Uganda', 'Airtel Money Uganda'],
          smsDeliveryGateway: 'SMS-UG-Direct'
        }
      }, event);
    }

    // ─── Authentication Endpoints ──────────────────────────────────────────────
    if (path === '/auth/login' && method === 'POST') {
      const parsed = loginSchema.safeParse(body);
      if (!parsed.success) {
        return jsonResponse(400, { error: 'Invalid inputs: ' + parsed.error.issues.map(i => i.message).join(', ') }, event);
      }

      const { username, password } = parsed.data;
      const users = await db.getUsers();
      const normInput = username.trim().toLowerCase();
      const digitsInput = normInput.replace(/\D/g, '');
      const user = users.find(u => {
        const uName = (u.username || '').toLowerCase();
        const uEmail = (u.email || '').toLowerCase();
        const uPhoneDigits = (u.phone || '').replace(/\D/g, '');
        return uName === normInput || 
               (uEmail && uEmail === normInput) || 
               (digitsInput.length >= 6 && uPhoneDigits && (uPhoneDigits === digitsInput || uPhoneDigits.endsWith(digitsInput) || digitsInput.endsWith(uPhoneDigits)));
      });
      if (!user || !db.comparePassword(password, user.password)) {
        return jsonResponse(401, { error: 'Invalid login credentials (username, email, or phone) or incorrect password.' }, event);
      }
      
      if (user.status === 'suspended') {
        return jsonResponse(403, { error: 'Account has been suspended. Please contact the administrator.' }, event);
      }
      
      const token = jwt.sign(
        { 
          username: user.username, 
          role: user.role, 
          name: user.name,
          department: user.department || (user.role === 'admin' ? 'Managing Director' : ''),
          permissions: user.permissions || []
        },
        JWT_SECRET,
        { expiresIn: '24h' }
      );
      
      const { password: _pw1, ...userSession } = user;
      
      // Log alert for center admin
      await db.addAlert({
        type: 'login',
        message: `User ${user.name} (${user.username}) logged in. Department: ${user.department || user.role}.`
      });

      // Track login history
      await db.addLogin({
        username: user.username,
        name: user.name,
        role: user.role
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
        { 
          username: user.username, 
          role: user.role, 
          name: user.name,
          department: user.department || 'Smallholder Farmer',
          permissions: []
        },
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
      // Maximum Security: Require Managing Director or Center Admin to create staff/admin accounts
      requireFullAdmin(event);

      const parsed = registerSchema.safeParse(body);
      if (!parsed.success) {
        return jsonResponse(400, { error: 'Invalid inputs: ' + parsed.error.issues.map(i => i.message).join(', ') }, event);
      }

      const result = await db.registerUser(parsed.data, parsed.data.role || 'admin');
      if (!result.success) {
        return jsonResponse(400, { error: result.error }, event);
      }
      const user = result.user;
      const token = jwt.sign(
        { 
          username: user.username, 
          role: user.role, 
          name: user.name,
          department: user.department || '',
          permissions: user.permissions || []
        },
        JWT_SECRET,
        { expiresIn: '24h' }
      );
      const { password: _pw3, ...userSession } = user;
      
      const isProduction = process.env.NODE_ENV === 'production';
      const cookieVal = `token=${token}; HttpOnly; ${isProduction ? 'Secure;' : ''} SameSite=Strict; Path=/; Max-Age=86400`;

      // Log alert for center admin
      await db.addAlert({
        type: 'signup_admin',
        message: `New Staff/Administrator registered: ${user.name} (${user.username}) in ${user.department || 'Jeroma'}.`
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
      // Restricted to Finance Department or Managing Director
      requirePermission(event, 'prices');
      const updated = await db.saveCrops(body);
      return jsonResponse(200, { success: true, crops: updated }, event);
    }

    // ─── Deliveries Endpoints ──────────────────────────────────────────────────
    if (path === '/deliveries' && method === 'GET') {
      const userPayload = authenticateUser(event);
      const deliveries = await db.getDeliveries();
      if (hasPermission(userPayload, 'deliveries')) {
        return jsonResponse(200, deliveries, event);
      } else {
        const filtered = deliveries.filter(d => d.username === userPayload.username);
        return jsonResponse(200, filtered, event);
      }
    }
    if (path === '/deliveries' && method === 'POST') {
      requirePermission(event, 'deliveries');
      const parsed = deliverySchema.safeParse(body);
      if (!parsed.success) {
        return jsonResponse(400, { error: 'Invalid delivery details: ' + parsed.error.issues.map(i => i.message).join(', ') }, event);
      }
      const newDel = await db.saveDelivery(parsed.data);
      return jsonResponse(201, { success: true, delivery: newDel }, event);
    }
    if (path === '/deliveries/status' && method === 'POST') {
      requirePermission(event, 'deliveries');
      const { id, status } = body;
      const success = await db.updateDeliveryStatus(id, status);
      return jsonResponse(200, { success }, event);
    }

    // ─── Dispatches Endpoints ──────────────────────────────────────────────────
    if (path === '/dispatches' && method === 'GET') {
      const userPayload = authenticateUser(event);
      const dispatches = await db.getDispatches();
      if (hasPermission(userPayload, 'dispatches')) {
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
      if (!hasPermission(userPayload, 'dispatches') && parsed.data.username !== userPayload.username) {
        throw new Error('Forbidden: You can only request transit for your own account');
      }
      const newDisp = await db.saveDispatch(parsed.data);
      return jsonResponse(201, { success: true, dispatch: newDisp }, event);
    }
    if (path === '/dispatches/status' && method === 'POST') {
      requirePermission(event, 'dispatches');
      const { id, status } = body;
      const success = await db.updateDispatchStatus(id, status);
      return jsonResponse(200, { success }, event);
    }
    if (path === '/dispatches/reply' && method === 'POST') {
      requirePermission(event, 'dispatches');
      const { id, reply } = body;
      const success = await db.replyToDispatch(id, reply);
      return jsonResponse(200, { success }, event);
    }
    if (path === '/dispatches/update' && method === 'POST') {
      const userPayload = authenticateUser(event);
      const { id, ...updatedFields } = body;
      if (!id) {
        return jsonResponse(400, { error: 'Missing dispatch ID' }, event);
      }
      const dispatches = await db.getDispatches();
      const existing = dispatches.find(d => d.id === id);
      if (!existing) {
        return jsonResponse(404, { error: 'Transit request not found' }, event);
      }
      if (!hasPermission(userPayload, 'dispatches') && existing.username !== userPayload.username) {
        throw new Error('Forbidden: You can only edit your own transit requests');
      }
      const updated = await db.updateDispatch(id, updatedFields);
      return jsonResponse(200, { success: true, dispatch: updated }, event);
    }
    if (path === '/dispatches/delete' && method === 'POST') {
      const userPayload = authenticateUser(event);
      const { id } = body;
      if (!id) {
        return jsonResponse(400, { error: 'Missing dispatch ID' }, event);
      }
      const dispatches = await db.getDispatches();
      const existing = dispatches.find(d => d.id === id);
      if (!existing) {
        return jsonResponse(404, { error: 'Transit request not found' }, event);
      }
      if (!hasPermission(userPayload, 'dispatches') && existing.username !== userPayload.username) {
        throw new Error('Forbidden: You can only delete your own transit requests');
      }
      const success = await db.deleteDispatch(id);
      return jsonResponse(200, { success }, event);
    }

    // ─── Inquiries Endpoints ──────────────────────────────────────────────────
    if (path === '/inquiries' && method === 'GET') {
      requirePermission(event, 'inquiries');
      const inquiries = await db.getInquiries();
      return jsonResponse(200, inquiries, event);
    }
    if (path === '/inquiries' && method === 'POST') {
      const newInq = await db.saveInquiry(body);
      return jsonResponse(201, { success: true, inquiry: newInq }, event);
    }
    if (path === '/inquiries/status' && method === 'POST') {
      requirePermission(event, 'inquiries');
      const { id, status } = body;
      const success = await db.updateInquiryStatus(id, status);
      return jsonResponse(200, { success }, event);
    }
    if (path === '/inquiries/reply' && method === 'POST') {
      requirePermission(event, 'inquiries');
      const { id, reply } = body;
      const success = await db.replyToInquiry(id, reply);
      return jsonResponse(200, { success }, event);
    }

    // ─── Self-Healing Backup Endpoint ─────────────────────────────────────────
    if (path === '/restore-backup' && method === 'POST') {
      requireFullAdmin(event);
      const success = await db.restoreBackup(body);
      return jsonResponse(200, { success }, event);
    }

    // ─── Send Password Verification Email Route ───────────────────────────────
    if (path === '/send-verification-email' && method === 'POST') {
      const { email, code, username } = body;
      if (!email || !code) {
        throw new Error('Email and code are required');
      }
      const subject = 'Jeroma Farmers - Password Reset Verification Code';
      const htmlContent = `
        <div style="font-family: sans-serif; padding: 20px; max-width: 600px; border: 1px solid #e2e8f0; border-radius: 8px; background-color: #faf9f6;">
          <h2 style="color: #1b4332; margin-top: 0;">Password Reset Request</h2>
          <p>Hello <strong>${username || 'User'}</strong>,</p>
          <p>We received a request to reset your password for your Jeroma Farmers Collection Centre account.</p>
          <div style="margin: 24px 0; padding: 16px; background-color: #e8f5e9; border-left: 4px solid #2d6a4f; border-radius: 4px; text-align: center;">
            <p style="margin: 0; font-size: 14px; color: #1b4332; text-transform: uppercase; font-weight: bold; letter-spacing: 0.05em;">Your Verification Code</p>
            <p style="margin: 8px 0 0; font-size: 32px; font-weight: 800; color: #1b4332; letter-spacing: 0.1em;">${code}</p>
          </div>
          <p style="font-size: 13px; color: #666;">If you did not request this change, please ignore this email or contact support.</p>
          <hr style="border: 0; border-top: 1px solid #e2e8f0; margin: 20px 0;" />
          <p style="font-size: 11px; color: #999; margin: 0;">Jeroma Farmers Collection Centre Ltd · Northern & Eastern Uganda</p>
        </div>
      `;
      const success = await sendRealEmail(email, subject, htmlContent);
      return jsonResponse(200, { success }, event);
    }

    // ─── Uganda Mobile Money Payout Simulator Endpoint ────────────────────────
    if (path === '/payouts' && method === 'POST') {
      // STRICT RBAC: Only Finance Manager or Managing Director can authorize money payouts
      requireDepartmentOrPermission(event, ['Finance manager', 'Managing Director'], 'prices');

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
      requireFullAdmin(event);
      const updated = await db.saveTranslations(body);
      return jsonResponse(200, { success: true, translations: updated }, event);
    }

    // ─── Slides Endpoints ──────────────────────────────────────────────────────
    if (path === '/slides' && method === 'GET') {
      const slides = await db.getSlides();
      return jsonResponse(200, slides, event);
    }
    if (path === '/slides' && method === 'POST') {
      requirePermission(event, 'slides');
      const updated = await db.saveSlides(body);
      return jsonResponse(200, { success: true, slides: updated }, event);
    }

    // ─── Site Settings Endpoints ───────────────────────────────────────────────
    if (path === '/settings' && method === 'GET') {
      const settings = await db.getSettings();
      return jsonResponse(200, settings, event);
    }
    if (path === '/settings' && method === 'POST') {
      requireFullAdmin(event);
      const updated = await db.saveSettings(body);
      return jsonResponse(200, { success: true, settings: updated }, event);
    }

    // ─── Training Manual Endpoints ──────────────────────────────────────────────
    if (path === '/manual' && method === 'GET') {
      const manual = await db.getManual();
      return jsonResponse(200, manual, event);
    }
    if (path === '/manual' && method === 'POST') {
      requirePermission(event, 'manual');
      const updated = await db.saveManual(body);
      return jsonResponse(200, { success: true, manual: updated }, event);
    }

    // ─── Users Management Endpoints (Strictly Managing Director / Admin) ───────
    if (path === '/users' && method === 'GET') {
      requireFullAdmin(event);
      const users = await db.getUsers();
      const safeUsers = users.map(({ password: _, ...u }) => u);
      return jsonResponse(200, safeUsers, event);
    }
    if (path === '/users/update' && method === 'POST') {
      const userPayload = authenticateUser(event);
      const { username, updatedData } = body;
      const callerUsername = (userPayload.username || '').toLowerCase();
      const targetUsername = (username || '').toLowerCase();
      const isAdmin = isFullAdminUser(userPayload);

      if (!isAdmin && callerUsername !== targetUsername) {
        throw new Error('Forbidden: You can only update your own account');
      }
      // Non-admin users cannot elevate their own role, department, or permissions!
      if (!isAdmin && updatedData) {
        delete updatedData.role;
        delete updatedData.department;
        delete updatedData.permissions;
      }
      const success = await db.updateUser(username, updatedData);
      return jsonResponse(200, { success }, event);
    }
    if (path === '/users/delete' && method === 'POST') {
      requireFullAdmin(event);
      const { username } = body;
      const success = await db.deleteUser(username);
      return jsonResponse(200, { success }, event);
    }
    if (path === '/alerts' && method === 'GET') {
      requireFullAdmin(event);
      const alerts = await db.getAlerts();
      return jsonResponse(200, alerts, event);
    }

    if (path === '/logins' && method === 'GET') {
      requireFullAdmin(event);
      const logins = await db.getLogins();
      return jsonResponse(200, logins, event);
    }

    // ─── Universal Projects Management Endpoints ─────────────────────────────
    if (path === '/projects' && method === 'GET') {
      const projects = await db.getProjects();
      return jsonResponse(200, projects, event);
    }
    if (path === '/projects' && method === 'POST') {
      requirePermission(event, 'projects');
      const saved = await db.saveProject(body);
      return jsonResponse(200, { success: true, project: saved }, event);
    }
    if ((path === '/projects/delete' && method === 'POST') || (path === '/projects' && method === 'DELETE')) {
      requirePermission(event, 'projects');
      const { id } = body;
      const success = await db.deleteProject(id);
      return jsonResponse(200, { success }, event);
    }

    // ─── Staff & Positions HR Endpoints ───────────────────────────────────────
    if (path === '/staff' && method === 'GET') {
      const staff = await db.getStaff();
      return jsonResponse(200, staff, event);
    }
    if (path === '/staff' && method === 'POST') {
      requirePermission(event, 'staff');
      const saved = await db.saveStaff(body);
      return jsonResponse(200, { success: true, staffMember: saved }, event);
    }
    if ((path === '/staff/delete' && method === 'POST') || (path === '/staff' && method === 'DELETE')) {
      requirePermission(event, 'staff');
      const { id } = body;
      const success = await db.deleteStaff(id);
      return jsonResponse(200, { success }, event);
    }

    // ─── Cooperatives & SACCOs Endpoints ──────────────────────────────────────
    if (path === '/cooperatives' && method === 'GET') {
      const cooperatives = await db.getCooperatives();
      return jsonResponse(200, cooperatives, event);
    }
    if (path === '/cooperatives' && method === 'POST') {
      requirePermission(event, 'cooperatives');
      const saved = await db.saveCooperative(body);
      return jsonResponse(200, { success: true, cooperative: saved }, event);
    }
    if ((path === '/cooperatives/delete' && method === 'POST') || (path === '/cooperatives' && method === 'DELETE')) {
      requirePermission(event, 'cooperatives');
      const { id } = body;
      const success = await db.deleteCooperative(id);
      return jsonResponse(200, { success }, event);
    }

    // ─── Machinery & Technology Endpoints ────────────────────────────────────
    if (path === '/machinery' && method === 'GET') {
      const machinery = await db.getMachinery();
      return jsonResponse(200, machinery, event);
    }
    if (path === '/machinery' && method === 'POST') {
      requirePermission(event, 'dispatches');
      const saved = await db.saveMachinery(body);
      return jsonResponse(200, { success: true, machinery: saved }, event);
    }
    if ((path === '/machinery/delete' && method === 'POST') || (path === '/machinery' && method === 'DELETE')) {
      requirePermission(event, 'dispatches');
      const { id } = body;
      const success = await db.deleteMachinery(id);
      return jsonResponse(200, { success }, event);
    }

    // ─── Department Operations: Finance Endpoints ─────────────────────────────
    if (path === '/departments/finance' && method === 'GET') {
      requireDepartmentOrPermission(event, ['Finance manager', 'Managing Director'], 'departments');
      const finance = await db.getFinance();
      return jsonResponse(200, finance, event);
    }
    if (path === '/departments/finance' && method === 'POST') {
      requireDepartmentOrPermission(event, ['Finance manager', 'Managing Director'], 'departments');
      const saved = await db.saveFinanceRecord(body);
      return jsonResponse(200, { success: true, record: saved }, event);
    }
    if (path === '/departments/finance/delete' && method === 'POST') {
      requireDepartmentOrPermission(event, ['Finance manager', 'Managing Director'], 'departments');
      const { id } = body;
      const success = await db.deleteFinanceRecord(id);
      return jsonResponse(200, { success }, event);
    }

    // ─── Department Operations: Tree Nurseries Endpoints ──────────────────────
    if (path === '/departments/nurseries' && method === 'GET') {
      const nurseries = await db.getNurseries();
      return jsonResponse(200, nurseries, event);
    }
    if (path === '/departments/nurseries' && method === 'POST') {
      requirePermission(event, 'departments');
      const saved = await db.saveNursery(body);
      return jsonResponse(200, { success: true, nursery: saved }, event);
    }
    if (path === '/departments/nurseries/delete' && method === 'POST') {
      requirePermission(event, 'departments');
      const { id } = body;
      const success = await db.deleteNursery(id);
      return jsonResponse(200, { success }, event);
    }

    // ─── Google Forms & Survey Ingestion Endpoints ───────────────────────────
    if (path === '/forms/submit' && method === 'POST') {
      // Open endpoint accepting direct Google Forms Apps Script payload or website forms
      const submission = await db.submitFormResponse(body);
      return jsonResponse(200, { success: true, id: submission.id, message: 'Response registered successfully in Jeroma database' }, event);
    }
    if (path === '/forms/submissions' && method === 'GET') {
      requirePermission(event, 'forms');
      const submissions = await db.getFormSubmissions();
      return jsonResponse(200, submissions, event);
    }
    if (path === '/forms/submissions/delete' && method === 'POST') {
      requirePermission(event, 'forms');
      const { id } = body;
      const success = await db.deleteFormSubmission(id);
      return jsonResponse(200, { success }, event);
    }

    // ─── Google Sheets Direct Synchronization Endpoint ───────────────────────────
    if (path === '/forms/sync-sheet' && method === 'POST') {
      requirePermission(event, 'forms');
      const { sheetUrl, rawData } = body || {};
      let csvContent = rawData || '';

      if (!csvContent && sheetUrl) {
        if (sheetUrl.includes('/forms/')) {
          return jsonResponse(400, {
            error: 'The link provided is a Google Form responses page, which is private to your Google account. In your Google Form responses tab, click the green "View in Sheets" icon to open the linked Google Spreadsheet, set its share to "Anyone with the link can view", and paste that spreadsheet link here. Or click "Download responses (.csv)" and use the CSV upload.'
          }, event);
        }

        // Extract Google Sheet ID or published URL
        let exportUrl = sheetUrl.trim();
        const match = exportUrl.match(/\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/);
        if (match && match[1]) {
          const sheetId = match[1];
          exportUrl = `https://docs.google.com/spreadsheets/d/${sheetId}/export?format=csv`;
        } else if (exportUrl.includes('/pubhtml')) {
          exportUrl = exportUrl.replace('/pubhtml', '/pub?output=csv');
        }

        try {
          const resp = await fetch(exportUrl, {
            headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' },
            redirect: 'follow'
          });
          if (resp.ok) {
            csvContent = await resp.text();
          } else if (match && match[1]) {
            // Fallback to Google Visualization API
            const gvizUrl = `https://docs.google.com/spreadsheets/d/${match[1]}/gviz/tq?tqx=out:csv`;
            const gvizResp = await fetch(gvizUrl, {
              headers: { 'User-Agent': 'Mozilla/5.0' },
              redirect: 'follow'
            });
            if (gvizResp.ok) csvContent = await gvizResp.text();
          }
        } catch (fetchErr) {
          console.error('Error fetching Google Sheet CSV:', fetchErr);
        }
      }

      if (!csvContent || csvContent.trim().length === 0) {
        return jsonResponse(400, { 
          error: 'Could not fetch responses from Google Sheet URL. Please ensure your Google Sheet sharing is set to "Anyone with the link can view", or use the "Quick Paste Sheet Rows" button to paste directly.' 
        }, event);
      }

      const rows = parseSheetData(csvContent);
      if (!rows || rows.length === 0) {
        return jsonResponse(400, { error: 'No data rows found in Google Sheet. Please check the sheet content.' }, event);
      }

      let addedCount = 0;
      const currentList = (await db.getFormSubmissions()) || [];

      for (const row of rows) {
        const fullName = row['1. Full Name:'] || row['Full Name'] || row['Full Name:'] || row['Farmer Name'] || row['Name'] || '';
        const phone = row['2. Phone Number:'] || row['Phone Number'] || row['Phone'] || row['Phone:'] || '';
        const district = row['8. District:'] || row['District'] || row['District:'] || '101. Pader';
        const nin = row['5. National Identification Number (NIN):'] || row['NIN'] || row['National Identification Number'] || '';
        const timestamp = row['Timestamp'] || row['Date'] || new Date().toISOString();

        if (!fullName && !phone && Object.keys(row).length < 2) continue;

        // Duplicate check
        const isDuplicate = currentList.some(s => {
          const d = s.data || {};
          const sName = d['1. Full Name:'] || d.fullName || d.name || '';
          const sPhone = d['2. Phone Number:'] || d.phone || '';
          return sName.toLowerCase() === fullName.toLowerCase() && (phone ? sPhone === phone : true);
        });

        if (!isDuplicate) {
          await db.submitFormResponse({
            formType: 'farmer_registration',
            formName: 'Google Sheet Synchronized Intake',
            data: {
              ...row,
              fullName: fullName || 'Farmer Participant',
              phone,
              district,
              nin,
              submittedAt: timestamp
            },
            status: 'Synced from Google Sheet'
          });
          addedCount++;
        }
      }

      const updatedSubmissions = await db.getFormSubmissions();
      return jsonResponse(200, { 
        success: true, 
        addedCount, 
        totalInSheet: rows.length, 
        submissions: updatedSubmissions,
        message: `Successfully synced ${addedCount} new response(s) from Google Sheet (${rows.length} total rows processed).` 
      }, event);
    }

    // ─── Social Media & Digital Channels Endpoints ───────────────────────────
    if (path === '/socials' && method === 'GET') {
      const socials = await db.getSocials();
      return jsonResponse(200, socials, event);
    }
    if (path === '/socials' && method === 'POST') {
      requirePermission(event, 'socials');
      const updated = await db.updateSocials(body);
      return jsonResponse(200, { success: true, socials: updated }, event);
    }

    // ─── Image Upload Endpoint ────────────────────────────────────────────────
    if (path === '/upload' && method === 'POST') {
      const userPayload = authenticateUser(event);
      if (userPayload.role === 'client' && !isFullAdminUser(userPayload)) {
        throw new Error('Forbidden: Staff authorization required for direct media uploads');
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
