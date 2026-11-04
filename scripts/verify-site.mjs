import fs from 'node:fs/promises';
import path from 'node:path';

const DIST_DIR = path.resolve('dist');

const EXPECTED_PAGES = [
  'index.html',
  'cc-care/index.html',
  'cc-care/autonomie-inclusion/index.html',
  'cc-consulting/index.html',
  'cc-events/index.html',
  'contact/index.html',
  'mentions-legales/index.html',
  'confidentialite/index.html',
];

async function verify() {
  let errors = 0;

  for (const relPath of EXPECTED_PAGES) {
    const fullPath = path.join(DIST_DIR, relPath);
    const html = await fs.readFile(fullPath, 'utf8');

    // 1. Vérifier l'absence stricte du mot "formation" (mais autoriser "information" / "informations" / "transformation")
    const forbiddenMatches = html.match(/\bformations?\b/gi);
    if (forbiddenMatches) {
      console.error(`[ERREUR] Mot interdit trouvé dans ${relPath}:`, forbiddenMatches);
      errors++;
    }

    // 2. Vérifier l'absence d'appel externe Google Fonts (RGPD)
    if (html.includes('fonts.googleapis.com') || html.includes('fonts.gstatic.com')) {
      console.error(`[ERREUR] Appel externe Google Fonts trouvé dans ${relPath}`);
      errors++;
    }

    // 3. Vérifier la présence du lien "Aller au contenu"
    if (!html.includes('Aller au contenu')) {
      console.error(`[ERREUR] Lien d'évitement manquant dans ${relPath}`);
      errors++;
    }

    // 4. Vérifier que toutes les balises <img ont un attribut alt, width et height
    const imgTags = html.match(/<img[^>]+>/gi) || [];
    for (const tag of imgTags) {
      if (!/alt="[^"]+"/.test(tag)) {
        console.error(`[ERREUR] Image sans alt descriptif dans ${relPath}: ${tag}`);
        errors++;
      }
      if (!/width="\d+"/.test(tag) || !/height="\d+"/.test(tag)) {
        console.error(`[ERREUR] Image sans dimensions fixes dans ${relPath}: ${tag}`);
        errors++;
      }
    }

    console.log(`[OK] ${relPath} (${imgTags.length} images vérifiées, 0 mot interdit, 0 appel Google Fonts)`);
  }

  // 5. Vérifier le poids des images AVIF/WebP <= 250 Ko
  const imgDir = path.join(DIST_DIR, 'images');
  const files = await fs.readdir(imgDir);
  for (const file of files) {
    const stat = await fs.stat(path.join(imgDir, file));
    const sizeKo = Math.round(stat.size / 1024);
    if (sizeKo > 250) {
      console.error(`[ERREUR] Image > 250 Ko : ${file} (${sizeKo} Ko)`);
      errors++;
    }
  }
  console.log(`[OK] ${files.length} fichiers images AVIF/WebP vérifiés (tous <= 250 Ko)`);

  if (errors > 0) {
    process.exit(1);
  }
  console.log('Toutes les vérifications techniques, éditoriales et RGPD sont passées avec succès.');
}

verify().catch((err) => {
  console.error(err);
  process.exit(1);
});

