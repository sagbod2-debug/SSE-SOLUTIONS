import fs from 'node:fs';
import path from 'node:path';
import type { AstroIntegration } from 'astro';

export function applyFrenchTypographyToTextNode(text: string): string {
  if (!text || !text.trim()) return text;

  let out = text;

  // 1. Apostrophe typographique (’) à la place de l'apostrophe droite (') dans les nœuds de texte visibles
  out = out.replace(/(&#39;|&apos;)/g, '’');
  out = out.replace(/([A-Za-zÀ-ÖØ-öø-ÿœŒæÆ0-9])'([A-Za-zÀ-ÖØ-öø-ÿœŒæÆ0-9])/g, '$1’$2');
  out = out.replace(/'/g, '’');

  // 2. Espace insécable (U+00A0) à l'intérieur des guillemets français « ... »
  out = out.replace(/«[ \t\r\n\u00A0\u202F]*/g, '«\u00A0');
  out = out.replace(/[ \t\r\n\u00A0\u202F]*»/g, '\u00A0»');

  // 3. Espace insécable (U+00A0) avant :
  out = out.replace(/[ \t\r\n\u202F]+:/g, '\u00A0:');

  // 4. Espace fine insécable (U+202F) avant ; ! ?
  out = out.replace(/[ \t\r\n\u00A0]+([;!?])/g, '\u202F$1');

  // 5. Espace insécable (U+00A0) dans les nombres à milliers (ex. 5 000) et entre un nombre et ce qu'il compte
  out = out.replace(/(\b\d+)[ \t\r\n]+(\d{3}\b)/g, '$1\u00A0$2');
  out = out.replace(
    /(\b\d+)[ \t\r\n]+([A-Za-zÀ-ÖØ-öø-ÿœŒæÆ%€]+)/g,
    '$1\u00A0$2'
  );

  return out;
}

/**
 * Parcourt une chaîne HTML complète et applique la typographie française
 * uniquement aux nœuds de texte visibles (jamais dans les balises, attributs,
 * scripts, styles, blocs de code ou <title>).
 */
export function transformHtmlTextNodes(html: string): string {
  const tokenRegex =
    /(<!--[\s\S]*?-->|<!DOCTYPE[^>]*>|<script\b[^>]*>[\s\S]*?<\/script>|<style\b[^>]*>[\s\S]*?<\/style>|<code\b[^>]*>[\s\S]*?<\/code>|<pre\b[^>]*>[\s\S]*?<\/pre>|<kbd\b[^>]*>[\s\S]*?<\/kbd>|<samp\b[^>]*>[\s\S]*?<\/samp>|<\/?[a-zA-Z][^>]*>)/gi;

  const parts = html.split(tokenRegex);

  for (let i = 0; i < parts.length; i++) {
    const token = parts[i];
    if (!token) continue;
    if (token.startsWith('<')) continue;
    parts[i] = applyFrenchTypographyToTextNode(token);
  }

  return parts.join('');
}

export function processDirectoryHtmlTypography(dirPath: string): number {
  let count = 0;
  if (!fs.existsSync(dirPath)) return count;

  for (const entry of fs.readdirSync(dirPath, { withFileTypes: true })) {
    const full = path.join(dirPath, entry.name);
    if (entry.isDirectory()) {
      count += processDirectoryHtmlTypography(full);
    } else if (entry.name.endsWith('.html')) {
      const raw = fs.readFileSync(full, 'utf8');
      const transformed = transformHtmlTextNodes(raw);
      if (transformed !== raw) {
        fs.writeFileSync(full, transformed, 'utf8');
      }
      count++;
    }
  }
  return count;
}

export function frenchTypographyIntegration(): AstroIntegration {
  return {
    name: 'sse-french-typography',
    hooks: {
      'astro:build:done': async () => {
        processDirectoryHtmlTypography(path.resolve('dist/client'));
        processDirectoryHtmlTypography(path.resolve('.vercel/output/static'));
      },
    },
  };
}
