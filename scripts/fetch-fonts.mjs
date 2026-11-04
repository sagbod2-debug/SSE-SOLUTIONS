import fs from 'node:fs/promises';
import path from 'node:path';

const FONTS_DIR = path.resolve('public/fonts');

async function downloadFonts() {
  await fs.mkdir(FONTS_DIR, { recursive: true });
  // Fetch Google Fonts CSS with a modern Desktop Chrome User-Agent to get woff2 URLs
  const url = 'https://fonts.googleapis.com/css2?family=Hanken+Grotesk:wght@400;500;600&family=Marcellus&display=swap';
  const res = await fetch(url, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36'
    }
  });
  const css = await res.text();

  // Parse @font-face blocks
  const blocks = css.match(/\/\*\s*([a-z-]+)\s*\*\/\s*@font-face\s*\{[^}]+\}/gi) || [];
  let localCss = `/* Polices auto-hébergées (RGPD — aucun appel externe à Google Fonts) */\n\n`;
  let counter = 0;

  for (const block of blocks) {
    const subsetMatch = block.match(/\/\*\s*([a-z-]+)\s*\*\//i);
    const subset = subsetMatch ? subsetMatch[1] : 'latin';
    if (subset !== 'latin' && subset !== 'latin-ext') continue;

    const familyMatch = block.match(/font-family:\s*'([^']+)'/);
    const weightMatch = block.match(/font-weight:\s*(\d+)/);
    const srcMatch = block.match(/src:\s*url\((https:\/\/[^)]+\.woff2)\)/);
    const rangeMatch = block.match(/unicode-range:\s*([^;]+);/);

    if (!familyMatch || !weightMatch || !srcMatch) continue;
    const family = familyMatch[1];
    const weight = weightMatch[1];
    const remoteUrl = srcMatch[1];
    const unicodeRange = rangeMatch ? rangeMatch[1].trim() : '';

    const slug = family.toLowerCase().replace(/\s+/g, '-');
    const filename = `${slug}-${weight}-${subset}.woff2`;
    const filepath = path.join(FONTS_DIR, filename);

    const fontRes = await fetch(remoteUrl);
    if (!fontRes.ok) throw new Error(`Failed to fetch ${remoteUrl}`);
    const buffer = Buffer.from(await fontRes.arrayBuffer());
    await fs.writeFile(filepath, buffer);
    counter++;

    localCss += `/* ${family} ${weight} (${subset}) */\n@font-face {\n  font-family: '${family}';\n  font-style: normal;\n  font-weight: ${weight};\n  font-display: swap;\n  src: url('/fonts/${filename}') format('woff2');\n${unicodeRange ? `  unicode-range: ${unicodeRange};\n` : ''}}\n\n`;
  }

  await fs.mkdir(path.resolve('src/styles'), { recursive: true });
  await fs.writeFile(path.resolve('src/styles/fonts.css'), localCss, 'utf8');
  console.log(`Downloaded ${counter} woff2 font files and generated src/styles/fonts.css`);
}

downloadFonts().catch((err) => {
  console.error(err);
  process.exit(1);
});

