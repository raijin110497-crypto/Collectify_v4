const http = require('http');
const fs = require('fs');
const path = require('path');
const url = require('url');

const PORT = process.env.PORT || 3000;
const ROOT = path.resolve(__dirname);

const CONTENT_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.htm': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.mjs': 'application/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml; charset=utf-8',
  '.ico': 'image/x-icon',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.webp': 'image/webp',
  '.woff2': 'font/woff2',
  '.woff': 'font/woff',
  '.ttf': 'font/ttf',
  '.map': 'application/json; charset=utf-8',
  '.txt': 'text/plain; charset=utf-8',
  '.wasm': 'application/wasm'
};

function send(res, status, body, headers = {}) {
  res.writeHead(status, headers);
  res.end(body);
}

function serveFile(filePath, res) {
  const ext = path.extname(filePath).toLowerCase();
  const type = CONTENT_TYPES[ext] || 'application/octet-stream';
  const stream = fs.createReadStream(filePath);

  stream.on('open', () => {
    res.writeHead(200, { 'Content-Type': type });
  });

  stream.on('error', () => {
    send(res, 500, 'Internal Server Error');
  });

  stream.pipe(res);
}

function resolvePath(requestUrl) {
  const parsed = url.parse(requestUrl);
  let pathname = decodeURIComponent(parsed.pathname || '/');

  // Default to index.html for root
  if (pathname === '/' || pathname === '') {
    pathname = '/index.html';
  }

  // Normalize and prevent path traversal
  const normalized = path.normalize(pathname).replace(/^([.][.][\\/])+/, '');
  const safePath = path.join(ROOT, normalized);

  // Ensure resolved path stays within ROOT
  if (!safePath.startsWith(ROOT)) {
    return null;
  }

  return safePath;
}

const server = http.createServer((req, res) => {
  if (req.method !== 'GET' && req.method !== 'HEAD') {
    return send(res, 405, 'Method Not Allowed', { Allow: 'GET, HEAD' });
  }

  const filePath = resolvePath(req.url);
  if (!filePath) {
    return send(res, 403, 'Forbidden');
  }

  fs.stat(filePath, (err, stats) => {
    if (err || !stats.isFile()) {
      return send(res, 404, 'Not Found');
    }

    if (req.method === 'HEAD') {
      const ext = path.extname(filePath).toLowerCase();
      const type = CONTENT_TYPES[ext] || 'application/octet-stream';
      return send(res, 200, '', { 'Content-Type': type });
    }

    serveFile(filePath, res);
  });
});

server.listen(PORT, () => {
  console.log(`Dev server running at http://localhost:${PORT}/`);
});
