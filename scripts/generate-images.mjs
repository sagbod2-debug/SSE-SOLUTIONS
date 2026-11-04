import fs from 'node:fs/promises';
import path from 'node:path';
import sharp from 'sharp';

const IMAGES = [
  {
    id: 1,
    slug: '01-hero-architecture',
    section: 'Accueil · fond du hero',
    subject: 'Architecture sobre, lignes et lumière rasante sur le béton',
    alt: 'Architecture minimaliste en béton brut éclairée par une lumière rasante, créant des lignes géométriques sobres',
    unsplashId: 'photo-1600585154340-be6161a56a0c',
    pageUrl: 'https://unsplash.com/photos/photo-1600585154340-be6161a56a0c',
    photographer: 'R ARCHITECTURE'
  },
  {
    id: 2,
    slug: '02-accueil-cc-care',
    section: 'Accueil · ligne CC Care',
    subject: 'Accompagnement et écoute autour de documents sur une table',
    alt: 'Deux personnes assises autour d’une table examinant ensemble des documents administratifs dans un cadre calme',
    unsplashId: 'photo-1450101499163-c8848c66ca85',
    pageUrl: 'https://unsplash.com/photos/person-signing-on-white-printer-paper-beside-woman-about-to-touch-the-documents-Cy18IZKs4oA',
    photographer: 'Scott Graham'
  },
  {
    id: 3,
    slug: '03-accueil-cc-consulting',
    section: 'Accueil · ligne CC Consulting',
    subject: 'Perspective architecturale d’un couloir d’établissement recevant du public',
    alt: 'Couloir épuré et dégagé d’un établissement contemporain aux lignes sobres et éclairage maîtrisé',
    unsplashId: 'photo-1497366216548-37526070297c',
    pageUrl: 'https://unsplash.com/photos/empty-hallway-with-glass-walls-and-doors-6anudmpILw4',
    photographer: 'Israel Andrade'
  },
  {
    id: 4,
    slug: '04-accueil-cc-events',
    section: 'Accueil · ligne CC Events',
    subject: 'Grande salle d’événement sous les projecteurs, public de dos',
    alt: 'Grande salle de réception et scène éclairée lors d’un événement professionnel, public vu de dos',
    unsplashId: 'photo-1511578314322-379afb476865',
    pageUrl: 'https://unsplash.com/photos/people-sitting-on-gang-chairs-indoors-bzdhc5b3Bxs',
    photographer: 'ICSA'
  },
  {
    id: 5,
    slug: '05-accueil-programme',
    section: 'Accueil · section Programme Autonomie & Inclusion',
    subject: 'Adulte utilisant un ordinateur portable chez lui à la lumière naturelle',
    alt: 'Personne adulte utilisant un ordinateur portable sur une table en bois baignée de lumière naturelle',
    unsplashId: 'photo-1516321318423-f06f85e504b3',
    pageUrl: 'https://unsplash.com/photos/person-using-macbook-pro-npxXWgQ33ZQ',
    photographer: 'John Schnobrich'
  },
  {
    id: 6,
    slug: '06-cc-care-hero',
    section: 'CC Care · hero',
    subject: 'Entretien calme autour d’une table entre deux personnes',
    alt: 'Entretien d’accompagnement en face à face autour d’une table claire, mains et dossiers posés avec sobriété',
    unsplashId: 'photo-1573497620053-ea5300f94f21',
    pageUrl: 'https://unsplash.com/photos/two-women-talking-while-sitting-on-chair-wS73LE0GnKs',
    photographer: 'Amy Hirschi'
  },
  {
    id: 7,
    slug: '07-cc-care-missions',
    section: 'CC Care · missions',
    subject: 'Détail d’un dossier, d’un stylo et de notes sur un bureau',
    alt: 'Main prenant des notes au stylo sur un carnet à côté d’un dossier administratif ouvert',
    unsplashId: 'photo-1455390582262-044cdead277a',
    pageUrl: 'https://unsplash.com/photos/person-writing-on-white-paper-near-cup-f5_lfi2S-d4',
    photographer: 'Aaron Burden'
  },
  {
    id: 8,
    slug: '08-autonomie-hero',
    section: 'Autonomie & Inclusion · hero',
    subject: 'Personne consultant une tablette numérique dans un salon lumineux',
    alt: 'Personne tenant une tablette numérique chez elle à la lumière du jour, geste calme et assuré',
    unsplashId: 'photo-1544717305-2782549b5136',
    pageUrl: 'https://unsplash.com/photos/woman-holding-tablet-computer-while-standing-near-window-1K8pIbIrhkQ',
    photographer: 'Surface'
  },
  {
    id: 9,
    slug: '09-autonomie-parcours',
    section: 'Autonomie & Inclusion · parcours',
    subject: 'Gestes du quotidien et autonomie résidentielle',
    alt: 'Main tenant un trousseau de clés devant la porte d’un logement lumineux, symbole d’autonomie au quotidien',
    unsplashId: 'photo-1560518883-ce09059eeffa',
    pageUrl: 'https://unsplash.com/photos/person-holding-silver-key-and-brown-wooden-house-miniature-minimalist-photography-f7u5f5V5qBc',
    photographer: 'Tierra Mallorca'
  },
  {
    id: 10,
    slug: '10-cc-consulting-hero',
    section: 'CC Consulting · hero',
    subject: 'Façade architecturale contemporaine d’un établissement recevant du public',
    alt: 'Façade géométrique en verre et acier d’un bâtiment contemporain photographié au crépuscule',
    unsplashId: 'photo-1486406146926-c627a92ad1ab',
    pageUrl: 'https://unsplash.com/photos/low-angle-photography-of-high-rise-building-5U_28ojjgms',
    photographer: 'Sean Pollock'
  },
  {
    id: 11,
    slug: '11-cc-consulting-services',
    section: 'CC Consulting · services',
    subject: 'Plans techniques et documents de vérification sur une table',
    alt: 'Plans d’architecture et documents techniques posés sur une table de travail pour un audit de conformité',
    unsplashId: 'photo-1503387762-592deb58ef4e',
    pageUrl: 'https://unsplash.com/photos/architectural-plan-on-table-v9vII5gV8Lw',
    photographer: 'Daniel McCullough'
  },
  {
    id: 12,
    slug: '12-cc-events-hero',
    section: 'CC Events · hero plein écran',
    subject: 'Salle de gala et réception sous des lumières dorées',
    alt: 'Grande salle de réception habillée de lumières chaudes et dorées avant l’accueil des invités',
    unsplashId: 'photo-1519167758481-83f550bb49b3',
    pageUrl: 'https://unsplash.com/photos/Empty-banquet-hall-with-round-tables-and-warm-lighting-5r5554u5',
    photographer: 'Al Elmes'
  },
  {
    id: 13,
    slug: '13-cc-events-services',
    section: 'CC Events · services',
    subject: 'Coulisses et régie technique d’un grand événement',
    alt: 'Régie technique et préparation en coulisses d’un événement avec éclairages de scène en arrière-plan',
    unsplashId: 'photo-1492684223066-81342ee5ff30',
    pageUrl: 'https://unsplash.com/photos/people-gathering-on-concert-field-Y20JJ_ddy9M',
    photographer: 'Danny Howe'
  }
];

