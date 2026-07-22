const express = require('express');
const cors = require('cors');
const path = require('path');
const http = require('http');
const https = require('https');
const fs = require('fs');

const app = express();

// Disable ETags globally so Brave/Chrome can't use conditional GET 304 (stale cache)
app.set('etag', false);

// Force no-cache on EVERY response — this fires BEFORE Traefik or any middleware
// and prevents the reverse proxy from reusing old headers
app.use((req, res, next) => {
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0');
  res.setHeader('Pragma', 'no-cache');
  res.setHeader('Expires', '0');
  res.setHeader('Surrogate-Control', 'no-store');
  next();
});
const PORT = process.env.PORT || 3000;

// Ensure uploads directory exists
const uploadsDir = path.join(__dirname, 'public', 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// Serve static assets — headers already set by global middleware above
// etag:false and lastModified:false remove ALL conditional GET validators
app.use(express.static(path.join(__dirname, 'public'), {
  etag: false,
  lastModified: false,
  maxAge: 0,
  immutable: false
}));

// File upload endpoint (Base64 file receiver for zero external binary dependencies)
app.post('/api/upload', (req, res) => {
  try {
    const { fileName, fileData } = req.body;

    if (!fileName || !fileData) {
      return res.status(400).json({ error: 'Missing fileName or fileData in request body.' });
    }

    const matches = fileData.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
    if (!matches || matches.length !== 3) {
      return res.status(400).json({ error: 'Invalid base64 string format.' });
    }

    const base64Buffer = Buffer.from(matches[2], 'base64');
    const safeFileName = `${Date.now()}_${fileName.replace(/[^a-zA-Z0-9.-]/g, '_')}`;
    const filePath = path.join(uploadsDir, safeFileName);

    fs.writeFileSync(filePath, base64Buffer);

    const fileUrl = `/uploads/${safeFileName}`;
    res.json({ success: true, url: fileUrl, fileName: safeFileName });
  } catch (err) {
    console.error('File Upload Error:', err);
    res.status(500).json({ error: 'Internal server error uploading file: ' + err.message });
  }
});

// Odoo CORS Proxy Endpoint
app.post('/api/odoo-proxy', async (req, res) => {
  const { odooUrl, endpoint, payload } = req.body;

  if (!odooUrl || !endpoint) {
    return res.status(400).json({ error: 'Missing odooUrl or endpoint in request body.' });
  }

  try {
    const targetUrl = new URL(endpoint, odooUrl);
    const postData = JSON.stringify(payload || {});

    const isHttps = targetUrl.protocol === 'https:';
    const client = isHttps ? https : http;

    const options = {
      hostname: targetUrl.hostname,
      port: targetUrl.port || (isHttps ? 443 : 80),
      path: targetUrl.pathname + targetUrl.search,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData),
        'User-Agent': 'Odoo-Notion-Kanban/1.0'
      }
    };

    const proxyReq = client.request(options, (proxyRes) => {
      let data = '';
      proxyRes.on('data', (chunk) => { data += chunk; });
      proxyRes.on('end', () => {
        try {
          const json = JSON.parse(data);
          res.setHeader('Content-Type', 'application/json');
          res.status(proxyRes.statusCode || 200).send(json);
        } catch (e) {
          res.status(500).json({ error: 'Failed to parse Odoo response', raw: data });
        }
      });
    });

    proxyReq.on('error', (err) => {
      console.error('Proxy Error:', err.message);
      res.status(502).json({ error: `Could not connect to Odoo server at ${odooUrl}: ${err.message}` });
    });

    proxyReq.write(postData);
    proxyReq.end();
  } catch (err) {
    res.status(500).json({ error: 'Invalid URL or internal proxy error: ' + err.message });
  }
});

// Explicit GET / route — serves index.html as a DYNAMIC response so Traefik
// cannot cache it and Brave's disk/memory cache is always bypassed.
// This must come AFTER the API routes and AFTER static middleware.
app.get('/', (req, res) => {
  res.set({
    'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0',
    'Pragma': 'no-cache',
    'Expires': '0',
    'Surrogate-Control': 'no-store',
    'Vary': '*'
  });
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`===================================================`);
  console.log(`  🚀 Odoo Notion Kanban Server running!`);
  console.log(`  🌐 Dashboard: http://localhost:${PORT}`);
  console.log(`===================================================`);
});
