/**
 * Gera os recortes (fundo transparente) dos vestidos-estudo a partir do 3D.
 * Requer `npm run dev` (porta 5173). Saída: public/rack/{silhueta}-{tom}.png,
 * convertida para WebP com alfa por scripts/png-to-webp.py.
 * Uso: node scripts/render-rack.mjs [baseUrl] [sil-tone ...]
 */
import { createRequire } from 'node:module';
import { mkdir } from 'node:fs/promises';

const require = createRequire(import.meta.url);
let chromium;
try { ({ chromium } = require('playwright')); } catch { ({ chromium } = require('/opt/node-tools/node_modules/playwright')); }

const base = process.argv[2] && process.argv[2].startsWith('http') ? process.argv[2] : 'http://localhost:5173';
const only = process.argv.slice(2).filter((a) => !a.startsWith('http'));
// as 11 peças da arara (mesmas combinações do catálogo demonstrativo)
const RACK = [
  'fluido-perola', 'marcante-noite', 'classico-champagne', 'fluido-terracota', 'marcante-salvia', 'classico-vinho',
  'marcante-rosa', 'fluido-gelo', 'classico-perola', 'marcante-dourado', 'fluido-noite',
];
const list = only.length ? only : RACK;
await mkdir('public/rack', { recursive: true });
const browser = await chromium.launch({ args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
const page = await browser.newPage({ viewport: { width: 720, height: 1200 }, deviceScaleFactor: 1 });
for (const [i, key] of list.entries()) {
  const [sil, tone] = key.split('-');
  await page.goto(`${base}/tools/sprite.html?sil=${sil}&tone=${tone}&seed=${i * 7 + 3}`, { waitUntil: 'load' });
  await page.waitForFunction(() => window.__spriteReady === true, null, { timeout: 180000 });
  await page.locator('canvas').screenshot({ path: `public/rack/${key}.png`, omitBackground: true });
  console.log('ok', key);
}
await browser.close();
