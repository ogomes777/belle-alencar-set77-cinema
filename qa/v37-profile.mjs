/** CPU profile while scrolling the full page (390px, CPU 4x). Top self-time by function/file.
 *  node qa/v37-profile.mjs <baseUrl> [tierQuery] */
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const { chromium } = require('playwright');
const base = process.argv[2] || 'http://localhost:4173';
const q = process.argv[3] ?? '';
const b = await chromium.launch();
const ctx = await b.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true, deviceScaleFactor: 2 });
await ctx.addInitScript(() => sessionStorage.setItem('belle:v4:intro', '1'));
const p = await ctx.newPage();
await p.goto(base + '/' + q, { waitUntil: 'load' });
await p.waitForTimeout(1500);
const cdp = await ctx.newCDPSession(p);
await cdp.send('Emulation.setCPUThrottlingRate', { rate: 4 });
await cdp.send('Profiler.enable'); await cdp.send('Profiler.setSamplingInterval', { interval: 500 });
await cdp.send('Profiler.start');
const frames = await p.evaluate(async () => {
  const total = document.documentElement.scrollHeight - innerHeight; const f = []; let last = performance.now();
  for (let y = 0; y <= total; y += 40) { scrollTo(0, y); await new Promise(r => requestAnimationFrame(r)); const n = performance.now(); f.push(n - last); last = n; }
  f.sort((a, b) => a - b); return { n: f.length, avg: +(f.reduce((a, b) => a + b, 0) / f.length).toFixed(1), p95: +f[Math.floor(f.length * .95)].toFixed(1), over50: f.filter(x => x > 50).length };
});
const { profile } = await cdp.send('Profiler.stop');
const byId = new Map(profile.nodes.map(n => [n.id, n])); const self = new Map();
const dt = profile.timeDeltas; profile.samples.forEach((id, i) => { const n = byId.get(id); const cf = n.callFrame; const key = `${cf.functionName || '(anon)'} ${(cf.url || '').split('/').pop()}:${cf.lineNumber}`; self.set(key, (self.get(key) || 0) + (dt[i] || 0)); });
const parentOf = new Map(); profile.nodes.forEach(n => (n.children || []).forEach(c => parentOf.set(c, n)));
const callers = new Map(); profile.samples.forEach((id, i) => { const n = byId.get(id); if (!['getBoundingClientRect','offsetTop','offsetHeight','scrollY','pageYOffset'].includes(n.callFrame.functionName) && !(n.callFrame.functionName===''&&n.callFrame.url.includes('gsap')&&n.callFrame.lineNumber===5355)) return; const par = parentOf.get(n.id); const cf = par?.callFrame || {}; const k = `${n.callFrame.functionName||'gsap-scroll'} <- ${cf.functionName||'(anon)'} ${(cf.url||'').split('/').pop()}:${cf.lineNumber}`; callers.set(k,(callers.get(k)||0)+(dt[i]||0)); });
console.log('--- layout readers:'); console.log([...callers.entries()].sort((a,b)=>b[1]-a[1]).slice(0,14).map(([k,v])=>`${(v/1000).toFixed(0).padStart(6)}ms  ${k}`).join('\n'));
const top = [...self.entries()].sort((a, b) => b[1] - a[1]).slice(0, 22).map(([k, v]) => `${(v / 1000).toFixed(0).padStart(6)}ms  ${k}`);
console.log(JSON.stringify(frames)); console.log(top.join('\n'));
await b.close();
