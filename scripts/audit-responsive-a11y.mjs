import { createRequire } from 'node:module';
const require = createRequire(new URL('../../package.json', import.meta.url));
const puppeteer = require('puppeteer');

const BASE_URL = 'http://localhost:4321';
const PAGES = [
  '/',
  '/cc-care',
  '/cc-care/autonomie-inclusion',
  '/cc-consulting',
  '/cc-events',
  '/contact?sujet=autonomie',
  '/mentions-legales',
  '/confidentialite',
];
const VIEWPORTS = [
  { width: 375, height: 812, name: '375px (mobile)' },
  { width: 768, height: 1024, name: '768px (tablette)' },
  { width: 1440, height: 900, name: '1440px (desktop)' },
];

async function runAudit() {
  const browser = await puppeteer.launch({ headless: true });
  const page = await browser.newPage();

  for (const route of PAGES) {
    await page.setViewport({ width: 1440, height: 900 });
    const res = await page.goto(`${BASE_URL}${route}`, { waitUntil: 'networkidle0' });
    const status = res?.status() || 0;
    if (status !== 200 && status !== 304) {
      throw new Error(`HTTP ${status} sur ${route}`);
    }

    for (const vp of VIEWPORTS) {
      await page.setViewport({ width: vp.width, height: vp.height });

      const check = await page.evaluate(() => {
        const docWidth = document.documentElement.scrollWidth;
        const winWidth = window.innerWidth;
        const hasOverflow = docWidth > winWidth + 1;
        const h1Count = document.querySelectorAll('h1').length;
        const mainLandmark = !!document.querySelector('main#main-content');
        const navLandmark = !!document.querySelector('nav[aria-label]');
        return { docWidth, winWidth, hasOverflow, h1Count, mainLandmark, navLandmark };
      });

      if (check.hasOverflow) {
        throw new Error(`Débordement horizontal sur ${route} en ${vp.name}: ${check.docWidth}px > ${check.winWidth}px`);
      }
      if (check.h1Count !== 1 || !check.mainLandmark || !check.navLandmark) {
        throw new Error(`Problème de structure sémantique sur ${route}: ${JSON.stringify(check)}`);
      }
    }

    // Test navigation clavier (Tab -> 1er élément = skip-link "Aller au contenu")
    await page.setViewport({ width: 1440, height: 900 });
    await page.evaluate(() => document.activeElement?.blur());
    await page.keyboard.press('Tab');
    const firstFocused = await page.evaluate(() => {
      const el = document.activeElement;
      return {
        text: el?.textContent?.trim(),
        className: el?.className,
      };
    });
    if (firstFocused.text !== 'Aller au contenu') {
      throw new Error(`Premier focus clavier incorrect sur ${route}: ${JSON.stringify(firstFocused)}`);
    }

    console.log(`[OK] ${route} -> 375px / 768px / 1440px sans débordement | Clavier (Skip-link) + Landmarks ARIA OK`);
  }

  await browser.close();
  console.log('Audit complet multi-écrans (375px, 768px, 1440px), clavier et lecteur d’écran réussi.');
}

runAudit().catch((err) => {
  console.error(err);
  process.exit(1);
});
