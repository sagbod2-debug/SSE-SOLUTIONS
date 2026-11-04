import fs from 'node:fs/promises';
import path from 'node:path';
import crypto from 'node:crypto';

const DIST_DIR = path.resolve('dist');

async function getAllFiles(dir, baseDir = dir) {
  const entries = await fs.readdir(dir, { withFileTypes: true });
  let files = [];
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      files = files.concat(await getAllFiles(fullPath, baseDir));
    } else {
      const relPath = path.relative(baseDir, fullPath).replace(/\\/g, '/');
      if (relPath === '_headers' || relPath === '_redirects') continue;
      const content = await fs.readFile(fullPath);
      const sha = crypto.createHash('sha1').update(content).digest('hex');
      files.push({
        file: relPath,
        sha,
        size: content.length,
        content,
      });
    }
  }
  return files;
}

async function deployVercel() {
  const authPath = path.join(
    process.env.APPDATA || '',
    'com.vercel.cli',
    'Data',
    'auth.json'
  );
  const authData = JSON.parse(await fs.readFile(authPath, 'utf8'));
  const token = authData.token;
  if (!token) {
    throw new Error('Aucun jeton Vercel trouvé dans auth.json.');
  }

  let teamId = null;
  try {
    const configPath = path.join(
      process.env.APPDATA || '',
      'com.vercel.cli',
      'Data',
      'config.json'
    );
    const configData = JSON.parse(await fs.readFile(configPath, 'utf8'));
    teamId = configData.currentTeam || null;
  } catch {
    // Pas d'équipe par défaut
  }

  const teamQuery = teamId ? `?teamId=${encodeURIComponent(teamId)}` : '';

  const allFiles = await getAllFiles(DIST_DIR);
  console.log(`Téléversement de ${allFiles.length} fichiers vers Vercel...`);

  // Upload files in parallel batches of 8
  const batchSize = 8;
  for (let i = 0; i < allFiles.length; i += batchSize) {
    const batch = allFiles.slice(i, i + batchSize);
    await Promise.all(
      batch.map(async (f) => {
        const res = await fetch(`https://api.vercel.com/v2/files${teamQuery}`, {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/octet-stream',
            'x-vercel-digest': f.sha,
            'Content-Length': String(f.size),
          },
          body: f.content,
        });
        if (!res.ok && res.status !== 409) {
          throw new Error(`Erreur upload ${f.file}: ${res.status} ${await res.text()}`);
        }
      })
    );
  }

  console.log('Création du déploiement Vercel en production...');
  const deployBody = {
    name: 'sse-solutions',
    target: 'production',
    files: allFiles.map((f) => ({
      file: f.file,
      sha: f.sha,
      size: f.size,
    })),
    projectSettings: {
      framework: null,
    },
    cleanUrls: true,
    trailingSlash: false,
  };

  const deployRes = await fetch(`https://api.vercel.com/v13/deployments${teamQuery}`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(deployBody),
  });

  if (!deployRes.ok) {
    throw new Error(`Erreur déploiement Vercel: ${deployRes.status} ${await deployRes.text()}`);
  }

  const deployData = await deployRes.json();
  const deployId = deployData.id;

  // Attendre l'état READY
  let state = deployData.readyState || deployData.status;
  let finalData = deployData;
  for (let attempt = 0; attempt < 20 && state !== 'READY' && state !== 'ERROR'; attempt++) {
    await new Promise((r) => setTimeout(r, 1500));
    const checkRes = await fetch(
      `https://api.vercel.com/v13/deployments/${deployId}${teamQuery}`,
      {
        headers: { Authorization: `Bearer ${token}` },
      }
    );
    if (checkRes.ok) {
      finalData = await checkRes.json();
      state = finalData.readyState || finalData.status;
    }
  }

  const aliases = finalData.alias || [];
  const mainUrl = aliases.length > 0 ? `https://${aliases[0]}` : `https://${finalData.url}`;

  console.log('--- DÉPLOIEMENT VERCEL TERMINÉ ---');
  console.log(`État : ${state}`);
  console.log(`URL principale (Production) : ${mainUrl}`);
  console.log(`URL de déploiement : https://${finalData.url}`);
  if (aliases.length > 0) {
    console.log(`Alias : ${aliases.map((a) => `https://${a}`).join(', ')}`);
  }
}

deployVercel().catch((err) => {
  console.error(err);
  process.exit(1);
});

