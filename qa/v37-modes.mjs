/**
 * V37 modes audit: per viewport/mode, walk every boundary down then up and
 * check: progress monotonic & reversible, completion drops masks, no new
 * fixed full-viewport layer, no horizontal overflow, no JS errors, commerce
 * CTAs hit-testable once boundary completed, hash jump completes reveal.
 * Usage: node qa/v37-modes.mjs [baseUrl]  → prints JSON, exit 1 on failure.
 */
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const { chromium } = require('playwright');
const base = process.argv[2] || 'http://localhost:4173';
const SECTIONS = ['#passarela', '#ocasioes', '#colecao', '#lojas', '#atendimento', '#duvidas', '.finale'];
const runs = [
  { name: '360', vp: [360, 740], mobile: true },
  { name: '390', vp: [390, 844], mobile: true },
  { name: '768', vp: [768, 1024], mobile: true },
  { name: '1440', vp: [1440, 900] },
  { name: '1440-dark', vp: [1440, 900], theme: 'dark' },
  { name: '390-rose', vp: [390, 844], mobile: true, theme: 'rose' },
  { name: '1440-reduced', vp: [1440, 900], reduced: true },
  { name: '1440-essential', vp: [1440, 900], essential: true },
];
const browser = await chromium.launch();
const results = [];
for (const r of runs) {
  const ctx = await browser.newContext({ viewport: { width: r.vp[0], height: r.vp[1] }, isMobile: !!r.mobile, hasTouch: !!r.mobile, reducedMotion: r.reduced ? 'reduce' : 'no-preference' });
  await ctx.addInitScript(([theme]) => { try { sessionStorage.setItem('belle:v4:intro', '1'); if (theme) localStorage.setItem('belle:v31:theme', theme); } catch {} }, [r.theme]);
  const page = await ctx.newPage();
  const errors = [];
  page.on('pageerror', e => errors.push(String(e)));
  await page.goto(base + '/?tier=static', { waitUntil: 'load' });
  await page.waitForTimeout(600);
  if (r.essential) { await page.click('#directorToggle').catch(() => {}); await page.waitForTimeout(300); }
  const walk = await page.evaluate(async (sections) => {
    const raf = () => new Promise(res => requestAnimationFrame(() => requestAnimationFrame(res)));
    const total = document.documentElement.scrollHeight - innerHeight;
    const read = () => sections.map(s => { const el = document.querySelector(s); if (!el) return -2; const v = el.querySelector('.v37-veil') || el; return +(v.style.getPropertyValue('--v37-entry') || -1); });
    const sample = [];
    const down = [], up = [];
    for (let y = 0; y <= total; y += innerHeight / 5) { scrollTo(0, y); await raf(); down.push([y, read()]); }
    const active = down.filter(([, v]) => v.some(x => x > 0 && x < 1)).length;
    for (let y = total; y >= 0; y -= innerHeight / 5) { scrollTo(0, y); await raf(); up.push([y, read()]); }
    let monotonic = true;
    for (let i = 0; i < sections.length; i++) { let prev = -9; for (const [, v] of down) { if (v[i] >= 0 && v[i] + 1e-3 < prev) monotonic = false; if (v[i] >= 0) prev = v[i]; } }
    // Reversibility: same scrollY → same progress on the way up.
    const map = new Map(down.map(([y, v]) => [Math.round(y), v.join()]));
    const reversible = up.every(([y, v]) => !map.has(Math.round(y)) || map.get(Math.round(y)) === v.join());
    const bigFixed = [...document.querySelectorAll('body *')].filter(n => { const c = getComputedStyle(n); const b = n.getBoundingClientRect(); return c.position === 'fixed' && b.width >= innerWidth * .9 && b.height >= innerHeight * .9 && c.display !== 'none' && c.visibility !== 'hidden' && +c.opacity > .05; }).map(n => n.id || n.className);
    return { active, monotonic, reversible, bigFixed, overflowX: document.documentElement.scrollWidth > innerWidth + 1, boundaryCount: document.querySelectorAll('.v37-boundary').length };
  }, SECTIONS);
  // Hash jump straight to the FAQ and the stores: reveal must be complete.
  const jumps = {};
  for (const id of ['duvidas', 'atendimento', 'colecao']) {
    await page.evaluate(i => { location.hash = ''; location.hash = i; }, id);
    await page.waitForTimeout(250);
    jumps[id] = await page.evaluate(i => { const s = document.getElementById(i); const v = s.querySelector('.v37-veil') || s; return { entry: v.style.getPropertyValue('--v37-entry') || 'static', done: s.classList.contains('v37-done') || !s.classList.contains('v37-boundary') }; }, id);
  }
  // CTA hit-testing after completion (WhatsApp in atendimento, store select).
  const hits = await page.evaluate(() => ['#atendimento .btn--solid', '[data-select-store="araxa"]', '#duvidas summary'].map(sel => {
    const el = document.querySelector(sel); el.scrollIntoView({ block: 'center' });
    return sel;
  }));
  const hitOk = [];
  for (const sel of hits) {
    await page.locator(sel).first().scrollIntoViewIfNeeded(); await page.waitForTimeout(150);
    hitOk.push(await page.evaluate(s => { const el = document.querySelector(s); const b = el.getBoundingClientRect(); const h = document.elementFromPoint(b.x + b.width / 2, b.y + b.height / 2); return !!h && (h === el || el.contains(h)); }, sel));
  }
  const staticExpected = r.reduced || r.essential;
  const ok = errors.length === 0 && walk.monotonic && walk.reversible && walk.bigFixed.length === 0 && !walk.overflowX && hitOk.every(Boolean)
    && Object.values(jumps).every(j => j.done) && (staticExpected ? walk.boundaryCount === 0 : walk.active > 0);
  results.push({ run: r.name, ok, ...walk, jumps, hitOk, errors });
  await ctx.close();
}
await browser.close();
console.log(JSON.stringify(results, null, 1));
process.exit(results.every(r => r.ok) ? 0 : 1);
