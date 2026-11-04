import fs from 'node:fs/promises';
import path from 'node:path';
import sharp from 'sharp';

const OG_PAGES = [
  {
    slug: 'index',
    eyebrow: 'SSE SOLUTIONS · ESSONNE',
    lines: ['Social.', 'Sécurité.', 'Événements.'],
    subtitle: 'Un seul partenaire pour les personnes, les lieux et les grands moments.',
    tint: '#4FD1A5',
  },
  {
    slug: 'cc-care',
    eyebrow: 'CC CARE · SOCIAL',
    lines: ['Accompagner.', 'Simplifier.', 'Rendre autonome.'],
    subtitle: 'Missions d’accompagnement social en établissement de santé, structure sociale et entreprise.',
    tint: '#4FD1A5',
  },
  {
    slug: 'cc-care-autonomie-inclusion',
    eyebrow: 'CC CARE · PROGRAMME EN LIGNE',
    lines: ['Autonomie &', 'Inclusion.'],
    subtitle: '35 modules · 244 ateliers · Français courant et version FALC.',
    tint: '#4FD6E8',
  },
  {
    slug: 'cc-consulting',
    eyebrow: 'CC CONSULTING · SÉCURITÉ',
    lines: ['Conformer.', 'Préparer.', 'Sécuriser.'],
    subtitle: 'Mise en conformité incendie des ERP et préparation aux commissions de sécurité.',
    tint: '#FF6B75',
  },
  {
    slug: 'cc-events',
    eyebrow: 'CC EVENTS · ÉVÉNEMENTIEL',
    lines: ['Imaginer.', 'Coordonner.', 'Réussir.'],
    subtitle: 'Organisation de grands événements et coordination des équipes sur le terrain.',
    tint: '#A99BFF',
  },
  {
    slug: 'contact',
    eyebrow: 'CONTACT · SSE SOLUTIONS',
    lines: ['Parlons de', 'votre projet.'],
    subtitle: 'Réponse sous 48 heures ouvrées · Boussy-Saint-Antoine, Essonne.',
    tint: '#F4F6FA',
  },
  {
    slug: 'mentions-legales',
    eyebrow: 'INFORMATIONS LÉGALES',
    lines: ['Mentions', 'légales.'],
    subtitle: 'SSE Solutions — Social, Security and Events.',
    tint: '#F4F6FA',
  },
  {
    slug: 'confidentialite',
    eyebrow: 'DONNÉES PERSONNELLES',
    lines: ['Politique de', 'confidentialité.'],
    subtitle: 'SSE Solutions — Protection des données personnelles.',
    tint: '#F4F6FA',
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
        `<text x="88" y="${235 + idx * 84}" font-family="'Hanken Grotesk', -apple-system, sans-serif" font-size="74" font-weight="500" fill="#F4F6FA" letter-spacing="-2">${escapeXml(
          line
        )}</text>`
    )
    .join('\n');

  const subtitleY = 235 + page.lines.length * 84 + 18;

  return `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="627" viewBox="0 0 1200 627">
  <defs>
    <radialGradient id="glow" cx="78%" cy="28%" r="55%">
      <stop offset="0%" stop-color="${page.tint}" stop-opacity="0.22" />
      <stop offset="100%" stop-color="#0A0B0F" stop-opacity="0" />
    </radialGradient>
  </defs>
  <rect width="1200" height="627" fill="#0A0B0F" />
  <rect width="1200" height="627" fill="url(#glow)" />
  <rect x="40" y="40" width="1120" height="547" rx="24" fill="none" stroke="#14161C" stroke-width="2" />
  <line x1="64" y1="40" x2="260" y2="40" stroke="${page.tint}" stroke-width="3" />

  <!-- Eyebrow -->
  <line x1="88" y1="122" x2="124" y2="122" stroke="${page.tint}" stroke-width="2" />
  <text x="140" y="127" font-family="'Hanken Grotesk', sans-serif" font-size="16" font-weight="600" fill="${page.tint}" letter-spacing="3.5">${escapeXml(
    page.eyebrow
  )}</text>

  <!-- Title -->
  ${titleLinesSvg}

  <!-- Subtitle -->
  <text x="88" y="${subtitleY}" font-family="'Hanken Grotesk', sans-serif" font-size="22" fill="#A1A8B5">${escapeXml(
    page.subtitle
  )}</text>

  <!-- Footer bar -->
  <line x1="88" y1="512" x2="1112" y2="512" stroke="#14161C" stroke-width="1.5" />
  <text x="88" y="550" font-family="'Hanken Grotesk', sans-serif" font-size="22" font-weight="600" fill="#F4F6FA" letter-spacing="1">SSE</text>
  <line x1="146" y1="532" x2="146" y2="554" stroke="${page.tint}" stroke-width="2" />
  <text x="162" y="549" font-family="'Hanken Grotesk', sans-serif" font-size="18" font-weight="500" fill="#A1A8B5" letter-spacing="2">SOLUTIONS</text>
  <text x="1112" y="549" text-anchor="end" font-family="'Hanken Grotesk', sans-serif" font-size="18" font-weight="600" fill="${page.tint}" letter-spacing="1">ssesolutions.fr</text>
</svg>`;
}

const FAVICON_SVG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64">
  <style>
    .bg { fill: #FFFFFF; }
    .border { stroke: #0B0D12; }
    .txt { fill: #0B0D12; font-family: 'Hanken Grotesk', -apple-system, sans-serif; font-weight: 600; font-size: 22px; letter-spacing: -0.5px; }
    .rule { stroke: #0B7A5A; }
    @media (prefers-color-scheme: dark) {
      .bg { fill: #0A0B0F; }
      .border { stroke: #F4F6FA; }
      .txt { fill: #F4F6FA; }
      .rule { stroke: #4FD1A5; }
    }
  </style>
  <rect class="bg" width="64" height="64" rx="12" />
  <rect class="border" x="2" y="2" width="60" height="60" rx="10" fill="none" stroke-width="1.5" stroke-opacity="0.22" />
  <text class="txt" x="32" y="38" text-anchor="middle">SSE</text>
  <line class="rule" x1="18" y1="46" x2="46" y2="46" stroke-width="2" stroke-linecap="round" />
</svg>
`;

const ICON_MASTER_SVG = `<svg xmlns="http://www.w3.org/2000/svg" width="512" height="512" viewBox="0 0 512 512">
  <rect width="512" height="512" rx="96" fill="#0A0B0F" />
  <rect x="20" y="20" width="472" height="472" rx="80" fill="none" stroke="#14161C" stroke-width="6" />
  <text x="256" y="295" text-anchor="middle" font-family="'Hanken Grotesk', -apple-system, sans-serif" font-weight="600" font-size="172" fill="#F4F6FA" letter-spacing="-4">SSE</text>
  <line x1="140" y1="356" x2="372" y2="356" stroke="#4FD1A5" stroke-width="10" stroke-linecap="round" />
</svg>`;

const WEB_MANIFEST = {
  name: 'SSE Solutions — Social, Security and Events',
  short_name: 'SSE Solutions',
  description:
    'Accompagner les personnes (CC Care), protéger les lieux (CC Consulting), réussir les moments qui comptent (CC Events).',
  start_url: '/',
  display: 'standalone',
  background_color: '#FFFFFF',
  theme_color: '#FFFFFF',
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
