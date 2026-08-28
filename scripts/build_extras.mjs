import sharp from 'sharp';
import fs from 'node:fs/promises';
import path from 'node:path';

const SP = process.argv[2], ROOT = process.argv[3];
const L = JSON.parse(await fs.readFile(path.join(SP, 'lockups.json'), 'utf8'));
const pick = (variant, color, pad = 'normal') =>
  L.find(e => e.variant === variant && e.color === color)[pad];


const write = async (p, b) => { await fs.mkdir(path.dirname(p), { recursive: true }); await fs.writeFile(p, b); };

/** Composite `svg` (rendered to `markW` px wide) centred on a `w`x`h` canvas. */
async function plate(svg, w, h, markW, bg) {
  const mark = await sharp(Buffer.from(svg), { density: 900 }).resize({ width: Math.round(markW) }).png().toBuffer();
  const mm = await sharp(mark).metadata();
  const base = bg
    ? sharp({ create: { width: w, height: h, channels: 4, background: bg } })
    : sharp({ create: { width: w, height: h, channels: 4, background: { r: 0, g: 0, b: 0, alpha: 0 } } });
  return base.composite([{
    input: mark,
    left: Math.round((w - mm.width) / 2),
    top:  Math.round((h - mm.height) / 2),
  }]).png({ compressionLevel: 9 }).toBuffer();
}

// ── Icons ──────────────────────────────────────────────────────────────
// Default is the brand mark, Monochrome is the single-colour fallback.
// Both ship on transparency; Apple must be opaque.
await write(path.join(ROOT, 'Logos/Favicon/Default.png'),
  await plate(pick('Brand Symbol', 'red'), 512, 512, 512, null));
await write(path.join(ROOT, 'Logos/Favicon/Monochrome.png'),
  await plate(pick('Brand Symbol', 'black'), 512, 512, 512, null));
await write(path.join(ROOT, 'Logos/Favicon/Apple.png'),
  await plate(pick('Brand Symbol', 'white'), 180, 180, 180 * 0.6, { r: 255, g: 64, b: 22, alpha: 1 }));

console.log('icons written');
