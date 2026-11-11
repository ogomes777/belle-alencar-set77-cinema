/**
 * Belle signature-loader acceptance test.
 * First visit: handwritten Belle + flourish + curtains.
 * Skip, subsequent visits and prefers-reduced-motion must remain fast and safe.
 */
import { createRequire } from 'node:module';
const require=createRequire(import.meta.url);
let chromium;
try { ({chromium}=require('playwright')); } catch { ({chromium}=require('/opt/node-tools/node_modules/playwright')); }
const browser=await chromium.launch({args:['--use-angle=swiftshader','--enable-unsafe-swiftshader']});
const base=process.env.BASE||'http://127.0.0.1:4173';
let count=0;
function check(ok,label){if(!ok)throw new Error(label);console.log('PASS',label);count++;}
try {
  for(const width of [390,1440]) {
    const ctx=await browser.newContext({viewport:{width,height:width===390?844:900}});
    const page=await ctx.newPage();
    const errors=[];
    page.on('pageerror',e=>errors.push(e.message));
    await page.goto(`${base}/?tier=static`,{waitUntil:'domcontentloaded'});
    const signature=page.locator('.intro__signature-ink');
    check(await page.locator('#intro').isVisible(),`${width}: intro visible first visit`);
    check((await signature.textContent())?.trim()==='Belle Alencar',`${width}: signature text accurate`);
    check(await page.locator('.intro__flourish-main').count()===1,`${width}: golden stroke rendered`);
    check(await page.evaluate(()=>getComputedStyle(document.querySelector('.intro__signature-ink')).fontFamily.includes('Allura')),`${width}: calligraphy font selected`);
    check(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),`${width}: no horizontal overflow`);
    await page.waitForFunction(()=>!document.getElementById('intro'),{timeout:6000});
    check(await page.evaluate(()=>document.documentElement.classList.contains('intro-done')),`${width}: opened and cleaned automatically`);
    await page.reload({waitUntil:'domcontentloaded'});
    check(await page.locator('#intro').count()===0,`${width}: no replay within session`);
    check(errors.length===0,`${width}: no page errors: ${errors.join('; ')}`);
    await ctx.close();
  }
  const skipContext=await browser.newContext({viewport:{width:390,height:844}});
  const skipPage=await skipContext.newPage();
  await skipPage.goto(`${base}/?tier=static`,{waitUntil:'domcontentloaded'});
  await skipPage.locator('#introSkip').click();
  check(await skipPage.locator('#intro').count()===0,'manual skip closes immediately');
  await skipContext.close();
  const calmContext=await browser.newContext({viewport:{width:390,height:844},reducedMotion:'reduce'});
  const calmPage=await calmContext.newPage();
  await calmPage.goto(`${base}/?tier=static`,{waitUntil:'domcontentloaded'});
  check(await calmPage.locator('#intro').count()===0,'reduced motion bypasses the loader');
  await calmContext.close();
  console.log(`${count} calligraphy intro checks passed`);
} finally {await browser.close();}
