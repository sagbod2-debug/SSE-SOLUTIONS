import fs from 'node:fs';
import fsp from 'node:fs/promises';
import path from 'node:path';
import git from 'isomorphic-git';

const dir = process.cwd();
const IGNORED = new Set(['node_modules', 'dist', '.astro', '.vercel', '.netlify', '.git']);

async function walkFiles(currentDir, baseDir = dir) {
  const entries = await fsp.readdir(currentDir, { withFileTypes: true });
  let results = [];
  for (const entry of entries) {
    if (IGNORED.has(entry.name) || entry.name.startsWith('.env')) continue;
    const full = path.join(currentDir, entry.name);
    if (entry.isDirectory()) {
      results = results.concat(await walkFiles(full, baseDir));
    } else {
      results.push(path.relative(baseDir, full).replace(/\\/g, '/'));
    }
  }
  return results;
}

async function run() {
  const msg = process.argv.slice(2).join(' ') || 'chore: mise à jour';
  const gitDir = path.join(dir, '.git');
  if (!fs.existsSync(gitDir)) {
    await git.init({ fs, dir, defaultBranch: 'main' });
  }
  const files = await walkFiles(dir);
  for (const filepath of files) {
    await git.add({ fs, dir, filepath });
  }
  const sha = await git.commit({
    fs,
    dir,
    message: msg,
    author: {
      name: 'Antigravity',
      email: 'dev@ssesolutions.fr',
    },
  });
  console.log(`[COMMIT ${sha.slice(0, 7)}] ${msg}`);
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});

