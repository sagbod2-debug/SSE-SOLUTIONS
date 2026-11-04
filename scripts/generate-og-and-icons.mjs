import fs from 'node:fs/promises';
import path from 'node:path';
import sharp from 'sharp';

const OG_PAGES = [
  {
    slug: 'index',
    eyebrow: 'SSE SOLUTIONS · ESSONNE',
    lines: ['Social.', 'Sécurité.', 'Événements.'],
    subtitle: 'Accompagner les personnes, protéger les lieux, réussir les moments qui comptent.',
    tint: '#C9A24B',
  },
  {
    slug: 'cc-care',
    eyebrow: 'CC CARE · SOCIAL',
    lines: ['Accompagner.', 'Simplifier.', 'Rendre autonome.'],
    subtitle: 'Missions d’accompagnement social en établissement de santé, structure sociale et entreprise.',
    tint: '#8FB5A0',
  },
  {
    slug: 'cc-care-autonomie-inclusion',
    eyebrow: 'CC CARE · PROGRAMME EN LIGNE',
    lines: ['Autonomie &', 'Inclusion.'],
    subtitle: '35 modules · 244 ateliers · Français courant et version FALC.',
    tint: '#8FB5A0',
  },
  {
    slug: 'cc-consulting',
    eyebrow: 'CC CONSULTING · SÉCURITÉ',
    lines: ['Conformer.', 'Préparer.', 'Sécuriser.'],
    subtitle: 'Mise en conformité incendie des ERP et préparation aux commissions de sécurité.',
    tint: '#D98A6A',
  },
  {
    slug: 'cc-events',
    eyebrow: 'CC EVENTS · ÉVÉNEMENTIEL',
    lines: ['Imaginer.', 'Coordonner.', 'Réussir.'],
    subtitle: 'Organisation de grands événements et coordination des équipes sur le terrain.',
    tint: '#8FA8D9',
  },
  {
    slug: 'contact',
    eyebrow: 'CONTACT · SSE SOLUTIONS',
    lines: ['Parlons de', 'votre projet.'],
    subtitle: 'Réponse sous 48 heures ouvrées · Boussy-Saint-Antoine, Essonne.',
    tint: '#C9A24B',
  },
  {
    slug: 'mentions-legales',
    eyebrow: 'INFORMATIONS LÉGALES',
    lines: ['Mentions', 'légales.'],
    subtitle: 'SSE Solutions — Social, Security and Events.',
    tint: '#C9A24B',
  },
  {
    slug: 'confidentialite',
    eyebrow: 'DONNÉES PERSONNELLES',
    lines: ['Politique de', 'confidentialité.'],
    subtitle: 'SSE Solutions — Protection des données personnelles.',
    tint: '#C9A24B',
  },
];

