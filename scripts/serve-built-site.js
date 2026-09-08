// Serve the generated files, including the real 404 document. Vite's SPA
// fallback would return the homepage for missing paths and mask hosting bugs.
import http from 'node:http';
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(fileURLToPath(new URL('../dist/', import.meta.url)));
const mime = {
  '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css',
  '.json': 'application/json', '.svg': 'image/svg+xml', '.png': 'image/png',
  '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.webp': 'image/webp',
  '.woff2': 'font/woff2', '.woff': 'font/woff', '.xml': 'application/xml', '.txt': 'text/plain'
};
http.createServer(async (request, response) => {
  let filename;
  let data;
  let status = 200;
  try {
    const pathname = decodeURIComponent(new URL(request.url, 'http://localhost').pathname);
    filename = path.resolve(root, '.' + pathname);
    if (filename !== root && !filename.startsWith(root + path.sep)) throw new Error('Outside build');
    if ((await fs.stat(filename)).isDirectory()) filename = path.join(filename, 'index.html');
    data = await fs.readFile(filename);
  } catch {
    status = 404;
    filename = path.join(root, '404.html');
    try { data = await fs.readFile(filename); }
    catch { response.writeHead(500); response.end('Build the site before running browser checks.'); return; }
  }
  response.writeHead(status, { 'content-type': mime[path.extname(filename)] || 'application/octet-stream' });
  response.end(data);
}).listen(4173, '127.0.0.1', () => console.log('Built site: http://127.0.0.1:4173'));
