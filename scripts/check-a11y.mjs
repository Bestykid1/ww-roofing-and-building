/**
 * Axe accessibility sweep over every route at desktop and mobile widths.
 * Run with the preview or dev server up: node scripts/check-a11y.mjs
 */
import { readdir } from 'node:fs/promises';
import path from 'node:path';
import { chromium } from 'playwright';
import { AxeBuilder } from '@axe-core/playwright';

const ROOT = path.resolve(import.meta.dirname, '..');
const BASE = process.env.BASE_URL ?? 'http://localhost:4321';

async function routesFromDist() {
  const dist = path.join(ROOT, 'dist');
  const routes = [];
  async function walk(dir, prefix) {
    for (const entry of await readdir(dir, { withFileTypes: true })) {
      if (entry.isDirectory()) await walk(path.join(dir, entry.name), `${prefix}${entry.name}/`);
      else if (entry.name === 'index.html') routes.push(prefix);
    }
  }
  await walk(dist, '/');
  return routes;
}

const routes = await routesFromDist();
const browser = await chromium.launch();
let totalViolations = 0;

for (const vp of [{ w: 1440, h: 900 }, { w: 390, h: 844 }]) {
  const context = await browser.newContext({ viewport: { width: vp.w, height: vp.h } });
  const page = await context.newPage();
  for (const route of routes) {
    await page.goto(`${BASE}${route}`, { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(150);
    const results = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa']).analyze();
    if (results.violations.length) {
      totalViolations += results.violations.length;
      console.log(`\n${route} @${vp.w}px`);
      for (const v of results.violations) {
        console.log(`  [${v.impact}] ${v.id}: ${v.help} (${v.nodes.length} node${v.nodes.length === 1 ? '' : 's'})`);
        for (const n of v.nodes.slice(0, 3)) console.log(`      ${n.target.join(' ')}`);
      }
    }
  }
  await context.close();
}

await browser.close();
console.log(`\n${routes.length} routes x 2 viewports checked: ${totalViolations === 0 ? 'NO violations' : `${totalViolations} violations`}`);
process.exit(totalViolations === 0 ? 0 : 1);
