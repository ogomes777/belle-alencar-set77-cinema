/** Verificação estrutural rápida da V4 (não substitui QA visual nem E2E). */
import fs from 'node:fs';

let ok = true;
const need = [
  'index.html', 'src/main.ts', 'src/film.ts', 'src/experience/world.ts', 'src/experience/cloth/dress.ts',
  'src/commerce/index.ts', 'src/commerce/catalog.demo.ts', 'src/commerce/stores.ts',
  'CLAUDE.md', 'AGENTS.md', 'docs/STORYBOARD.md', 'docs/IMPLEMENTATION_PLAN.md', 'docs/ASSETS_MISSING.md', 'docs/QA_PLAN.md',
  'knowledge/MOTION_ATLAS_371.md', 'legacy/v3/index.html',
];
for (const p of need) {
  const good = fs.existsSync(p);
  console.log((good ? 'OK   ' : 'FAIL ') + p);
  if (!good) ok = false;
}
const html = fs.readFileSync('index.html', 'utf8');
for (const id of ['inicio', 'porta', 'sala', 'vestido', 'detalhe', 'categorias', 'provador', 'colecao', 'lojas']) {
  if (!html.includes(`id="${id}"`)) { console.log('FAIL âncora #' + id); ok = false; }
}
const posters = ['vitrine', 'porta', 'sala', 'vestido', 'detalhe', 'categorias', 'provador'];
const missing = posters.flatMap((id) => [`public/posters/${id}.jpg`, `public/posters/${id}-p.jpg`]).filter((p) => !fs.existsSync(p));
if (missing.length) { console.log('FAIL pôsteres ausentes (rode scripts/render-posters.mjs):', missing.join(', ')); ok = false; }
// nenhuma mídia de terceiros no código-fonte
const src = fs.readdirSync('src', { recursive: true }).filter((f) => /\.(ts|css)$/.test(f)).map((f) => fs.readFileSync(`src/${f}`, 'utf8')).join('\n') + html;
if (/unsplash|pexels|shutterstock/i.test(src)) { console.log('FAIL referência a banco de imagens de terceiros'); ok = false; }
if (!ok) process.exitCode = 1;
else console.log('Estrutura OK. Rode também: npm test, npm run build, npm run e2e.');
