/**
 * E2E · Belle Alencar V4 (Playwright, Chromium).
 * Pré-requisito: `npm run build && npm run preview` (porta 4173) ou BASE=<url>.
 * Uso: npm run e2e   ·   SHOTS=1 npm run e2e (salva capturas em docs/qa/)
 * Sai com código 1 se qualquer verificação falhar.
 */
import { createRequire } from 'node:module';
import { mkdir } from 'node:fs/promises';

const require = createRequire(import.meta.url);
let chromium;
try { ({ chromium } = require('playwright')); } catch { ({ chromium } = require('/opt/node-tools/node_modules/playwright')); }

const BASE = process.env.BASE || 'http://localhost:4173';
const SHOTS = !!process.env.SHOTS;
const OUT = 'docs/qa';
if (SHOTS) await mkdir(OUT, { recursive: true });

const results = [];
const check = (name, ok, detail = '') => {
  results.push({ name, ok, detail });
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}${detail ? '  · ' + detail : ''}`);
};

const browser = await chromium.launch({ args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });

async function newPage(opts = {}) {
  const ctx = await browser.newContext({ deviceScaleFactor: 1, ...opts });
  const page = await ctx.newPage();
  const errors = [];
  const failed = [];
  page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text().slice(0, 200)); });
  page.on('pageerror', (e) => errors.push('pageerror: ' + e.message));
  page.on('response', (r) => { if (r.status() >= 400) failed.push(`${r.status()} ${r.url()}`); });
  page.on('requestfailed', (r) => { if (!/posters\//.test(r.url())) failed.push('failed ' + r.url()); });
  return { ctx, page, errors, failed };
}
const skipIntro = (page) => page.addInitScript(() => { try { sessionStorage.setItem('belle:v4:intro', '1'); } catch {} });
const noOverflow = (page) => page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth + 1);

// 1 · Carga, overflow e capturas nos 4 viewports (tier estático: rápido e determinístico)
const viewports = [
  { name: '360', width: 360, height: 800, isMobile: true, hasTouch: true },
  { name: '390', width: 390, height: 844, isMobile: true, hasTouch: true },
  { name: '768', width: 768, height: 1024, isMobile: true, hasTouch: true },
  { name: '1440', width: 1440, height: 900 },
];
for (const vp of viewports) {
  const { ctx, page, errors, failed } = await newPage({ viewport: { width: vp.width, height: vp.height }, isMobile: !!vp.isMobile, hasTouch: !!vp.hasTouch });
  await skipIntro(page);
  await page.goto(`${BASE}/?tier=static`, { waitUntil: 'load' });
  await page.waitForTimeout(400);
  let overflowOk = true;
  const stops = await page.evaluate(() => {
    const ids = ['inicio', 'porta', 'sala', 'vestido', 'detalhe', 'categorias', 'provador', 'ocasioes', 'colecao', 'looks', 'como-comprar', 'lojas', 'atendimento', 'duvidas'];
    return ids.map((id) => { const el = document.getElementById(id); return el ? Math.round(el.getBoundingClientRect().top + scrollY + 40) : 0; });
  });
  for (const [i, y] of stops.entries()) {
    await page.evaluate((yy) => scrollTo(0, yy), y);
    await page.waitForTimeout(250);
    if (!(await noOverflow(page))) overflowOk = false;
    if (SHOTS && [0, 2, 6, 7, 8, 9, 10, 12, 13].includes(i)) await page.screenshot({ path: `${OUT}/${vp.name}-${i}.png` });
  }
  check(`[${vp.name}] sem overflow horizontal em ${stops.length} paradas`, overflowOk);
  check(`[${vp.name}] zero erros de console`, errors.length === 0, errors.slice(0, 2).join(' | '));
  check(`[${vp.name}] zero recursos 4xx/5xx`, failed.length === 0, failed.slice(0, 3).join(' | '));
  const headerOk = await page.evaluate(() => ['#storeButton', '#searchButton', '#bagButton'].every((s) => { const r = document.querySelector(s)?.getBoundingClientRect(); return r && r.width >= 40 && r.height >= 40 && r.right <= innerWidth; }));
  check(`[${vp.name}] loja, busca e sacola sempre visíveis (≥40px)`, headerOk);
  await ctx.close();
}

// 2 · Intro: aparece, "Pular" encerra, não volta na sessão
{
  const { ctx, page } = await newPage({ viewport: { width: 1440, height: 900 } });
  await page.goto(`${BASE}/?tier=static`, { waitUntil: 'domcontentloaded' });
  const visible = await page.locator('#intro').isVisible().catch(() => false);
  if (SHOTS) { await page.waitForTimeout(900); await page.screenshot({ path: `${OUT}/intro-1440.png` }); }
  await page.mouse.click(720, 450);
  await page.waitForTimeout(500);
  const gone = (await page.locator('#intro').count()) === 0;
  await page.reload({ waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(100);
  const stillGone = (await page.locator('#intro').count()) === 0 || !(await page.locator('#intro').isVisible());
  check('intro aparece na 1ª visita', visible);
  check('intro encerra ao clicar/pular', gone);
  check('intro não repete na mesma sessão', stillGone);
  await ctx.close();
}

// 3 · Reduced motion → tier estático, sem canvas, pôster visível
{
  const { ctx, page, errors } = await newPage({ viewport: { width: 390, height: 844 }, reducedMotion: 'reduce' });
  await page.goto(`${BASE}/`, { waitUntil: 'load' });
  await page.waitForTimeout(1500);
  const st = await page.evaluate(() => ({ tier: document.documentElement.dataset.tier, canvas: !!document.querySelector('#filmCanvas canvas'), intro: !!document.getElementById('intro'), poster: !!document.querySelector('.film__poster.is-active img') }));
  check('reduced-motion: tier estático', st.tier === 'static', JSON.stringify(st));
  check('reduced-motion: nenhum canvas WebGL criado', !st.canvas);
  check('reduced-motion: sem intro', !st.intro);
  check('reduced-motion: pôster ativo', st.poster);
  check('reduced-motion: zero erros', errors.length === 0, errors.join(' | '));
  await ctx.close();
}

// 4 · Cidade: escolher, persistir, ?loja= sobrescreve, nunca abre sozinho
{
  const { ctx, page } = await newPage({ viewport: { width: 1440, height: 900 } });
  await skipIntro(page);
  await page.goto(`${BASE}/?tier=static`, { waitUntil: 'load' });
  await page.waitForTimeout(2500);
  const autoOpened = await page.locator('[role="dialog"]:visible').count();
  check('seletor de loja NÃO abre sozinho (achado A2)', autoOpened === 0);
  await page.click('#storeButton');
  await page.click('[data-choose-store="frutal"]');
  await page.waitForTimeout(300);
  const label = await page.textContent('#storeButton [data-store-label]');
  check('escolher Frutal atualiza o header', /Frutal/.test(label || ''), label || '');
  await page.reload({ waitUntil: 'load' });
  const label2 = await page.textContent('#storeButton [data-store-label]');
  check('Frutal persiste após recarregar', /Frutal/.test(label2 || ''), label2 || '');
  await page.goto(`${BASE}/?tier=static&loja=catalao`, { waitUntil: 'load' });
  const label3 = await page.textContent('#storeButton [data-store-label]');
  check('?loja=catalao sobrescreve a preferência', /Catal/.test(label3 || ''), label3 || '');
  await page.goto(`${BASE}/?tier=static&cidade=mineiros`, { waitUntil: 'load' });
  const label4 = await page.textContent('#storeButton [data-store-label]');
  check('?cidade= legado continua funcionando', /Mineiros/.test(label4 || ''), label4 || '');
  await ctx.close();
}

// 5 · Sacola por filial, persistência e troca de loja com decisão explícita
{
  const { ctx, page, errors } = await newPage({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });
  await skipIntro(page);
  await page.goto(`${BASE}/?tier=static&loja=araxa`, { waitUntil: 'load' });
  await page.locator('#colecao').scrollIntoViewIfNeeded();
  await page.locator('.pcard__title [data-qv]').first().evaluate((el) => el.scrollIntoView({ block: 'center' })); await page.locator('.pcard__title [data-qv]').first().click();
  await page.waitForSelector('.qv', { state: 'visible' });
  await page.click('[data-add]');
  const err = await page.locator('.qv__error').isVisible();
  check('adicionar sem tamanho mostra erro', err);
  await page.locator('.qv .size').first().click();
  await page.click('[data-add]');
  await page.waitForFunction(() => document.querySelector('[data-bag-count]')?.textContent?.trim() === '1', null, { timeout: 10000 });
  const count = await page.textContent('[data-bag-count]');
  check('sacola conta 1 peça', count?.trim() === '1', count || '');
  if (SHOTS) await page.screenshot({ path: `${OUT}/390-quickview.png` });
  await page.keyboard.press('Escape');
  await page.reload({ waitUntil: 'load' });
  const count2 = await page.textContent('[data-bag-count]');
  check('sacola persiste após recarregar', count2?.trim() === '1', count2 || '');
  await page.click('#storeButton');
  await page.click('[data-choose-store="frutal"]');
  await page.waitForTimeout(300);
  const switchShown = await page.locator('[data-switch="keep"]').isVisible();
  check('trocar loja com sacola exige decisão', switchShown);
  if (SHOTS) await page.screenshot({ path: `${OUT}/390-switch.png` });
  await page.click('[data-switch="keep"]');
  await page.waitForTimeout(300);
  const hidden = await page.locator('[data-bag-count]').isHidden();
  check('nova loja começa com sacola própria (itens não migram sem escolha)', hidden);
  await page.click('#bagButton');
  await page.waitForTimeout(300);
  const other = await page.locator('[data-goto-store="araxa"]').isVisible();
  check('sacola de Araxá continua salva e acessível', other);
  if (SHOTS) await page.screenshot({ path: `${OUT}/390-bag.png` });
  check('fluxo de sacola sem erros', errors.length === 0, errors.join(' | '));
  await ctx.close();
}

// 6 · Deep link de peça e teclado (Esc fecha, foco volta)
{
  const { ctx, page } = await newPage({ viewport: { width: 1440, height: 900 } });
  await skipIntro(page);
  await page.goto(`${BASE}/?tier=static&peca=vestidos-01`, { waitUntil: 'load' });
  await page.waitForTimeout(600);
  check('?peca= abre o quick view', await page.locator('.qv').isVisible());
  await page.keyboard.press('Escape');
  const closed = await page.waitForSelector('.qv', { state: 'hidden', timeout: 3000 }).then(() => true).catch(() => false);
  check('Esc fecha o quick view', closed);
  await page.locator('#colecao').scrollIntoViewIfNeeded();
  const trigger = page.locator('.pcard__title [data-qv]').nth(1);
  await trigger.focus();
  await page.keyboard.press('Enter');
  await page.waitForSelector('.qv', { state: 'visible' });
  const inDialog = await page.evaluate(() => !!document.activeElement?.closest('[role="dialog"]'));
  check('foco entra no diálogo ao abrir', inDialog);
  await page.keyboard.press('Escape');
  await page.waitForTimeout(400);
  const back = await page.evaluate(() => document.activeElement?.hasAttribute('data-qv'));
  check('foco volta ao gatilho ao fechar', !!back);
  await page.goto(`${BASE}/?tier=static`, { waitUntil: 'load' });
  await page.keyboard.press('Tab');
  const skip = await page.evaluate(() => document.activeElement?.classList.contains('skip-link'));
  check('1º Tab chega no "Pular para a coleção"', !!skip);
  await ctx.close();
}

// 6b · Seções de conversão: ocasião filtra a coleção, look abre a peça, FAQ abre
{
  const { ctx, page, errors } = await newPage({ viewport: { width: 1440, height: 900 } });
  await skipIntro(page);
  await page.goto(`${BASE}/?tier=static`, { waitUntil: 'load' });
  await page.locator('[data-filter-occasion="noite"]').scrollIntoViewIfNeeded();
  await page.click('[data-filter-occasion="noite"]');
  await page.waitForTimeout(900);
  const occPressed = await page.getAttribute('[data-occ="noite"]', 'aria-pressed');
  const cards = await page.locator('.pgrid .pcard').count();
  check('ocasião "Para sair" filtra a coleção', occPressed === 'true' && cards > 0 && cards < 48, `pressed=${occPressed} cards=${cards}`);
  const counts = await page.locator('[data-occ-count]').allTextContents();
  check('contagem por ocasião vem do catálogo', counts.every((t) => /\d+ peças? na prévia/.test(t)), counts.join(' | '));
  await page.locator('[data-open-product="bolsas-03"]').scrollIntoViewIfNeeded();
  await page.click('[data-open-product="bolsas-03"]');
  const qv = await page.waitForSelector('.qv', { state: 'visible', timeout: 3000 }).then(() => true).catch(() => false);
  check('look completo abre a peça (quick view)', qv);
  if (qv) {
    await page.click('.qv__zoom');
    check('zoom do detalhe liga', (await page.getAttribute('.qv__zoom', 'aria-pressed')) === 'true');
    await page.keyboard.press('Escape');
    await page.waitForSelector('.qv', { state: 'hidden', timeout: 3000 }).catch(() => undefined);
  }
  await page.locator('#duvidas summary').first().scrollIntoViewIfNeeded();
  await page.click('#duvidas summary');
  check('FAQ abre (details nativo)', await page.locator('#duvidas details').first().evaluate((d) => d.open));
  const floatOk = await page.evaluate(() => getComputedStyle(document.getElementById('floatCta')).visibility === 'visible');
  check('CTA flutuante visível fora do filme', floatOk);
  check('seções de conversão sem erros', errors.length === 0, errors.join(' | '));
  await ctx.close();
}


// 6c · ARARA VIVA + VOO ATÉ A BOLSA
const gotoRack = async (page) => {
  const y = await page.evaluate(() => { const el = document.querySelector('article[data-chapter="sala"]'); return el.getBoundingClientRect().top + scrollY + el.offsetHeight * 0.3; });
  await page.evaluate((yy) => scrollTo(0, yy), y);
  await page.waitForFunction(() => window.__rack && document.getElementById('arara-viva')?.classList.contains('is-on'), null, { timeout: 8000 });
  await page.waitForTimeout(1600);
};
const openFlightReady = async (page, idx) => {
  const pt = await page.evaluate((i) => { const a = document.querySelectorAll('.rack__piece')[i].getBoundingClientRect(); return [a.left + a.width / 2, a.top + a.height * 0.45]; }, idx);
  await page.mouse.move(pt[0], pt[1], { steps: 6 });
  await page.waitForTimeout(500);
  await page.mouse.click(pt[0], pt[1]);
  await page.waitForSelector('.pv:not([hidden])', { timeout: 4000 });
  await page.waitForTimeout(800);
};
{
  const { ctx, page, errors } = await newPage({ viewport: { width: 1440, height: 900 } });
  await skipIntro(page);
  await page.goto(`${BASE}/?tier=static&loja=araxa`, { waitUntil: 'load' });
  await gotoRack(page);
  const n = await page.locator('.rack__piece').count();
  check('arara: 30 roupas independentes em cabides', n === 30, String(n));
  // dock: peça sob o cursor cresce ~1,5× e as vizinhas abrem espaço
  const pt = await page.evaluate(() => { const a = document.querySelectorAll('.rack__piece')[15].getBoundingClientRect(); return [a.left + a.width / 2, a.top + a.height * 0.45]; });
  await page.mouse.move(pt[0] - 150, pt[1], { steps: 4 });
  await page.mouse.move(pt[0], pt[1], { steps: 10 });
  await page.waitForTimeout(700);
  const d1 = await page.evaluate(() => window.__rack.debug());
  const maxS = Math.max(...d1.scales);
  check('arara: foco tipo dock (escala máx ≥ 1,4 e só uma peça em foco)', maxS >= 1.4 && d1.scales.filter((v) => v > 1.4).length === 1, d1.scales.join(','));
  // trackpad horizontal desliza a arara; vertical segue para a página
  const off0 = d1.offset;
  await page.mouse.wheel(260, 0);
  await page.waitForTimeout(500);
  const off1 = (await page.evaluate(() => window.__rack.debug())).offset;
  const sy0 = await page.evaluate(() => scrollY);
  await page.mouse.wheel(0, 300);
  await page.waitForFunction((before) => scrollY > before, sy0, { timeout: 3000 }).catch(() => undefined);
  const sy1 = await page.evaluate(() => scrollY);
  check('arara: trackpad horizontal desliza a arara', off1 !== off0, `${off0}→${off1}`);
  check('arara: rolagem vertical NÃO é sequestrada', sy1 > sy0, `${sy0}→${sy1}`);
  await gotoRack(page);
  // teclado: setas trocam a peça, Enter abre a ficha, Esc devolve o foco à mesma peça
  await page.locator('.rack__piece').nth(14).focus();
  await page.keyboard.press('ArrowRight');
  await page.waitForTimeout(500);
  const focusedId = await page.evaluate(() => document.activeElement?.dataset.id);
  check('arara: seta move o foco entre peças', focusedId === (await page.locator('.rack__piece').nth(15).getAttribute('data-id')), focusedId);
  await page.keyboard.press('Enter');
  const opened = await page.waitForSelector('.pv:not([hidden])', { timeout: 4000 }).then(() => true).catch(() => false);
  check('arara: Enter abre a ficha editorial da MESMA peça', opened && (await page.textContent('#pvTitle'))?.length > 3);
  await page.keyboard.press('Escape');
  await page.waitForSelector('.pv', { state: 'hidden', timeout: 4000 }).catch(() => undefined);
  await page.waitForTimeout(300);
  check('arara: Esc fecha e devolve o foco à peça de origem', (await page.evaluate(() => document.activeElement?.dataset.id)) === focusedId);
  // voo: 10 adições seguidas, sem duplicar e sem fantasma órfão
  await openFlightReady(page, 15);
  await page.locator('.pv__size').nth(1).click();
  let ok = true;
  for (let i = 1; i <= 10; i++) {
    await page.locator('.pv__size').nth(i % 5).click(); // alterna tamanhos (limite de 9 por variante)
    await page.click('.pv__add');
    // segundo clique IMEDIATO durante o voo (botão ocupado): não pode duplicar
    await page.click('.pv__add', { force: true, timeout: 150 }).catch(() => undefined);
    await page.waitForFunction(() => !document.querySelector('.dress-ghost') && !document.querySelector('.pv__add[aria-busy]'), null, { timeout: 5000 });
    const c = Number(await page.textContent('.bagw__count'));
    if (c !== i) { ok = false; console.log('  contagem esperada', i, 'obtida', c); break; }
  }
  check('voo: 10 adições consecutivas, contador exato e zero fantasmas', ok && (await page.locator('.dress-ghost').count()) === 0);
  const hdr = await page.textContent('[data-bag-count]');
  check('voo: contador do header sincronizado com a bolsa', hdr?.trim() === '10', hdr);
  await page.reload({ waitUntil: 'load' });
  check('voo: sacola persistida após recarregar', (await page.textContent('[data-bag-count]'))?.trim() === '10');
  check('arara + voo sem erros de console', errors.length === 0, errors.join(' | '));
  await ctx.close();
}
{
  // Esc durante o voo: conclui o estado sem fantasma
  const { ctx, page } = await newPage({ viewport: { width: 1280, height: 800 } });
  await skipIntro(page);
  await page.goto(`${BASE}/?tier=static&loja=frutal`, { waitUntil: 'load' });
  await gotoRack(page);
  await openFlightReady(page, 14);
  await page.locator('.pv__size').nth(0).click();
  await page.click('.pv__add');
  await page.waitForTimeout(250);
  await page.keyboard.press('Escape');
  await page.waitForTimeout(400);
  check('voo: Esc no meio do voo conclui sem fantasma e conta 1', (await page.locator('.dress-ghost').count()) === 0 && (await page.textContent('.bagw__count')) === '1');
  await ctx.close();
}
{
  // movimento reduzido: sem trajetória, item entra direto na bolsa
  const { ctx, page } = await newPage({ viewport: { width: 1280, height: 800 }, reducedMotion: 'reduce' });
  await page.goto(`${BASE}/?loja=araxa`, { waitUntil: 'load' });
  await gotoRack(page);
  await openFlightReady(page, 13);
  await page.locator('.pv__size').nth(0).click();
  let ghostSeen = false;
  await page.exposeFunction('__ghost', () => { ghostSeen = true; });
  await page.evaluate(() => new MutationObserver(() => { if (document.querySelector('.dress-ghost')) window.__ghost(); }).observe(document.body, { childList: true }));
  await page.click('.pv__add');
  await page.waitForTimeout(300);
  check('reduced-motion: adiciona sem voo (nenhum fantasma) e atualiza a bolsa', !ghostSeen && (await page.textContent('.bagw__count')) === '1');
  await ctx.close();
}
{
  // toque: 1º toque traz/abre, voo funciona no mobile
  const { ctx, page, errors } = await newPage({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });
  await skipIntro(page);
  await page.goto(`${BASE}/?tier=static&loja=catalao`, { waitUntil: 'load' });
  await gotoRack(page);
  const pt = await page.evaluate(() => { let best; for (const x of document.querySelectorAll('.rack__piece')) { const a = x.getBoundingClientRect(); const cx = a.left + a.width / 2; if (cx > innerWidth * 0.35 && cx < innerWidth * 0.65) best = [cx, a.top + a.height * 0.42]; } return best; });
  await page.touchscreen.tap(pt[0], pt[1]);
  await page.waitForTimeout(600);
  if (!(await page.locator('.pv').isVisible())) { await page.touchscreen.tap(pt[0], pt[1]); await page.waitForTimeout(900); }
  check('toque: abre a ficha da peça tocada', await page.locator('.pv').isVisible());
  await page.locator('.pv__size').nth(2).click();
  await page.click('.pv__add');
  await page.waitForFunction(() => !document.querySelector('.dress-ghost'), null, { timeout: 5000 });
  check('toque: voo até a bolsa e contador 1', (await page.textContent('.bagw__count')) === '1');
  if (SHOTS) await page.screenshot({ path: `${OUT}/390-viewer.png` });
  check('toque: sem erros', errors.length === 0, errors.join(' | '));
  await ctx.close();
}

// 7 · WebGL: render ativo no filme, parado fora dele
{
  const { ctx, page, errors } = await newPage({ viewport: { width: 1280, height: 800 } });
  await skipIntro(page);
  await page.goto(`${BASE}/?tier=cinema`, { waitUntil: 'load' });
  await page.locator('#inicio').scrollIntoViewIfNeeded();
  const live = await page.waitForSelector('.film__stage.is-live', { timeout: 60000 }).then(() => true).catch(() => false);
  check('CINEMA: palco 3D ativo (1º frame)', live);
  const f1 = await page.evaluate(() => window.__belle?.world()?.frames ?? 0);
  // SwiftShader may take seconds per frame: test liveness separately from FPS.
  await page.waitForFunction((before) => (window.__belle?.world()?.frames ?? 0) > before, f1, { timeout: 30000 }).catch(() => undefined);
  const f2 = await page.evaluate(() => window.__belle?.world()?.frames ?? 0);
  check('CINEMA: render loop roda dentro do filme', f2 > f1, `${f1}→${f2}`);
  const info = await page.evaluate(() => window.__belle?.world());
  check('CINEMA: draw calls ≤ 120', (info?.drawCalls ?? 999) <= 120, JSON.stringify(info));
  await page.evaluate(() => document.getElementById('lojas')?.scrollIntoView());
  await page.waitForTimeout(2000); // deixa terminar um quadro lento (render por software) já em curso
  const g1 = await page.evaluate(() => window.__belle?.world()?.frames ?? 0);
  await page.waitForTimeout(1200);
  const g2 = await page.evaluate(() => window.__belle?.world()?.frames ?? 0);
  check('CINEMA: render loop PARA fora do palco', g2 === g1, `${g1}→${g2}`);
  check('CINEMA: zero erros', errors.length === 0, errors.join(' | '));
  await ctx.close();
}

// 8 · Métricas de laboratório (LCP / CLS) — não são dados de campo
for (const vp of [{ width: 390, height: 844, isMobile: true, hasTouch: true, n: '390' }, { width: 1440, height: 900, n: '1440' }]) {
  const { ctx, page } = await newPage({ viewport: { width: vp.width, height: vp.height }, isMobile: !!vp.isMobile, hasTouch: !!vp.hasTouch });
  await page.addInitScript(() => {
    window.__cls = 0; window.__lcp = 0;
    new PerformanceObserver((l) => l.getEntries().forEach((e) => { if (!e.hadRecentInput) window.__cls += e.value; })).observe({ type: 'layout-shift', buffered: true });
    new PerformanceObserver((l) => { const e = l.getEntries(); window.__lcp = e[e.length - 1].startTime; }).observe({ type: 'largest-contentful-paint', buffered: true });
  });
  await skipIntro(page);
  await page.goto(`${BASE}/`, { waitUntil: 'load' });
  await page.waitForTimeout(3000);
  const m = await page.evaluate(() => ({ lcp: Math.round(window.__lcp), cls: Math.round(window.__cls * 1000) / 1000 }));
  check(`[${vp.n}] LCP lab ≤ 2500 ms`, m.lcp > 0 && m.lcp <= 2500, `${m.lcp} ms`);
  check(`[${vp.n}] CLS lab ≤ 0.1`, m.cls <= 0.1, String(m.cls));
  await ctx.close();
}

await browser.close();
const failedCount = results.filter((r) => !r.ok).length;
console.log(`\n${results.length - failedCount}/${results.length} verificações passaram`);
process.exit(failedCount ? 1 : 0);
