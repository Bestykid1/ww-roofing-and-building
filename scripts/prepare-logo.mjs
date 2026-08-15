/**
 * Crops the supplied logo render to the mark (triangle + W&W letters),
 * dropping the near-invisible strapline row and surplus black padding.
 * The output is used with mix-blend-mode: screen on dark surfaces, so the
 * black background disappears into the header colour. Run: node scripts/prepare-logo.mjs
 */
import { mkdir } from 'node:fs/promises';
import path from 'node:path';
import sharp from 'sharp';

const ROOT = path.resolve(import.meta.dirname, '..');
const INPUT = path.join(ROOT, 'Logo', 'Logo.png');
const OUT_DIR = path.join(ROOT, 'src', 'assets', 'logo');
await mkdir(OUT_DIR, { recursive: true });

const img = sharp(INPUT);
const { width, height } = await img.metadata();

// Mark occupies the central band; strapline text sits below y ~0.85.
const region = {
  left: Math.round(0.04 * width),
  top: Math.round(0.0 * height),
  width: Math.round(0.92 * width),
  height: Math.round(0.85 * height),
};

await img
  .extract(region)
  .png({ compressionLevel: 9 })
  .toFile(path.join(OUT_DIR, 'mark.png'));

console.log('Wrote src/assets/logo/mark.png', region);

// Default Open Graph card: charcoal ground, the mark, and the set wordmark.
const wordmarkSvg = Buffer.from(`
<svg width="1200" height="630" xmlns="http://www.w3.org/2000/svg">
  <rect width="1200" height="630" fill="#171a1d"/>
  <text x="600" y="452" text-anchor="middle" font-family="Arial, sans-serif" font-size="56" font-weight="800" letter-spacing="2" fill="#f1eee7">WW ROOFING &amp; BUILDING</text>
  <text x="600" y="512" text-anchor="middle" font-family="Arial, sans-serif" font-size="26" font-weight="700" letter-spacing="6" fill="#b8b1a4">LEEDS AND SURROUNDING AREAS</text>
  <rect x="480" y="548" width="240" height="4" fill="#1c6f42"/>
</svg>`);

const markSmall = await sharp(path.join(OUT_DIR, 'mark.png'))
  .resize({ height: 300 })
  .toBuffer();
const markMeta = await sharp(markSmall).metadata();

await sharp(wordmarkSvg)
  .composite([{ input: markSmall, left: Math.round(600 - markMeta.width / 2), top: 60 }])
  .jpeg({ quality: 88 })
  .toFile(path.resolve(OUT_DIR, '..', '..', '..', 'public', 'og-default.jpg'));

console.log('Wrote public/og-default.jpg');
