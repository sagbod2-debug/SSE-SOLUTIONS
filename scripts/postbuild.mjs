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
    /(<!--[\s\S]*?-->|<!DOCTYPE[^>]*>|<script\b[^>]*>[\s\S]*?<\/script>|<style\b[^>]*>[\s\S]*?<\/style>|<code\b[^>]*>[\s\S]*?<\/code>|<pre\b[^>]*>[\s\S]*?<\/pre>|<kbd\b[^>]*>[\s\S]*?<\/kbd>|<samp\b[^>]*>[\s\S]*?<\/samp>|<title\b[^>]*>[\s\S]*?<\/title>|<\/?[a-zA-Z][^>]*>)/gi;
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

// 3. Ensure Vercel Serverless Function uses nodejs22.x runtime
const vcConfigPath = path.resolve('.vercel/output/functions/_render.func/.vc-config.json');
if (fs.existsSync(vcConfigPath)) {
  const cfg = JSON.parse(fs.readFileSync(vcConfigPath, 'utf8'));
  cfg.runtime = 'nodejs22.x';
  fs.writeFileSync(vcConfigPath, JSON.stringify(cfg, null, 2), 'utf8');
}

console.log('[postbuild] .vercel/output finalized (sitemap, French typography, clean HTML, nodejs22.x runtime).');
