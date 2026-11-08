// Local server for dist/ that applies dist/_headers the way Cloudflare Pages does,
// so CSP and header problems show up locally, not in production.
// Usage: node dev.mjs [--port 8788]

import { createServer } from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import { readFileSync } from 'node:fs';
import { extname, join, normalize, sep, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { brotliCompressSync, gzipSync, constants as zlib } from 'node:zlib';

const ROOT = dirname(fileURLToPath(import.meta.url));
const DIST = join(ROOT, 'dist');
const portArg = process.argv.indexOf('--port');
const PORT = Number(portArg > -1 ? process.argv[portArg + 1] : process.env.PORT || 8788);

const TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.woff2': 'font/woff2',
  '.txt': 'text/plain; charset=utf-8',
  '.xml': 'application/xml; charset=utf-8',
};

/**
 * Parse the Cloudflare Pages _headers format: an unindented URL pattern line,
 * followed by indented "Name: value" lines. `*` is a splat, `:name` a placeholder.
 */
export function parseHeaders(text) {
  const rules = [];
  let current = null;
  for (const raw of text.split(/\r?\n/)) {
    if (!raw.trim() || raw.trim().startsWith('#')) continue;
    if (!/^\s/.test(raw)) {
      const pattern = raw.trim();
      const re = new RegExp(
        '^' +
          pattern
            .replace(/[.+?^${}()|[\]\\]/g, '\\$&')
            .replace(/\*/g, '.*')
            .replace(/:\w+/g, '[^/]+') +
          '$',
      );
      current = { pattern, re, headers: [] };
      rules.push(current);
    } else if (current) {
      const i = raw.indexOf(':');
      if (i > 0) current.headers.push([raw.slice(0, i).trim(), raw.slice(i + 1).trim()]);
    }
  }
  return rules;
}

/** Collect headers for a path. Like Pages, matching rules combine; repeated names are joined. */
export function headersFor(rules, path) {
  const out = new Map();
  for (const rule of rules) {
    if (!rule.re.test(path)) continue;
    for (const [name, value] of rule.headers) {
      const key = name.toLowerCase();
      out.set(key, out.has(key) ? `${out.get(key)}, ${value}` : value);
    }
  }
  return out;
}

async function isFile(p) {
  try {
    return (await stat(p)).isFile();
  } catch {
    return false;
  }
}

async function resolve(urlPath) {
  const decoded = decodeURIComponent(urlPath);
  const target = normalize(join(DIST, decoded));
  if (target !== DIST && !target.startsWith(DIST + sep)) return { status: 403 };
  if (decoded.endsWith('/')) {
    const index = join(target, 'index.html');
    return (await isFile(index)) ? { status: 200, file: index } : { status: 404 };
  }
  if (await isFile(target)) return { status: 200, file: target };
  // Pages redirects /about to /about/ when a directory index exists.
  if (await isFile(join(target, 'index.html'))) return { status: 308, location: `${decoded}/` };
  return { status: 404 };
}

function start() {
  let rules;
  try {
    rules = parseHeaders(readFileSync(join(DIST, '_headers'), 'utf8'));
  } catch {
    console.error('dist/_headers not found. Run "node build.mjs" first.');
    process.exit(1);
  }

  const server = createServer(async (req, res) => {
    try {
      const url = new URL(req.url, 'http://localhost');
      if (req.method !== 'GET' && req.method !== 'HEAD') {
        res.writeHead(405).end();
        return;
      }
      const found = await resolve(url.pathname);
      const headers = Object.fromEntries(headersFor(rules, url.pathname));
      if (found.status === 308) {
        res.writeHead(308, { ...headers, location: found.location + url.search }).end();
        return;
      }
      let file = found.file;
      let status = found.status;
      if (status !== 200) {
        file = join(DIST, '404.html');
        status = 404;
      }
      let body = await readFile(file);
      const type = TYPES[extname(file)] || 'application/octet-stream';
      // Compress text like Cloudflare does, so local measurements are comparable.
      const extra = {};
      if (/^(text\/|application\/(json|xml)|image\/svg)/.test(type)) {
        const accept = String(req.headers['accept-encoding'] || '');
        if (/\bbr\b/.test(accept)) {
          body = brotliCompressSync(body, { params: { [zlib.BROTLI_PARAM_QUALITY]: 11 } });
          extra['content-encoding'] = 'br';
        } else if (/\bgzip\b/.test(accept)) {
          body = gzipSync(body, { level: 9 });
          extra['content-encoding'] = 'gzip';
        }
        extra.vary = 'Accept-Encoding';
      }
      res.writeHead(status, {
        ...headers,
        ...extra,
        'content-type': type,
        'content-length': body.length,
      });
      res.end(req.method === 'HEAD' ? undefined : body);
    } catch (err) {
      console.error(err);
      if (!res.headersSent) res.writeHead(500);
      res.end();
    }
  });

  server.listen(PORT, '127.0.0.1', () => {
    console.log(`Trace dev server on http://localhost:${PORT} (headers from dist/_headers)`);
  });
}

start();