function escapeXml(str) {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function buildOgSvg(page) {
  const titleLinesSvg = page.lines
    .map(
      (line, idx) =>
        `<text x="88" y="${235 + idx * 86}" font-family="Georgia, 'Times New Roman', serif" font-size="76" font-weight="400" fill="#EDEEEF" letter-spacing="-1">${escapeXml(
          line
        )}</text>`
    )
    .join('\n');

  const subtitleY = 235 + page.lines.length * 86 + 18;

  return `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="627" viewBox="0 0 1200 627">
  <defs>
    <radialGradient id="glow" cx="78%" cy="28%" r="55%">
      <stop offset="0%" stop-color="${page.tint}" stop-opacity="0.22" />
      <stop offset="100%" stop-color="#111416" stop-opacity="0" />
    </radialGradient>
  </defs>
  <rect width="1200" height="627" fill="#111416" />
  <rect width="1200" height="627" fill="url(#glow)" />
  <rect x="40" y="40" width="1120" height="547" fill="none" stroke="#2C3237" stroke-width="1" />
  <line x1="40" y1="40" x2="260" y2="40" stroke="${page.tint}" stroke-width="3" />

  <!-- Eyebrow -->
  <line x1="88" y1="122" x2="124" y2="122" stroke="${page.tint}" stroke-width="2" />
  <text x="140" y="127" font-family="sans-serif" font-size="16" font-weight="600" fill="${page.tint}" letter-spacing="3.5">${escapeXml(
    page.eyebrow
  )}</text>

  <!-- Title -->
  ${titleLinesSvg}

  <!-- Subtitle -->
  <text x="88" y="${subtitleY}" font-family="sans-serif" font-size="22" fill="#A3AAB1">${escapeXml(
    page.subtitle
  )}</text>

  <!-- Footer bar -->
  <line x1="88" y1="512" x2="1112" y2="512" stroke="#2C3237" stroke-width="1" />
  <text x="88" y="550" font-family="Georgia, serif" font-size="22" fill="#EDEEEF" letter-spacing="3">SSE</text>
  <line x1="152" y1="532" x2="152" y2="554" stroke="#C9A24B" stroke-width="1.5" />
  <text x="168" y="549" font-family="Georgia, serif" font-size="17" fill="#A3AAB1" letter-spacing="4">SOLUTIONS</text>
  <text x="1112" y="549" text-anchor="end" font-family="sans-serif" font-size="18" font-weight="600" fill="#C9A24B" letter-spacing="1.5">ssesolutions.fr</text>
</svg>`;
}

const FAVICON_SVG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64">
  <style>
    .bg { fill: #111416; }
    .border { stroke: #C9A24B; }
    .txt { fill: #EDEEEF; font-family: 'Marcellus', Georgia, serif; font-size: 23px; letter-spacing: 1.5px; }
    .rule { stroke: #C9A24B; }
    @media (prefers-color-scheme: light) {
      .bg { fill: #F6F4EF; }
      .border { stroke: #7A5C17; }
      .txt { fill: #15181A; }
      .rule { stroke: #7A5C17; }
    }
  </style>
  <rect class="bg" width="64" height="64" rx="4" />
  <rect class="border" x="2" y="2" width="60" height="60" rx="2" fill="none" stroke-width="1.5" />
  <text class="txt" x="32" y="38" text-anchor="middle">SSE</text>
  <line class="rule" x1="16" y1="46" x2="48" y2="46" stroke-width="1.5" />
</svg>
`;

const ICON_MASTER_SVG = `<svg xmlns="http://www.w3.org/2000/svg" width="512" height="512" viewBox="0 0 512 512">
  <rect width="512" height="512" rx="32" fill="#111416" />
  <rect x="20" y="20" width="472" height="472" rx="16" fill="none" stroke="#C9A24B" stroke-width="6" />
  <text x="256" y="295" text-anchor="middle" font-family="Georgia, 'Times New Roman', serif" font-size="176" fill="#EDEEEF" letter-spacing="12">SSE</text>
  <line x1="128" y1="356" x2="384" y2="356" stroke="#C9A24B" stroke-width="8" />
</svg>`;

const WEB_MANIFEST = {
  name: 'SSE Solutions — Social, Security and Events',
  short_name: 'SSE Solutions',
  description:
    'Accompagner les personnes (CC Care), protéger les lieux (CC Consulting), réussir les moments qui comptent (CC Events).',
  start_url: '/',
  display: 'standalone',
  background_color: '#111416',
  theme_color: '#111416',
  icons: [
    {
      src: '/favicon.svg',
      sizes: 'any',
      type: 'image/svg+xml',
    },
    {
      src: '/apple-touch-icon.png',
      sizes: '180x180',
      type: 'image/png',
    },
    {
      src: '/icon-512.png',
      sizes: '512x512',
      type: 'image/png',
    },
  ],
};

async function run() {
  const ogDir = path.resolve('public/og');
  await fs.mkdir(ogDir, { recursive: true });

  for (const page of OG_PAGES) {
    const svg = buildOgSvg(page);
    const outPath = path.join(ogDir, `${page.slug}.png`);
    await sharp(Buffer.from(svg)).png({ quality: 90, compressionLevel: 9 }).toFile(outPath);
    console.log(`Generated OG 1200x627: public/og/${page.slug}.png`);
  }

  await fs.writeFile(path.resolve('public/favicon.svg'), FAVICON_SVG, 'utf8');
  await sharp(Buffer.from(ICON_MASTER_SVG))
    .resize(180, 180)
    .png({ compressionLevel: 9 })
    .toFile(path.resolve('public/apple-touch-icon.png'));
  await sharp(Buffer.from(ICON_MASTER_SVG))
    .resize(512, 512)
    .png({ compressionLevel: 9 })
    .toFile(path.resolve('public/icon-512.png'));
  await fs.writeFile(
    path.resolve('public/site.webmanifest'),
    JSON.stringify(WEB_MANIFEST, null, 2),
    'utf8'
  );
  console.log('Generated public/favicon.svg, apple-touch-icon.png, icon-512.png, site.webmanifest');
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
