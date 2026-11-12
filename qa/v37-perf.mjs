/** Frame-time probe while scrolling through boundaries (390px, CPU 4x slower).
 *  node qa/v37-perf.mjs <baseUrl>  → avg / p95 / worst frame ms, long tasks. */
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const { chromium } = require('playwright');
const base = process.argv[2] || 'http://localhost:4173';
const b = await chromium.launch();
const ctx = await b.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true, deviceScaleFactor: 2 });
const OFF = process.env.VEILS === 'off';
await ctx.addInitScript(() => sessionStorage.setItem('belle:v4:intro', '1'));
const p = await ctx.newPage();
await p.goto(base + '/?tier=static', { waitUntil: 'load' });
await p.waitForTimeout(1000);
// VEILS=off hides only the V37 veils (same build, same JS), isolating their render cost.
if (OFF) await p.addStyleTag({ content: '.v37-veil{display:none!important}' });
const cdp = await ctx.newCDPSession(p);
await cdp.send('Emulation.setCPUThrottlingRate', { rate: 4 });
const out = {};
for (const sel of ['#ocasioes', '#colecao', '#atendimento', '#duvidas', '.finale']) {
  out[sel] = await p.evaluate(async (sel) => {
    const el = document.querySelector(sel);
    const top = el.getBoundingClientRect().top + scrollY;
    const from = top - innerHeight * 1.05, to = top + innerHeight * .1;
    scrollTo(0, from); await new Promise(r => setTimeout(r, 300));
    let long = 0; const po = new PerformanceObserver(l => { long += l.getEntries().length; });
    try { po.observe({ type: 'longtask', buffered: false }); } catch {}
    const frames = []; let last = performance.now();
    const steps = 60;
    for (let i = 0; i <= steps; i++) {
      scrollTo(0, from + (to - from) * i / steps);
      await new Promise(r => requestAnimationFrame(r));
      const now = performance.now(); frames.push(now - last); last = now;
    }
    po.disconnect();
    frames.shift(); frames.sort((a, b) => a - b);
    const avg = frames.reduce((a, b) => a + b, 0) / frames.length;
    return { avg: +avg.toFixed(1), p95: +frames[Math.floor(frames.length * .95)].toFixed(1), worst: +frames.at(-1).toFixed(1), longTasks: long };
  }, sel);
}
await b.close();
console.log(base + (OFF ? '#off' : '#on'), JSON.stringify(out));
