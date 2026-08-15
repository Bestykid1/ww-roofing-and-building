/**
 * Photo pipeline for WW Roofing & Building.
 *
 * Reads scripts/photo-manifest.json and, for every included original in
 * "Photos of work", writes EXIF-normalised, metadata-stripped masters and
 * art-directed crop variants into src/assets/photos/, plus 1200x630 OG
 * renders into src/assets/og/. Originals are never modified.
 *
 * Run: npm run photos
 */
import { readFile, mkdir, readdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import sharp from 'sharp';

const ROOT = path.resolve(import.meta.dirname, '..');
const SOURCE_DIR = path.join(ROOT, 'Photos of work');
const OUT_PHOTOS = path.join(ROOT, 'src', 'assets', 'photos');
const OUT_OG = path.join(ROOT, 'src', 'assets', 'og');
const MANIFEST_PATH = path.join(ROOT, 'scripts', 'photo-manifest.json');
const PHOTOS_JSON = path.join(ROOT, 'src', 'content', 'photos', 'photos.json');

const manifest = JSON.parse((await readFile(MANIFEST_PATH, 'utf8')).replace(/^﻿/, ''));

await mkdir(OUT_PHOTOS, { recursive: true });
await mkdir(OUT_OG, { recursive: true });

const sourceFiles = (await readdir(SOURCE_DIR)).filter((f) => /\.jpe?g$/i.test(f));

// Every source file must have a manifest verdict; every manifest entry must exist.
const entries = Object.entries(manifest).filter(([k]) => !k.startsWith('_'));
const manifestNames = new Set(entries.map(([k]) => k));
const missingFromManifest = sourceFiles.filter((f) => !manifestNames.has(f));
const missingOnDisk = entries.filter(([name]) => !sourceFiles.includes(name));
if (missingFromManifest.length) {
  console.error('Source files with no manifest entry:', missingFromManifest);
  process.exit(1);
}
if (missingOnDisk.length) {
  console.error('Manifest entries with no source file:', missingOnDisk.map(([n]) => n));
  process.exit(1);
}

const produced = [];
let excluded = 0;

for (const [original, entry] of entries) {
  if (entry.action === 'exclude') {
    excluded += 1;
    console.log(`SKIP  ${original}  (${entry.reason})`);
    continue;
  }

  const input = path.join(SOURCE_DIR, original);
  // .rotate() with no args bakes EXIF orientation into pixels; sharp strips
  // all metadata (including GPS) by default on output.
  let base = sharp(input).rotate();
  const meta = await base.metadata();
  // Dimensions after EXIF orientation is applied.
  const swap = (meta.orientation ?? 1) >= 5;
  let width = swap ? meta.height : meta.width;
  let height = swap ? meta.width : meta.height;

  // Privacy/legal crops are applied to the MASTER itself (number plates,
  // identifiable third-party signage, defects). Nothing downstream can ever
  // select an uncropped original for these images.
  if (entry.masterCrop) {
    const [fx, fy, fw, fh] = entry.masterCrop.rect;
    const region = {
      left: Math.round(fx * width),
      top: Math.round(fy * height),
      width: Math.min(Math.round(fw * width), width - Math.round(fx * width)),
      height: Math.min(Math.round(fh * height), height - Math.round(fy * height)),
    };
    base = sharp(await base.extract(region).toBuffer());
    width = region.width;
    height = region.height;
  }

  // Feathered clone patches (e.g. sky over a pylon). Each patch copies a
  // region of the same image onto another position with soft edges, applied
  // before the master is written so every variant inherits the fix.
  if (entry.retouch?.length) {
    let canvas = await base.toBuffer();
    for (const patch of entry.retouch) {
      const [fx, fy, fw, fh] = patch.from;
      const region = {
        left: Math.round(fx * width),
        top: Math.round(fy * height),
        width: Math.round(fw * width),
        height: Math.round(fh * height),
      };
      const feather = Math.max(8, Math.round(Math.min(region.width, region.height) * 0.12));
      const maskSvg = Buffer.from(
        `<svg width="${region.width}" height="${region.height}">` +
          `<rect x="${feather}" y="${feather}" width="${region.width - feather * 2}" height="${region.height - feather * 2}" rx="${feather}" fill="white"/>` +
          `</svg>`,
      );
      const mask = await sharp(maskSvg).blur(feather / 2).toBuffer();
      const patchBuf = await sharp(canvas)
        .extract(region)
        .joinChannel(await sharp(mask).extractChannel(0).toBuffer())
        .png()
        .toBuffer();
      canvas = await sharp(canvas)
        .composite([
          {
            input: patchBuf,
            left: Math.round(patch.to[0] * width),
            top: Math.round(patch.to[1] * height),
          },
        ])
        .toBuffer();
    }
    base = sharp(canvas);
  }

  const masterPath = path.join(OUT_PHOTOS, `${entry.slug}.jpg`);
  await base.clone().jpeg({ quality: 92, mozjpeg: true }).toFile(masterPath);

  const variants = [];
  for (const crop of entry.crops ?? []) {
    const [fx, fy, fw, fh] = crop.rect;
    const region = {
      left: Math.round(fx * width),
      top: Math.round(fy * height),
      width: Math.round(fw * width),
      height: Math.round(fh * height),
    };
    region.width = Math.min(region.width, width - region.left);
    region.height = Math.min(region.height, height - region.top);
    const variantPath = path.join(OUT_PHOTOS, `${entry.slug}--${crop.suffix}.jpg`);
    await base.clone().extract(region).jpeg({ quality: 92, mozjpeg: true }).toFile(variantPath);
    variants.push({ suffix: crop.suffix, ...region });
  }

  // OG render (1200x630, attention-cropped) from the hero variant when one
  // exists, otherwise from the master.
  const ogSource = (entry.crops ?? []).find((c) => c.suffix === 'hero')
    ? path.join(OUT_PHOTOS, `${entry.slug}--hero.jpg`)
    : masterPath;
  await sharp(ogSource)
    .resize(1200, 630, { fit: 'cover', position: sharp.strategy.attention })
    .jpeg({ quality: 82, mozjpeg: true })
    .toFile(path.join(OUT_OG, `${entry.slug}.jpg`));

  produced.push({ original, slug: entry.slug, width, height, variants, peopleVisible: !!entry.peopleVisible });
  console.log(`OK    ${entry.slug}  ${width}x${height}  (+${variants.length} variant${variants.length === 1 ? '' : 's'})`);
}

// Surface any photos.json gaps so alt text is never silently missing.
let existingRecords = [];
try {
  existingRecords = JSON.parse(await readFile(PHOTOS_JSON, 'utf8'));
} catch {
  console.log('\nNo photos.json yet; skeleton follows for any missing records.');
}
const known = new Set(existingRecords.map((r) => r.slug));
const gaps = produced.filter((p) => !known.has(p.slug));
if (gaps.length) {
  const skeleton = gaps.map((p) => ({
    slug: p.slug,
    original: p.original,
    alt: 'TODO',
    orientation: p.width >= p.height ? 'landscape' : 'portrait',
    role: 'grid',
    categories: [],
    peopleVisible: p.peopleVisible,
  }));
  await writeFile(
    path.join(ROOT, 'scripts', 'photos-json-skeleton.json'),
    JSON.stringify(skeleton, null, 2),
  );
  console.log(`\n${gaps.length} image(s) missing from photos.json - skeleton written to scripts/photos-json-skeleton.json`);
}

console.log(`\nDone: ${produced.length} included, ${excluded} excluded, ${produced.reduce((n, p) => n + p.variants.length, 0)} crop variants.`);
