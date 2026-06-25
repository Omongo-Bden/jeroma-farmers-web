// Standalone Node.js Server for Jeroma Farmers Web App (CommonJS)
// Serves API endpoints (using existing serverless functions) and static files from the dist/ folder.
// Runs locally and on standard Node.js cloud deployments.

const http = require('http');
const fs = require('fs');
const path = require('path');
const url = require('url');

// ─── Load Environment Variables from .env ───────────────────────────────────
try {
  const envPath = path.join(__dirname, '.env');
  if (fs.existsSync(envPath)) {
    const envContent = fs.readFileSync(envPath, 'utf8');
    envContent.split(/\r?\n/).forEach(line => {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#')) return;
      const index = trimmed.indexOf('=');
      if (index > 0) {
        const key = trimmed.substring(0, index).trim();
        const val = trimmed.substring(index + 1).trim().replace(/^['"]|['"]$/g, '');
        if (key && !process.env[key]) {
          process.env[key] = val;
        }
      }
    });
    console.log('Loaded local environment variables from .env');
  }
} catch (e) {
  console.warn('Could not load .env file:', e.message);
}

// Ensure JWT secret fallback exists
if (!process.env.JWT_SECRET) {
  process.env.JWT_SECRET = 'jeroma_farmers_secret_key_2026_lira_uganda';
}

const PORT = process.env.PORT || 5000;

// Rate limiting cache variables (window: 1 minute)
const RATE_LIMIT_WINDOW = 60 * 1000;
const MAX_REQUESTS_PER_MIN = 150;
const serverIpCache = {};

const isRateLimited = (req) => {
  const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress || 'local-ip';
  const now = Date.now();
  if (!serverIpCache[ip]) {
    serverIpCache[ip] = [];
  }
  serverIpCache[ip] = serverIpCache[ip].filter(timestamp => now - timestamp < RATE_LIMIT_WINDOW);
  if (serverIpCache[ip].length >= MAX_REQUESTS_PER_MIN) {
    return true;
  }
  serverIpCache[ip].push(now);
  return false;
};

const MIME_TYPES = {
  '.html': 'text/html',
  '.css': 'text/css',
  '.js': 'text/javascript',
  '.json': 'application/json',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.txt': 'text/plain',
  '.webmanifest': 'application/manifest+json'
};

const jsonResponse = (res, statusCode, data) => {
  res.writeHead(statusCode, {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS'
  });
  res.end(JSON.stringify(data));
};

const serveStatic = (req, res, pathname) => {
  if (req.method !== 'GET' && req.method !== 'HEAD') {
    res.writeHead(405, { 'Content-Type': 'text/plain' });
    return res.end('Method not allowed');
  }

  // Sanitize path to prevent directory traversal
  let safePath = path.normalize(pathname).replace(/^(\.\.[\/\\])+/, '');
  if (safePath === '/' || safePath === '\\') {
    safePath = '/index.html';
  }

  let filePath = path.join(__dirname, 'dist', safePath);

  // If path doesn't exist or is a directory, fallback to index.html for SPA router support
  if (!fs.existsSync(filePath) || fs.statSync(filePath).isDirectory()) {
    filePath = path.join(__dirname, 'dist', 'index.html');
  }

  // If even index.html doesn't exist, the build was not run yet
  if (!fs.existsSync(filePath)) {
    res.writeHead(404, { 'Content-Type': 'text/plain' });
    return res.end('Application files not found. Please run "npm run build" first.');
  }

  const ext = path.extname(filePath).toLowerCase();
  const contentType = MIME_TYPES[ext] || 'application/octet-stream';

  res.writeHead(200, { 'Content-Type': contentType });
  if (req.method === 'HEAD') {
    return res.end();
  }
  const readStream = fs.createReadStream(filePath);
  readStream.on('error', (err) => {
    console.error('File streaming error:', err);
    if (!res.headersSent) {
      res.writeHead(500, { 'Content-Type': 'text/plain' });
      res.end('Internal server error');
    }
  });
  readStream.pipe(res);
};

const server = http.createServer((req, res) => {
  if (isRateLimited(req)) {
    res.writeHead(429, { 'Content-Type': 'text/plain' });
    return res.end('Too many requests. Please try again later.');
  }

  // Enable CORS Preflight requests for endpoints
  if (req.method === 'OPTIONS') {
    const origin = req.headers.origin || req.headers.Origin || '*';
    res.writeHead(200, {
      'Access-Control-Allow-Origin': origin,
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Credentials': 'true'
    });
    return res.end();
  }

  const parsedUrl = url.parse(req.url, true);
  const pathname = parsedUrl.pathname;

  // Read request body buffer
  const bodyChunks = [];
  req.on('data', chunk => bodyChunks.push(chunk));
  req.on('end', async () => {
    const rawBody = Buffer.concat(bodyChunks).toString('utf8');

    // Route API requests to Netlify handlers
    if (pathname.startsWith('/api/chat')) {
      try {
        const chatHandler = require('./netlify/functions/chat').handler;
        
        // Mock netlify event parameter
        const event = {
          httpMethod: req.method,
          path: pathname,
          headers: req.headers,
          body: rawBody,
          queryStringParameters: parsedUrl.query
        };

        const result = await chatHandler(event, {});
        
        // Write Netlify function response back
        res.writeHead(result.statusCode || 200, result.headers || { 'Content-Type': 'application/json' });
        res.end(result.body || '');
      } catch (err) {
        console.error('API Chat function execution failed:', err);
        jsonResponse(res, 500, { error: 'Chat API error: ' + err.message });
      }
    } else if (pathname.startsWith('/api/')) {
      try {
        const apiHandler = require('./netlify/functions/api').handler;
        
        const event = {
          httpMethod: req.method,
          path: pathname,
          headers: req.headers,
          body: rawBody,
          queryStringParameters: parsedUrl.query
        };

        const result = await apiHandler(event, {});
        
        res.writeHead(result.statusCode || 200, result.headers || { 'Content-Type': 'application/json' });
        res.end(result.body || '');
      } catch (err) {
        console.error('API Endpoint execution failed:', err);
        jsonResponse(res, 500, { error: 'API execution error: ' + err.message });
      }
    } else {
      // Serve static client assets
      serveStatic(req, res, pathname);
    }
  });
});

server.listen(PORT, () => {
  console.log(`=========================================`);
  console.log(`Jeroma standalone server active on port ${PORT}`);
  console.log(`Frontend URL (if built): http://localhost:${PORT}`);
  console.log(`Backend API endpoint: http://localhost:${PORT}/api/`);
  console.log(`=========================================`);
});

// Auto-retry on a different port if the preferred one is occupied
server.on('error', (err) => {
  if (err.code === 'EADDRINUSE') {
    const triedPort = err.port || PORT;
    const nextPort = parseInt(triedPort) + 1;
    if (nextPort <= 5010) {
      console.warn(`Port ${triedPort} is already in use — trying port ${nextPort}...`);
      server.close();
      server.listen(nextPort, () => {
        const actualPort = server.address().port;
        console.log(`=========================================`);
        console.log(`Jeroma standalone server active on port ${actualPort}`);
        console.log(`Frontend URL (if built): http://localhost:${actualPort}`);
        console.log(`Backend API endpoint: http://localhost:${actualPort}/api/`);
        console.log(`NOTE: Update vite.config.js proxy target to port ${actualPort} if different from 5000`);
        console.log(`=========================================`);
      });
    } else {
      console.error(`All ports from 5000–5010 are occupied. Please free a port manually and retry.`);
      process.exit(1);
    }
  } else {
    console.error('Server error:', err);
    process.exit(1);
  }
});
