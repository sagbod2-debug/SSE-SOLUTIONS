import fs from 'node:fs';
import path from 'node:path';

const staticDir = path.resolve('.vercel/output/static');
const clientDir = path.resolve('dist/client');

function applyFrenchTypographyToTextNode(text) {
  if (!text || !text.trim()) return text;
  let out = text;
  out = out.replace(/(&#39;|&apos;)/g, '’');
  out = out.replace(/([A-Za-zÀ-ÖØ-öø-ÿœŒæÆ0-9])'([A-Za-zÀ-ÖØ-öø-ÿœŒæÆ0-9])/g, '$1’$2');
  out = out.replace(/'/g, '’');
  out = out.replace(/«[ \t\r\n\u00A0\u202F]*/g, '«\u00A0');
  out = out.replace(/[ \t\r\n\u00A0\u202F]*»/g, '\u00A0»');
  out = out.replace(/[ \t\r\n\u202F]+:/g, '\u00A0:');
  out = out.replace(/[ \t\r\n\u00A0]+([;!?])/g, '\u202F$1');
  out = out.replace(/(\b\d+)[ \t\r\n]+(\d{3}\b)/g, '$1\u00A0$2');
  out = out.replace(/(\b\d+)[ \t\r\n]+([A-Za-zÀ-ÖØ-öø-ÿœŒæÆ%€]+)/g, '$1\u00A0$2');
  return out;
}

function transformHtmlTextNodes(html) {
  const tokenRegex =
    /(<!--[\s\S]*?-->|<!DOCTYPE[^>]*>|<script\b[^>]*>[\s\S]*?<\/script>|<style\b[^>]*>[\s\S]*?<\/style>|<code\b[^>]*>[\s\S]*?<\/code>|<pre\b[^>]*>[\s\S]*?<\/pre>|<kbd\b[^>]*>[\s\S]*?<\/kbd>|<samp\b[^>]*>[\s\S]*?<\/samp>|<\/?[a-zA-Z][^>]*>)/gi;
  const parts = html.split(tokenRegex);
  for (let i = 0; i < parts.length; i++) {
    const token = parts[i];
    if (!token || token.startsWith('<')) continue;
    parts[i] = applyFrenchTypographyToTextNode(token);
  }
  return parts.join('');
}

// 1. Copy sitemap files from dist/client to .vercel/output/static
if (fs.existsSync(clientDir) && fs.existsSync(staticDir)) {
  for (const file of ['sitemap-index.xml', 'sitemap-0.xml']) {
    const src = path.join(clientDir, file);
    const dest = path.join(staticDir, file);
    if (fs.existsSync(src)) {
      fs.copyFileSync(src, dest);
    }
  }
}

// 2. Strip HTML comments and apply French typography on generated static HTML files
function walkHtml(dir) {
  let results = [];
  if (!fs.existsSync(dir)) return results;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      results.push(...walkHtml(full));
    } else if (entry.name.endsWith('.html')) {
      results.push(full);
    }
  }
  return results;
}

for (const dir of [clientDir, staticDir]) {
  for (const htmlFile of walkHtml(dir)) {
    const html = fs.readFileSync(htmlFile, 'utf8');
    const withoutComments = html.replace(/<!--[\s\S]*?-->/g, '');
    const withTypography = transformHtmlTextNodes(withoutComments);
    fs.writeFileSync(htmlFile, withTypography, 'utf8');
  }
}

// 3. Configure self-contained Serverless Function (_render.func) without Windows junctions
const funcDir = path.resolve('.vercel/output/functions/_render.func');
const vcConfigPath = path.join(funcDir, '.vc-config.json');
if (fs.existsSync(funcDir) && fs.existsSync(vcConfigPath)) {
  // Remove Windows symlinked node_modules that break on Vercel Linux runtime
  const funcNodeModules = path.join(funcDir, 'node_modules');
  if (fs.existsSync(funcNodeModules)) {
    fs.rmSync(funcNodeModules, { recursive: true, force: true });
  }

  // Copy 404.html into _render.func so unknown routes always return full 404.astro HTML with HTTP 404
  const fourOhFourSrc = path.join(staticDir, '404.html');
  if (fs.existsSync(fourOhFourSrc)) {
    fs.copyFileSync(fourOhFourSrc, path.join(funcDir, '404.html'));
  }

  // Write standalone Node.js handler that invokes compiled /api/contact directly and serves 404.html for unknown routes
  const handlerCode = `import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { page } from './dist/server/pages/api/contact.astro.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const fourOhFourHtml = fs.existsSync(path.join(__dirname, '404.html'))
  ? fs.readFileSync(path.join(__dirname, '404.html'), 'utf8')
  : '<!doctype html><html lang="fr"><head><meta charset="utf-8"><title>Cette page n’existe pas — SSE Solutions</title></head><body><h1>Cette page n’existe pas.</h1></body></html>';

export default async function handler(req, res) {
  const rawUrl = req.url || '/';
  const pathname = rawUrl.split('?')[0];

  if (!pathname.startsWith('/api/contact')) {
    res.statusCode = 404;
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.end(fourOhFourHtml);
    return;
  }

  const mod = page();
  const method = (req.method || 'GET').toUpperCase();

  if (method !== 'POST') {
    if (typeof mod.GET === 'function' && method === 'GET') {
      const webRes = await mod.GET({ request: new Request('https://ssesolutions.fr/api/contact', { method: 'GET' }) });
      res.statusCode = webRes.status;
      webRes.headers.forEach((v, k) => res.setHeader(k, v));
      res.end(await webRes.text());
      return;
    }
    res.statusCode = 405;
    res.setHeader('Allow', 'POST');
    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    res.end(JSON.stringify({ ok: false, message: 'Méthode non autorisée. Cet endpoint accepte uniquement les requêtes POST.' }));
    return;
  }

  const chunks = [];
  if (req.body && typeof req.body === 'string') {
    chunks.push(Buffer.from(req.body));
  } else if (req.body && Buffer.isBuffer(req.body)) {
    chunks.push(req.body);
  } else if (req.body && typeof req.body === 'object') {
    chunks.push(Buffer.from(JSON.stringify(req.body)));
  } else {
    for await (const chunk of req) {
      chunks.push(typeof chunk === 'string' ? Buffer.from(chunk) : chunk);
    }
  }
  const bodyBuffer = Buffer.concat(chunks);

  const headers = new Headers();
  for (const [k, v] of Object.entries(req.headers || {})) {
    if (Array.isArray(v)) {
      v.forEach((item) => headers.append(k, item));
    } else if (typeof v === 'string') {
      headers.set(k, v);
    }
  }

  const proto = headers.get('x-forwarded-proto') || 'https';
  const host = headers.get('host') || 'ssesolutions.fr';
  const fullUrl = \`\${proto}://\${host}\${req.url || '/api/contact'}\`;

  const webReq = new Request(fullUrl, {
    method: 'POST',
    headers,
    body: bodyBuffer.length > 0 ? bodyBuffer : undefined,
  });

  const clientAddress =
    (headers.get('x-forwarded-for') || '').split(',')[0].trim() ||
    headers.get('x-real-ip') ||
    req.socket?.remoteAddress ||
    'unknown';

  const webRes = await mod.POST({ request: webReq, clientAddress });
  res.statusCode = webRes.status;
  webRes.headers.forEach((v, k) => res.setHeader(k, v));
  res.end(await webRes.text());
}
`;
  fs.writeFileSync(path.join(funcDir, 'index.mjs'), handlerCode, 'utf8');

  const cfg = JSON.parse(fs.readFileSync(vcConfigPath, 'utf8'));
  cfg.runtime = 'nodejs22.x';
  cfg.handler = 'index.mjs';
  fs.writeFileSync(vcConfigPath, JSON.stringify(cfg, null, 2), 'utf8');
}

// 4. Ensure 404.html is served with HTTP 404 status on Vercel for any unknown route
const vercelConfigPath = path.resolve('.vercel/output/config.json');
if (fs.existsSync(vercelConfigPath)) {
  const fourOhFourHtml = path.join(staticDir, '404.html');
  const fourOhFourDir = path.join(staticDir, '404');
  if (fs.existsSync(fourOhFourHtml)) {
    fs.mkdirSync(fourOhFourDir, { recursive: true });
    fs.copyFileSync(fourOhFourHtml, path.join(fourOhFourDir, 'index.html'));
  }

  const vConfig = JSON.parse(fs.readFileSync(vercelConfigPath, 'utf8'));
  vConfig.routes = [
    {
      src: '^/_astro/(.*)$',
      headers: {
        'cache-control': 'public, max-age=31536000, immutable',
      },
      continue: true,
    },
    {
      handle: 'filesystem',
    },
    {
      src: '^\\/api\\/contact\\/?$',
      dest: '_render',
    },
    {
      src: '/.*',
      dest: '_render',
      status: 404,
    },
  ];
  fs.writeFileSync(vercelConfigPath, JSON.stringify(vConfig, null, 2), 'utf8');
}

console.log('[postbuild] .vercel/output finalized (sitemap, French typography, clean HTML, 404 routing, standalone nodejs22.x function).');
