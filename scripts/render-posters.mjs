/**
 * Gera os pôsteres do modo STATIC a partir do PRÓPRIO mundo 3D
 * (nenhuma imagem de terceiros). Requer `npm run build && npm run preview`.
 * Uso: node scripts/render-posters.mjs [baseUrl]
 * Saída: public/posters/{capitulo}.jpg (1600×1000) e {capitulo}-p.jpg (900×1500).
 */
import { createRequire } from 'node:module';
import { mkdir } from 'node:fs/promises';

const require = createRequire(import.meta.url);
let chromium;
try { ({ chromium } = require('playwright')); } catch { ({ chromium } = require('/opt/node-tools/node_modules/playwright')); }

const base = process.argv[2] || 'http://localhost:4173';
const chapters = ['vitrine', 'porta', 'sala', 'vestido', 'detalhe', 'categorias', 'provador'];
const formats = [
  { suffix: '', width: 1600, height: 1000 },
  { suffix: '-p', width: 900, height: 1500 },
];
await mkdir('public/posters', { recursive: true });
const browser = await chromium.launch({ args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
for (const f of formats) {
  const page = await browser.newPage({ viewport: { width: f.width, height: f.height }, deviceScaleFactor: 1 });
  for (const id of chapters) {
    await page.goto(`${base}/?poster=${id}`, { waitUntil: 'load' });
    await page.waitForFunction(() => window.__belle?.posterReady === true, null, { timeout: 120000 });
    await page.waitForTimeout(300);
    const path = `public/posters/${id}${f.suffix}.jpg`;
    await page.locator('#filmCanvas canvas').screenshot({ path, type: 'jpeg', quality: 80 });
    console.log('ok', path);
  }
  await page.close();
}
await browser.close();
