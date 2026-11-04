import fs from 'node:fs/promises';
import path from 'node:path';
import crypto from 'node:crypto';

const DIST_DIR = path.resolve('dist');
const STATE_DIR = path.resolve('.netlify');
const STATE_FILE = path.join(STATE_DIR, 'state.json');

async function getAllFiles(dir, baseDir = dir) {
  const entries = await fs.readdir(dir, { withFileTypes: true });
  let files = [];
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      files = files.concat(await getAllFiles(fullPath, baseDir));
    } else {
      const relPath = '/' + path.relative(baseDir, fullPath).replace(/\\/g, '/');
      const content = await fs.readFile(fullPath);
      const sha1 = crypto.createHash('sha1').update(content).digest('hex');
      files.push({ relPath, fullPath, sha1, content });
    }
  }
  return files;
}

async function deploy() {
  // Ensure _headers and _redirects are in dist/
  await fs.copyFile(path.resolve('public/_headers'), path.join(DIST_DIR, '_headers'));
  await fs.copyFile(path.resolve('public/_redirects'), path.join(DIST_DIR, '_redirects'));

  const configPath = path.join(process.env.APPDATA || '', 'netlify', 'Config', 'config.json');
  const rawConfig = JSON.parse(await fs.readFile(configPath, 'utf8'));
  const userId = rawConfig.userId;
  const token = rawConfig.users?.[userId]?.auth?.token;

  if (!token) {
    throw new Error('Aucun jeton Netlify CLI actif trouvé. Exécutez `netlify login`.');
  }

  const headers = {
    Authorization: `Bearer ${token}`,
    'Content-Type': 'application/json',
  };

  let siteId = null;
  try {
    const state = JSON.parse(await fs.readFile(STATE_FILE, 'utf8'));
    siteId = state.siteId;
  } catch {
    // Pas encore lié
  }

  if (!siteId) {
    // Chercher si un site sse-solutions existe déjà ou en créer un
    const preferredNames = ['sse-solutions', 'sse-solutions-fr', 'sse-solutions-essonne'];
    for (const name of preferredNames) {
      const createRes = await fetch('https://api.netlify.com/api/v1/sites', {
        method: 'POST',
        headers,
        body: JSON.stringify({ name }),
      });
      if (createRes.ok) {
        const siteData = await createRes.json();
        siteId = siteData.id;
        console.log(`Site Netlify créé : ${siteData.ssl_url || siteData.url} (ID: ${siteId})`);
        break;
      }
    }

    if (!siteId) {
      const createRes = await fetch('https://api.netlify.com/api/v1/sites', {
        method: 'POST',
        headers,
        body: JSON.stringify({}),
      });
      if (!createRes.ok) {
        throw new Error(`Erreur création site Netlify: ${createRes.status} ${await createRes.text()}`);
      }
      const siteData = await createRes.json();
      siteId = siteData.id;
      console.log(`Site Netlify créé : ${siteData.ssl_url || siteData.url} (ID: ${siteId})`);
    }

    await fs.mkdir(STATE_DIR, { recursive: true });
    await fs.writeFile(STATE_FILE, JSON.stringify({ siteId }, null, 2), 'utf8');
  }

  const allFiles = await getAllFiles(DIST_DIR);
  const filesMap = {};
  for (const f of allFiles) {
    filesMap[f.relPath] = f.sha1;
  }

  console.log(`Création du déploiement en production (${allFiles.length} fichiers)...`);
  const deployRes = await fetch(`https://api.netlify.com/api/v1/sites/${siteId}/deploys`, {
    method: 'POST',
    headers,
    body: JSON.stringify({
      files: filesMap,
      draft: false,
    }),
  });

  if (!deployRes.ok) {
    throw new Error(`Erreur init deploy: ${deployRes.status} ${await deployRes.text()}`);
  }

  const deployData = await deployRes.json();
  const deployId = deployData.id;
  const required = new Set(deployData.required || []);

  console.log(`Envoi de ${required.size} fichiers requis vers Netlify...`);
  for (const file of allFiles) {
    if (!required.has(file.sha1)) continue;
    const encodedPath = file.relPath
      .split('/')
      .map((seg) => encodeURIComponent(seg))
      .join('/');
    const uploadRes = await fetch(
      `https://api.netlify.com/api/v1/deploys/${deployId}/files${encodedPath}`,
      {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/octet-stream',
        },
        body: file.content,
      }
    );
    if (!uploadRes.ok) {
      throw new Error(`Échec upload ${file.relPath}: ${uploadRes.status}`);
    }
  }

  // Vérifier l'état final du déploiement
  const finalRes = await fetch(`https://api.netlify.com/api/v1/deploys/${deployId}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  const finalData = await finalRes.json();

  console.log('--- DÉPLOIEMENT NETLIFY TERMINÉ ---');
  console.log(`URL de production : ${finalData.ssl_url || finalData.url}`);
  console.log(`URL de déploiement : ${finalData.deploy_ssl_url || finalData.deploy_url}`);
  console.log(`État : ${finalData.state}`);
}

deploy().catch((err) => {
  console.error(err);
  process.exit(1);
});

