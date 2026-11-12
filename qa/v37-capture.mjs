/**
 * V37 QA capture: per-boundary screenshots at entry stages (0, .5, 1) and
 * a scroll-down/scroll-up video. Usage:
 *   node qa/v37-capture.mjs <baseUrl> <label> [outDir]
 * Example: node qa/v37-capture.mjs http://localhost:4174 v36 docs/qa-v37/baseline
 */
import { createRequire } from 'node:module';
import { mkdir, rename, readdir, writeFile } from 'node:fs/promises';
const require = createRequire(import.meta.url);
const { chromium } = require('playwright');

const [base = 'http://localhost:4173', label = 'v37', out = 'docs/qa-v37/shots'] = process.argv.slice(2);
const VIDEO = process.env.VIDEO === '1';
await mkdir(out, { recursive: true });
const sections = ['#passarela', '#ocasioes', '#colecao', '#como-comprar', '#lojas', '#atendimento', '#duvidas', '.finale'];
const viewports = [{ name: '1440', width: 1440, height: 900 }, { name: '390', width: 390, height: 844, isMobile: true, hasTouch: true }];
const browser = await chromium.launch({ args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
const report = [];
const race = (pr, ms = 15000) => Promise.race([pr, new Promise(r => setTimeout(() => r('timeout'), ms))]);
async function shot(page, path) {
  const cdp = await page.context().newCDPSession(page);
  const { data } = await cdp.send('Page.captureScreenshot', { format: 'png' });
  await writeFile(path, Buffer.from(data, 'base64')); await cdp.detach();
}
for (const vp of viewports) {
  const ctx = await browser.newContext({
    viewport: { width: vp.width, height: vp.height }, deviceScaleFactor: 1, isMobile: !!vp.isMobile, hasTouch: !!vp.hasTouch,
    ...(VIDEO ? { recordVideo: { dir: `${out}/_video`, size: { width: vp.width, height: vp.height } } } : {}),
  });
  await ctx.addInitScript(() => { try { sessionStorage.setItem('belle:v4:intro', '1'); } catch {} });
  const page = await ctx.newPage();
  const errors = [];
  page.on('pageerror', e => errors.push(String(e)));
  await page.goto(base + '/', { waitUntil: 'load' });
  await page.waitForTimeout(1200);
  if (VIDEO) {
    // Continuous scroll down then up, with mid-boundary pauses.
    const total = await page.evaluate(() => document.documentElement.scrollHeight - innerHeight);
    for (let y = 0; y <= total; y += vp.height / 9) { await page.evaluate(v => scrollTo(0, v), y); await page.waitForTimeout(70); }
    for (let y = total; y >= 0; y -= vp.height / 6) { await page.evaluate(v => scrollTo(0, v), y); await page.waitForTimeout(70); }
  } else {
    for (const sel of sections) {
      const slug = sel.replace(/[#.]/g, '');
      for (const stage of [0.15, 0.5, 1]) {
        // stage = how far the incoming section top has travelled up the viewport.
        await race(page.evaluate(([s, k]) => {
          const el = document.querySelector(s); if (!el) return;
          const top = el.getBoundingClientRect().top + scrollY;
          scrollTo(0, top - innerHeight * (1 - k * 0.98));
        }, [sel, stage]));
        await page.waitForTimeout(stage === 1 ? 900 : 450);
        if (await race(shot(page, `${out}/${label}-${vp.name}-${slug}-${String(stage).replace('.', '')}.png`)) === 'timeout') errors.push(`shot timeout ${slug} ${stage}`);
      }
    }
    const audit = await race(page.evaluate(() => ({
      overflowX: document.documentElement.scrollWidth > innerWidth + 1,
      fixedOverlays: [...document.querySelectorAll('body *')].filter(n => { const c = getComputedStyle(n); return c.position === 'fixed' && n.getBoundingClientRect().width >= innerWidth * .9 && n.getBoundingClientRect().height >= innerHeight * .9 && c.display !== 'none' && c.visibility !== 'hidden' && +c.opacity > 0.05; }).map(n => n.className || n.tagName),
    })), 20000);
    report.push({ vp: vp.name, errors, ...audit });
  }
  await ctx.close();
  if (VIDEO) {
    const files = await readdir(`${out}/_video`);
    for (const f of files) if (f.endsWith('.webm') && !f.startsWith(label)) await rename(`${out}/_video/${f}`, `${out}/${label}-${vp.name}-scroll-down-up.webm`);
  }
}
await browser.close();
console.log(JSON.stringify(report, null, 1));
