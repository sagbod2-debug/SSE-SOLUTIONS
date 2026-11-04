import fs from 'node:fs';
import path from 'node:path';

const staticDir = path.resolve('.vercel/output/static');
const clientDir = path.resolve('dist/client');

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

// 2. Strip HTML comments from generated static HTML files
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

for (const htmlFile of walkHtml(staticDir)) {
  const html = fs.readFileSync(htmlFile, 'utf8');
  const cleaned = html.replace(/<!--[\s\S]*?-->/g, '');
  fs.writeFileSync(htmlFile, cleaned, 'utf8');
}

// 3. Ensure Vercel Serverless Function uses nodejs22.x runtime
const vcConfigPath = path.resolve('.vercel/output/functions/_render.func/.vc-config.json');
if (fs.existsSync(vcConfigPath)) {
  const cfg = JSON.parse(fs.readFileSync(vcConfigPath, 'utf8'));
  cfg.runtime = 'nodejs22.x';
  fs.writeFileSync(vcConfigPath, JSON.stringify(cfg, null, 2), 'utf8');
}

console.log('[postbuild] .vercel/output finalized (sitemap, clean HTML, nodejs22.x runtime).');

