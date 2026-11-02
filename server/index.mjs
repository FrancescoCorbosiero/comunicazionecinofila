/* =====================================================================
   Server di produzione per Docker (dietro Caddy).
   · serve il sito statico di dist/ (build di Astro) con le stesse regole di
     cache e sicurezza di netlify.toml / public/_headers;
   · POST /api/form → server/form-handler.mjs → email via AWS SES;
   · GET /healthz → 200 (healthcheck del container).
   Zero framework: solo node:http. HTTPS, compressione e dominio li gestisce
   Caddy (vedi docker-compose.yml, label caddy.*).
   Avvio locale: npm run build && npm run serve (con un .env, vedi .env.example).
   ===================================================================== */
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { handleForm } from './form-handler.mjs';

const ROOT = path.resolve(fileURLToPath(new URL('.', import.meta.url)), '..', 'dist');
const PORT = Number(process.env.PORT) || 3000;
const MAX_BODY = 64 * 1024;

const TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.webmanifest': 'application/manifest+json; charset=utf-8',
  '.xml': 'application/xml; charset=utf-8',
  '.txt': 'text/plain; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
  '.avif': 'image/avif',
  '.gif': 'image/gif',
  '.ico': 'image/x-icon',
  '.woff2': 'font/woff2',
  '.woff': 'font/woff',
};

const SECURITY = {
  'X-Content-Type-Options': 'nosniff',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'X-Frame-Options': 'SAMEORIGIN',
};

function cacheFor(urlPath) {
  if (urlPath.startsWith('/_astro/')) return 'public, max-age=31536000, immutable';
  if (urlPath.startsWith('/assets/')) return 'public, max-age=2592000';
  return 'public, max-age=0, must-revalidate';
}

/* Risolve /percorso → dist/percorso, dist/percorso.html o dist/percorso/index.html. */
function resolveFile(urlPath) {
  let p;
  try {
    p = decodeURIComponent(urlPath);
  } catch {
    return null;
  }
  const safe = path.normalize(p).replace(/^(\.\.[/\\])+/, '');
  const base = path.join(ROOT, safe);
  if (!base.startsWith(ROOT)) return null;
  for (const c of [base, base + '.html', path.join(base, 'index.html')]) {
    try {
      if (fs.statSync(c).isFile()) return c;
    } catch {
      /* prossimo candidato */
    }
  }
  return null;
}

function sendFile(req, res, file, status = 200, urlPath = req.url) {
  const stat = fs.statSync(file);
  const etag = `W/"${stat.size.toString(16)}-${stat.mtimeMs.toString(16)}"`;
  const headers = {
    ...SECURITY,
    'Content-Type': TYPES[path.extname(file).toLowerCase()] || 'application/octet-stream',
    'Cache-Control': status === 200 ? cacheFor(urlPath) : 'no-store',
    ETag: etag,
  };
  if (status === 200 && req.headers['if-none-match'] === etag) {
    res.writeHead(304, headers).end();
    return;
  }
  res.writeHead(status, { ...headers, 'Content-Length': stat.size });
  if (req.method === 'HEAD') return res.end();
  fs.createReadStream(file).pipe(res);
}

/* Limite gentile anti-abuso: 8 invii ogni 10 minuti per IP. */
const hits = new Map();
function rateLimited(ip) {
  const now = Date.now();
  const list = (hits.get(ip) || []).filter((t) => now - t < 10 * 60 * 1000);
  list.push(now);
  hits.set(ip, list);
  if (hits.size > 5000) hits.clear();
  return list.length > 8;
}

const json = (res, status, body) =>
  res.writeHead(status, { ...SECURITY, 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' }).end(JSON.stringify(body));

const server = http.createServer((req, res) => {
  const url = new URL(req.url || '/', 'http://localhost');

  if (url.pathname === '/healthz') return json(res, 200, { ok: true });

  if (url.pathname === '/api/form') {
    if (req.method !== 'POST') return json(res, 405, { ok: false, error: 'metodo-non-ammesso' });
    // Caddy aggiunge X-Forwarded-For: il primo è il visitatore.
    const ip = String(req.headers['x-forwarded-for'] || req.socket.remoteAddress || '').split(',')[0].trim();
    if (rateLimited(ip)) return json(res, 429, { ok: false, error: 'troppi-invii' });
    let size = 0;
    const chunks = [];
    req.on('data', (c) => {
      size += c.length;
      if (size > MAX_BODY) {
        json(res, 413, { ok: false, error: 'troppo-grande' });
        req.destroy();
      } else chunks.push(c);
    });
    req.on('end', async () => {
      if (res.headersSent) return;
      const { status, body } = await handleForm(Buffer.concat(chunks).toString('utf8'), {
        ip,
        userAgent: req.headers['user-agent'],
        referer: req.headers.referer,
      });
      json(res, status, body);
    });
    return;
  }

  if (req.method !== 'GET' && req.method !== 'HEAD') return json(res, 405, { ok: false });

  const file = resolveFile(url.pathname);
  if (file) return sendFile(req, res, file, 200, url.pathname);
  const notFound = path.join(ROOT, '404.html');
  if (fs.existsSync(notFound)) return sendFile(req, res, notFound, 404);
  res.writeHead(404, SECURITY).end('Not found');
});

server.listen(PORT, () => console.log(`[server] in ascolto su :${PORT} (dist: ${ROOT})`));
for (const sig of ['SIGTERM', 'SIGINT']) process.on(sig, () => server.close(() => process.exit(0)));
