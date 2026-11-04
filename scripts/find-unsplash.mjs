import fs from 'node:fs/promises';

const queries = [
  { id: 1, slot: 'Accueil · fond du hero', query: 'concrete architecture minimal shadow' },
  { id: 2, slot: 'Accueil · ligne CC Care', query: 'hands helping paperwork table' },
  { id: 3, slot: 'Accueil · ligne CC Consulting', query: 'emergency exit corridor modern building' },
  { id: 4, slot: 'Accueil · ligne CC Events', query: 'conference stage lights crowd' },
  { id: 5, slot: 'Accueil · section Programme', query: 'person using laptop at home table' },
  { id: 6, slot: 'CC Care · hero', query: 'two people talking office table calm' },
  { id: 7, slot: 'CC Care · missions', query: 'writing notebook pen desk hands' },
  { id: 8, slot: 'Autonomie & Inclusion · hero', query: 'using digital tablet home daylight' },
  { id: 9, slot: 'Autonomie & Inclusion · parcours', query: 'hand holding house keys door' },
  { id: 10, slot: 'CC Consulting · hero', query: 'modern architecture glass facade dusk' },
  { id: 11, slot: 'CC Consulting · services', query: 'architectural blueprint plan desk' },
  { id: 12, slot: 'CC Events · hero', query: 'gala dinner hall warm lights' },
  { id: 13, slot: 'CC Events · services', query: 'event production backstage stage lighting' },
];

async function run() {
  const results = [];
  for (const item of queries) {
    const url = `https://unsplash.com/napi/search/photos?query=${encodeURIComponent(item.query)}&per_page=5&orientation=landscape`;
    const res = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/125.0.0.0'
      }
    });
    const data = await res.json();
    const candidates = (data.results || [])
      .filter(p => !p.plus && !p.premium)
      .slice(0, 3)
      .map(p => ({
        photoId: p.id,
        slug: p.slug,
        width: p.width,
        height: p.height,
        description: p.description || p.alt_description,
        photographer: p.user?.name,
        pageUrl: p.links?.html,
        rawUrl: p.urls?.raw
      }));
    results.push({ ...item, candidates });
  }
  await fs.writeFile('scripts/unsplash-candidates.json', JSON.stringify(results, null, 2));
  console.log('Saved scripts/unsplash-candidates.json');
}

run().catch(console.error);

