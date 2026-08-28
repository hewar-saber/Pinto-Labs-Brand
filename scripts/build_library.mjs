import sharp from 'sharp';
import fs from 'node:fs/promises';
import path from 'node:path';

const SP   = process.argv[2];
const ROOT = process.argv[3];
const SIZES = [256, 512, 1024, 2048];

const entries = JSON.parse(await fs.readFile(path.join(SP, 'lockups.json'), 'utf8'));

const write = async (p, buf) => {
  await fs.mkdir(path.dirname(p), { recursive: true });
  await fs.writeFile(p, buf);
};

// Rasterise an SVG string to a PNG of exactly `w` px wide, height derived
// from the viewBox aspect ratio (this is what "size" means in the naming
// convention: the nominal WIDTH of the export).
const raster = (svg, w) =>
  sharp(Buffer.from(svg), { density: 900 }).resize({ width: w }).png({ compressionLevel: 9 }).toBuffer();

let n = 0;
for (const e of entries) {
  for (const pad of ['Normal', 'Padded']) {
    const svg = e[pad.toLowerCase()];
    const base = path.join(ROOT, 'Logos', e.variant);
    await write(path.join(base, 'SVG', pad, `${e.color}.svg`), svg);
    n++;
    for (const s of SIZES) {
      await write(path.join(base, 'PNG', pad, String(s), `${e.color}.png`), await raster(svg, s));
      n++;
    }
  }
}
console.log(`logo files: ${n}`);