const OUT_DIR = path.resolve('public/images');
const LOGOS_SRC = path.resolve('assets/logos');
const LOGOS_DEST = path.resolve('public/logos');

async function encodeWithinBudget(inputBuffer, format, width = 2400, height = 1500, maxBytes = 245 * 1024) {
  let quality = format === 'avif' ? 52 : 68;
  while (quality >= 24) {
    let pipeline = sharp(inputBuffer)
      .resize(width, height, { fit: 'cover', position: 'attention' })
      .modulate({ saturation: 0.82, brightness: 0.96 }); // Tons froids/neutres, contraste doux

    const buf =
      format === 'avif'
        ? await pipeline.avif({ quality, effort: 4 }).toBuffer()
        : await pipeline.webp({ quality, effort: 5, smartSubsample: true }).toBuffer();

    if (buf.length <= maxBytes || quality <= 28) {
      return { buf, quality, sizeKB: Math.round(buf.length / 1024) };
    }
    quality -= 6;
  }
}

async function run() {
  await fs.mkdir(OUT_DIR, { recursive: true });
  await fs.mkdir(LOGOS_DEST, { recursive: true });
  await fs.mkdir(path.resolve('src/data'), { recursive: true });

  // Copy official logos unchanged into public/logos
  const logoFiles = await fs.readdir(LOGOS_SRC);
  for (const file of logoFiles) {
    await fs.copyFile(path.join(LOGOS_SRC, file), path.join(LOGOS_DEST, file));
  }
  console.log(`Copied ${logoFiles.length} official logos to public/logos/`);

  const credits = [];

  for (const item of IMAGES) {
    const rawUrl = `https://images.unsplash.com/${item.unsplashId}?auto=format&fit=crop&w=2400&q=85`;
    console.log(`Fetching #${item.id}: ${item.slug}...`);
    const res = await fetch(rawUrl);
    if (!res.ok) {
      throw new Error(`Failed to fetch ${rawUrl}: ${res.status}`);
    }
    const inputBuffer = Buffer.from(await res.arrayBuffer());

    const avifRes = await encodeWithinBudget(inputBuffer, 'avif', 2400, 1500);
    const webpRes = await encodeWithinBudget(inputBuffer, 'webp', 2400, 1500);

    const avifPath = path.join(OUT_DIR, `${item.slug}.avif`);
    const webpPath = path.join(OUT_DIR, `${item.slug}.webp`);

    await fs.writeFile(avifPath, avifRes.buf);
    await fs.writeFile(webpPath, webpRes.buf);

    console.log(
      `  -> ${item.slug}.avif (${avifRes.sizeKB} Ko, q=${avifRes.quality}) | ${item.slug}.webp (${webpRes.sizeKB} Ko, q=${webpRes.quality})`
    );

    credits.push({
      id: item.id,
      slug: item.slug,
      section: item.section,
      subject: item.subject,
      alt: item.alt,
      photographer: item.photographer,
      source: 'Unsplash',
      url: `https://unsplash.com/photos/${item.unsplashId.replace('photo-', '')}`,
      directUnsplashUrl: `https://images.unsplash.com/${item.unsplashId}`,
      width: 2400,
      height: 1500,
      avifSizeKo: avifRes.sizeKB,
      webpSizeKo: webpRes.sizeKB,
      status: 'Provisoire (sélection Unsplash libre de droits, à valider par Jean-David)'
    });
  }

  await fs.writeFile(path.resolve('credits.json'), JSON.stringify(credits, null, 2), 'utf8');
  await fs.writeFile(path.resolve('public/credits.json'), JSON.stringify(credits, null, 2), 'utf8');
  await fs.writeFile(path.resolve('src/data/credits.json'), JSON.stringify(credits, null, 2), 'utf8');
  console.log('Generated credits.json and all 13 AVIF + WebP images (2400x1500, <= 250 Ko).');
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});

