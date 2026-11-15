/**
 * E2E · Hero POV 360 (docs/hero-pov/06, 07 e 08).
 * Pré-requisito: preview em :4173 (ou BASE=<url>). Uso: node tests/e2e/hero-pov.mjs
 * Cobre: entrada/saída da visita, volta completa nos dois sentidos, contracampo,
 * destinos físicos, colisão, categorias completas por lado, Esc e scroll de saída,
 * touch, três ciclos e poses fixas com marcos do quadro 02.
 */
import { createRequire } from 'node:module';
import { mkdir } from 'node:fs/promises';
const require = createRequire(import.meta.url);
let chromium;
try { ({ chromium } = require('playwright')); } catch { ({ chromium } = require('/opt/node-tools/node_modules/playwright')); }
const BASE = process.env.BASE || 'http://localhost:4173';
const SHOTS = process.env.SHOTS_DIR || '';
if (SHOTS) await mkdir(SHOTS, { recursive: true });
const results = [];
const check = (name, ok, detail = '') => { results.push({ name, ok }); console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}${detail ? '  · ' + detail : ''}`); };
const browser = await chromium.launch({ args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });

async function open(opts = {}, query = 'tier=touch&gov=off&loja=araxa') {
  const ctx = await browser.newContext({ deviceScaleFactor: 1, viewport: { width: 1440, height: 900 }, ...opts });
  const page = await ctx.newPage();
  const errors = [];
  page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text().slice(0, 200)); });
  page.on('pageerror', (e) => errors.push('pageerror: ' + e.message));
  await page.addInitScript(() => { try { sessionStorage.setItem('belle:v4:intro', '1'); } catch {} });
  await page.goto(`${BASE}/?${query}`, { waitUntil: 'load' });
  await page.evaluate(() => document.querySelector('#sala')?.scrollIntoView({ block: 'center' }));
  await page.waitForFunction(() => document.documentElement.dataset.filmChapter === 'sala' && document.querySelector('.pov.is-on') && window.__belle?.world()?.products.ready > 40, null, { timeout: 240000 });
  return { ctx, page, errors };
}
const info = (page) => page.evaluate(() => window.__belle.world());
const settle = async (page, n = 8) => { const f0 = await page.evaluate(() => window.__belle.world().frames); await page.waitForFunction((f) => window.__belle.world().frames > f, f0 + n, { timeout: 300000 }); };
const arrived = async (page) => { await settle(page, 2); return page.waitForFunction(() => !window.__belle.world().explore.walking, null, { timeout: 300000 }).then(() => true).catch(() => false); };
const near = (a, b, tol) => Math.abs(a - b) <= tol;
/** Toca o palco numa grade até abrir a ficha de uma peça (raycast real). */
async function tapProduct(page, side = null, w = 1440, h = 900) {
  const grid = [];
  for (const fy of [0.5, 0.42, 0.6, 0.7]) for (const fx of [0.5, 0.58, 0.42, 0.66, 0.34, 0.74, 0.26, 0.82, 0.18, 0.9]) grid.push([fx, fy]);
  for (const [fx, fy] of grid) {
    await page.mouse.click(Math.round(w * fx), Math.round(h * fy));
    await page.waitForTimeout(220);
    if (await page.locator('.pov__rack').isHidden()) continue;
    const got = await page.evaluate(() => document.querySelector('.pov__rack').dataset.side);
    if (!side || got === side) return true;
  }
  return false;
}
const wrap = (a) => Math.atan2(Math.sin(a), Math.cos(a));

// A · desktop: entrar, girar 360° nos dois sentidos, contracampo, destinos, colisão, Esc
{
  const { ctx, page, errors } = await open();
  await page.locator('.pov__enter').click();
  await page.waitForFunction(() => window.__belle.world().exploreBlend >= 1, null, { timeout: 30000 });
  let w = await info(page);
  check('A · "Explorar a loja" entra na visita com câmera à altura do olho', w.explore.active && near(w.camera[1], 1.62, 0.03), JSON.stringify(w.camera));
  check('A · a posição inicial é navegável (dentro da loja)', w.explore.z < -0.9 && w.explore.z > -18.2);
  const yaw0 = w.explore.yaw;
  for (let i = 0; i < 24; i++) await page.evaluate(() => window.__belle.explore.look(0.1, 0));
  await settle(page, 4);
  w = await info(page);
  check('A · volta completa para a direita cruza ±180° sem salto', w.explore.yaw - yaw0 > 6.2 && w.explore.yaw - yaw0 < 6.6, String((w.explore.yaw - yaw0).toFixed(2)));
  for (let i = 0; i < 48; i++) await page.evaluate(() => window.__belle.explore.look(-0.1, 0));
  await settle(page, 4);
  w = await info(page);
  check('A · volta completa para a esquerda (yaw acumulado, sem wrap)', w.explore.yaw - yaw0 < -6.2 && w.explore.yaw - yaw0 > -6.6, String((w.explore.yaw - yaw0).toFixed(2)));
  await page.locator('[data-go="corredor"]').click();
  check('A · caminha até o corredor', await arrived(page));
  w = await info(page);
  check('A · chegou ao destino físico do corredor', near(w.explore.x, 0, 0.1) && near(w.explore.z, -6.8, 0.1), JSON.stringify([w.explore.x, w.explore.z]));
  await page.locator('.pov__entrance').click();
  await page.waitForFunction(() => Math.abs(Math.atan2(Math.sin(window.__belle.world().explore.yaw), Math.cos(window.__belle.world().explore.yaw))) > 2.9, null, { timeout: 300000 }).catch(() => undefined);
  w = await info(page);
  check('A · "Ver a entrada" vira de costas para a loja (porta visível pelo lado interno)', Math.abs(wrap(w.explore.yaw)) > 2.9 && w.lookTarget[2] > w.camera[2], JSON.stringify(w.lookTarget));
  await page.locator('[data-go="araraDireita"]').click();
  check('A · de costas, "Arara direita" leva à arara física da direita (+x)', await arrived(page) && (await info(page)).explore.x > 1.2);
  if (SHOTS) await page.locator('#filmCanvas canvas').screenshot({ path: `${SHOTS}/pov-right.png`, timeout: 30000 }).catch(() => undefined);
  await page.locator('[data-go="araraEsquerda"]').click();
  check('A · "Arara esquerda" leva à arara física da esquerda (−x)', await arrived(page) && (await info(page)).explore.x < -1.2);
  // colisão: anda de frente para a parede esquerda com o teclado
  await page.focus('#filmStage');
  await page.evaluate(() => window.__belle.explore.look(0, 0));
  const before = await info(page);
  await page.evaluate(() => { const w = window.__belle; for (let i = 0; i < 40; i++) w.explore.look(-0.0, 0); });
  // vira para −x (yaw −90°) e segura seta para cima
  await page.evaluate((target) => { const i = window.__belle.world().explore; window.__belle.explore.look((target - i.yaw) / 2.7, 0); }, -Math.PI / 2);
  await settle(page, 4);
  await page.keyboard.down('ArrowUp');
  await page.waitForTimeout(5000);
  await settle(page, 6);
  await page.keyboard.up('ArrowUp');
  w = await info(page);
  check('A · colisão: não atravessa o varão nem a parede ao andar para a esquerda', w.explore.x > -2.6 && w.explore.x < before.explore.x + 0.01, String(w.explore.x));
  await page.keyboard.press('Escape');
  await page.waitForFunction(() => window.__belle.world().exploreBlend === 0 && !window.__belle.explore.active(), null, { timeout: 30000 });
  w = await info(page);
  const stillExploring = await page.evaluate(() => window.__belle.explore.active());
  check('A · Esc retoma o filme na pose do trilho (progresso atual)', !stillExploring && w.exploreBlend === 0 && w.camera[2] > -3 && near(w.camera[1], 1.35, 0.3), JSON.stringify(w.camera));
  check('A · sem erros', errors.length === 0, errors.join(' | '));
  await ctx.close();
}

// B · categorias completas em cada lado, estado por lado, paginação, vazio, "Ver peça", Esc fecha ficha
{
  const { ctx, page, errors } = await open();
  const catalog = await page.evaluate(async () => (await (await fetch('/assets/belle/products/catalogo_48_novo.json')).json()));
  const list = Array.isArray(catalog) ? catalog : (catalog.products ?? catalog.items ?? []);
  const perCategory = {};
  for (const p of list) (perCategory[p.category] ??= []).push(p.name ?? p.title);
  await page.locator('.pov__enter').click();
  await page.waitForFunction(() => window.__belle.world().exploreBlend >= 1, null, { timeout: 30000 });
  await page.locator('[data-go="araraDireita"]').click();
  await arrived(page);
  const opened = await tapProduct(page, 'right');
  check('B · toque na arara direita abre a ficha e a categoria', opened);
  const sideRight = await page.evaluate(() => document.querySelector('.pov__rack').dataset.side);
  check('B · o lado identificado é o direito', sideRight === 'right');
  const cats = Object.keys(perCategory);
  let allComplete = cats.length > 0;
  for (const cat of cats) {
    await page.locator(`[data-pov-cat="${cat}"]`).click();
    await page.waitForTimeout(150);
    const titles = await page.locator('.pov__list button').allInnerTexts();
    const got = titles.map((t) => t.replace(/^\d+\s*/, '').trim()).sort();
    const want = [...perCategory[cat]].sort();
    const ok = JSON.stringify(got) === JSON.stringify(want);
    if (!ok) { allComplete = false; console.log('   ', cat, 'esperado', want.length, 'obtido', got.length); }
  }
  check('B · todas as categorias da fonte são alcançáveis por inteiro na arara tocada', allComplete, cats.join(','));
  const bermudas = await page.locator('.pov__rack [data-pov-cat="bermudas"]').count();
  check('B · bermudas não existem na fonte e não são inventadas', bermudas === 0 && !perCategory.bermudas);
  // estado por lado: abre vestidos à direita, bolsas à esquerda, direita permanece
  await page.locator('[data-pov-cat="vestidos"]').click();
  await page.locator('.pov__list button').first().click();
  const rightTitle = await page.locator('.pov__title').textContent();
  await page.locator('[data-go="araraEsquerda"]').click();
  await arrived(page);
  const leftOpened = await tapProduct(page, 'left');
  check('B · toque na arara esquerda abre o lado esquerdo', leftOpened);
  await page.locator('[data-pov-cat="bolsas"]').click();
  await page.waitForTimeout(150);
  const leftCount = await page.locator('.pov__list button').count();
  check('B · bolsas aparecem no expositor da esquerda (6 peças)', leftCount === 6, String(leftCount));
  await page.locator('[data-go="araraDireita"]').click();
  await arrived(page);
  const stillRight = await page.evaluate(() => { const i = window.__belle.world(); return i.explore.x; });
  // reabrir a direita por toque deve preservar vestidos
  await tapProduct(page, 'right');
  const rightCat = await page.locator('.pov__cat').textContent();
  check('B · a arara direita manteve a categoria Vestidos enquanto a esquerda mudou', rightCat === 'Vestidos' && stillRight > 1, rightCat || '');
  void rightTitle;
  await page.locator('.pov__view').click();
  const qv = await page.waitForSelector('.qv', { state: 'visible', timeout: 5000 }).then(() => true).catch(() => false);
  check('B · "Ver peça" abre o detalhe canônico com tamanho e sacola', qv && (await page.locator('.qv [data-add]').count()) === 1);
  await page.keyboard.press('Escape');
  await page.waitForTimeout(400);
  await page.locator('.pov__all').click();
  check('B · "Todas as categorias" devolve a seleção de entrada', /Seleção da arara/.test((await page.locator('.pov__cat').textContent()) || ''));
  check('B · sem erros', errors.length === 0, errors.join(' | '));
  await ctx.close();
}

// C · touch 390: swipe vertical rola a página, arraste horizontal gira, scroll para fora encerra, três ciclos
{
  const { ctx, page, errors } = await open({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true }, 'tier=touch&gov=off&loja=araxa');
  await page.locator('.pov__enter').click();
  await page.waitForFunction(() => window.__belle.world().exploreBlend >= 1, null, { timeout: 30000 });
  const y0 = await page.evaluate(() => scrollY);
  const yaw0 = (await info(page)).explore.yaw;
  // swipe vertical no palco: deve rolar a página nativamente
  await page.touchscreen.tap(195, 500);
  const cdp = await ctx.newCDPSession(page);
  const swipe = async (x1, y1, x2, y2) => {
    await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x: x1, y: y1 }] });
    for (let i = 1; i <= 8; i++) await cdp.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [{ x: x1 + (x2 - x1) * i / 8, y: y1 + (y2 - y1) * i / 8 }] });
    await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
  };
  await swipe(195, 600, 195, 300);
  await page.waitForTimeout(600);
  const y1 = await page.evaluate(() => scrollY);
  check('C · swipe vertical no palco continua rolando a página', y1 > y0 + 40, `${y0}→${y1}`);
  const stillExploring = (await info(page)).explore.active;
  check('C · a visita continua durante a rolagem dentro da área explorável', stillExploring);
  await swipe(60, 500, 330, 505);
  await settle(page, 6);
  const yaw1 = (await info(page)).explore.yaw;
  check('C · arraste horizontal gira o olhar', Math.abs(yaw1 - yaw0) > 0.2, String((yaw1 - yaw0).toFixed(2)));
  check('C · controles de destino visíveis no celular', await page.locator('[data-go="provador"]').isVisible());
  await page.locator('[data-go="provador"]').click();
  check('C · caminha até a frente do provador no touch', await arrived(page) && (await info(page)).explore.z < -15);
  // rolar para fora da área explorável encerra a visita
  await page.evaluate(() => document.querySelector('#inicio')?.scrollIntoView({ block: 'start' }));
  await page.waitForFunction(() => !window.__belle.explore.active() && window.__belle.world().exploreBlend === 0, null, { timeout: 30000 });
  check('C · rolar até a vitrine encerra a visita e devolve o trilho', true);
  // três ciclos entrada/saída
  let cycles = 0;
  for (let i = 0; i < 3; i++) {
    await page.evaluate(() => document.querySelector('#sala')?.scrollIntoView({ block: 'center' }));
    await page.waitForFunction(() => document.querySelector('.pov.is-on') && document.documentElement.dataset.filmChapter === 'sala', null, { timeout: 30000 });
    await page.locator('.pov__enter').click();
    await page.waitForFunction(() => window.__belle.world().exploreBlend >= 1, null, { timeout: 30000 });
    await page.locator('.pov__resume').click();
    await page.waitForFunction(() => window.__belle.world().exploreBlend === 0, null, { timeout: 30000 });
    cycles++;
  }
  const canvases = await page.locator('#filmCanvas canvas').count();
  check('C · três ciclos de entrada e saída sem renderer duplicado', cycles === 3 && canvases === 1);
  check('C · sem erros', errors.length === 0, errors.join(' | '));
  await ctx.close();
}

// D · poses fixas de aceite e marcos do quadro 02 (tier cinema, com pós de cinema)
{
  // 16:9 como as referências: os marcos são relativos ao enquadramento
  const { ctx, page, errors } = await open({ viewport: { width: 1600, height: 900 } }, 'tier=cinema&gov=off&loja=araxa');
  const ids = ['01', '02', '03', '04', '05', '06'];
  let ok = true;
  for (const id of ids) {
    const set = await page.evaluate((p) => window.__belle.setPose(p), id);
    await settle(page, 3);
    const w = await info(page);
    if (!set || w.pose !== id) ok = false;
    if (SHOTS) { const { writeFileSync } = await import('node:fs'); writeFileSync(`${SHOTS}/pose-${id}.png`, Buffer.from((await page.evaluate(() => window.__belle.snapshot())).split(',')[1], 'base64')); }
  }
  check('D · as seis poses fixas são reproduzíveis', ok);
  await page.evaluate(() => window.__belle.setPose('02'));
  await settle(page, 3);
  const marks = await page.evaluate(() => window.__belle.landmarks());
  const horizontalOk = marks.filter((m) => /montante|espelho/.test(m.name)).every((m) => Math.abs(m.dx) <= 3);
  check('D · quadro 02: montantes e eixo do espelho dentro de 3 pp na horizontal', horizontalOk, JSON.stringify(marks.map((m) => [m.name, m.dx, m.dy])));
  await page.evaluate(() => window.__belle.setPose(null));
  check('D · sem erros', errors.length === 0, errors.join(' | '));
  await ctx.close();
}

await browser.close();
const failed = results.filter((r) => !r.ok).length;
console.log(`\n${results.length - failed}/${results.length} verificações passaram`);
process.exit(failed ? 1 : 0);
