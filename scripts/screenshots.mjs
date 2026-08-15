/**
 * Visual QA loop: full-page screenshots of every route at desktop (1440x900)
 * and mobile (390x844) widths.
 *
 * Usage:
 *   node scripts/screenshots.mjs                  -> all routes from dist/
 *   node scripts/screenshots.mjs /styleguide/ /   -> just the given routes
 *   BASE_URL=http://localhost:4321 overrides the target server.
 */
import { mkdir, readdir } from 'node:fs/promises';
import path from 'node:path';
import { chromium } from 'playwright';

const ROOT = path.resolve(import.meta.dirname, '..');
const BASE = process.env.BASE_URL ?? 'http://localhost:4321';
const OUT =
  process.env.SCREENSHOT_DIR ??
  path.join(ROOT, '.screenshots');

const argRoutes = process.argv.slice(2);

async function routesFromDist() {
  const dist = path.join(ROOT, 'dist');
  const routes = [];
  async function walk(dir, prefix) {
    for (const entry of await readdir(dir, { withFileTypes: true })) {
      if (entry.isDirectory()) {
        await walk(path.join(dir, entry.name), `${prefix}${entry.name}/`);
      } else if (entry.name === 'index.html') {
        routes.push(prefix);
      }
    }
  }
  await walk(dist, '/');
  return routes;
}

const routes = argRoutes.length ? argRoutes : await routesFromDist();
await mkdir(OUT, { recursive: true });

const viewports = [
  { name: 'desktop', width: 1440, height: 900 },
  { name: 'mobile', width: 390, height: 844 },
];

const browser = await chromium.launch();
for (const vp of viewports) {
  const page = await browser.newPage({ viewport: { width: vp.width, height: vp.height } });
  for (const route of routes) {
    const url = `${BASE}${route}`;
    await page.goto(url, { waitUntil: 'networkidle' });
    // Force lazy images to load and wait for fonts so full-page stitching
    // captures real pixels, not placeholders.
    await page.evaluate(async () => {
      for (const img of document.querySelectorAll('img[loading="lazy"]')) {
        img.loading = 'eager';
      }
      await Promise.all(
        [...document.images]
          .filter((i) => !i.complete)
          .map((i) => new Promise((r) => { i.onload = i.onerror = r; })),
      );
      await Promise.all([...document.images].map((i) => i.decode().catch(() => {})));
      await document.fonts.ready;
      // Scroll through the page so every image rasterises before the
      // full-page capture stitches (headless quirk with off-screen images).
      await new Promise((resolve) => {
        let y = 0;
        const step = () => {
          y += 700;
          window.scrollTo(0, y);
          if (y < document.body.scrollHeight) setTimeout(step, 30);
          else {
            window.scrollTo(0, 0);
            setTimeout(resolve, 250);
          }
        };
        step();
      });
    });
    const slug = route === '/' ? 'home' : route.replaceAll('/', ' ').trim().replaceAll(' ', '-');
    const file = path.join(OUT, `${slug}--${vp.name}.png`);
    await page.screenshot({ path: file, fullPage: true });
    console.log(`${vp.name}  ${route}  -> ${path.relative(ROOT, file)}`);
  }
  await page.close();
}
await browser.close();
console.log(`\n${routes.length * viewports.length} screenshots in ${path.relative(ROOT, OUT)}`);
