import fs from 'node:fs/promises';
import path from 'node:path';
import sharp from 'sharp';

const SRC_DIR = path.resolve('public/images');
const DEST_DIR = path.resolve('src/assets/images');
const OUT_JSON = path.resolve('src/data/image-placeholders.json');

async function run() {
  await fs.mkdir(DEST_DIR, { recursive: true });
  const files = (await fs.readdir(SRC_DIR)).filter((f) => f.endsWith('.webp'));
  const placeholders = {};

  for (const file of files) {
    const slug = file.replace(/\.webp$/, '');
    const srcPath = path.join(SRC_DIR, file);
    const destPath = path.join(DEST_DIR, file);
    await fs.copyFile(srcPath, destPath);

    // Couleur dominante (1x1 pixel)
    const { data } = await sharp(srcPath)
      .resize(1, 1, { fit: 'cover' })
      .raw()
      .toBuffer({ resolveWithObject: true });
    const r = data[0].toString(16).padStart(2, '0');
    const g = data[1].toString(16).padStart(2, '0');
    const b = data[2].toString(16).padStart(2, '0');
    const dominantColor = `#${r}${g}${b}`;

    // Version floue de 20 px de large en data URI
    const blurBuf = await sharp(srcPath)
      .resize(20, 13, { fit: 'cover' })
      .blur(2)
      .webp({ quality: 55 })
      .toBuffer();
    const blurDataUrl = `data:image/webp;base64,${blurBuf.toString('base64')}`;

    placeholders[slug] = {
      dominantColor,
      blurDataUrl,
    };
  }

  await fs.writeFile(OUT_JSON, JSON.stringify(placeholders, null, 2), 'utf8');
  console.log(`Prepared ${files.length} images in src/assets/images and generated ${OUT_JSON}`);
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});

