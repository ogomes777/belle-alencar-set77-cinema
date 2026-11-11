/** BELLE · SET77 · Round Occasion Carousel V9 browser acceptance.
 * CI: npm run preview + node tests/e2e/occasions-round.mjs
 */
import { createRequire } from 'node:module';
const require=createRequire(import.meta.url);
let chromium;
try{({chromium}=require('playwright'));}
catch{({chromium}=require('/opt/node-tools/node_modules/playwright'));}
const browser=await chromium.launch({args:['--use-angle=swiftshader','--enable-unsafe-swiftshader']});
const base=process.env.BASE||'http://127.0.0.1:4173';
let total=0;
function check(ok,label){
  if(!ok)throw new Error('FAIL '+label);
  console.log('PASS '+label);total++;
}
try{
  for(const width of [360,390,768,1440]){
    const mobile=width<900;
    const context=await browser.newContext({
      viewport:{width,height:width===768?1024:width===1440?900:844},
      isMobile:mobile,hasTouch:mobile
    });
    const page=await context.newPage();
    await page.addInitScript(()=>sessionStorage.setItem('belle:v4:intro','1'));
    const errors=[];
    page.on('pageerror',e=>errors.push(e.message));
    await page.goto(base+'/?tier=static',{waitUntil:'domcontentloaded'});
    await page.locator('#ocasioes').scrollIntoViewIfNeeded();
    const round=page.locator('[data-occ-round]');
    await page.waitForFunction(()=>document.querySelector('[data-occ-round]')?.classList.contains('is-round'),null,{timeout:9000});
    check(await round.locator('.occ-card').count()===3,width+': three authentic occasion cards');
    const mapping={
      dia:'billie-look-05.webp',
      noite:'billie-look-04.webp',
      celebrar:'billie-look-06.webp'
    };
    for(const [occasion,file] of Object.entries(mapping)){
      const img=round.locator('.occ-card[data-occasion="'+occasion+'"] .occ-card__model');
      check((await img.getAttribute('src'))?.endsWith(file),width+': '+occasion+' uses the correct existing Billie look');
    }
    check(await round.locator('.occ-card__world').count()===3,width+': three atmospheric scenes are mounted');
    check(await round.locator('.occ-card__portrait').count()===3,width+': three portrait layers break out of their cards');
    check(await round.locator('.occ-card.is-active .occ-card__portrait').evaluate(el=>{
      const p=el.getBoundingClientRect(), c=el.closest('.occ-card').getBoundingClientRect();
      return p.top<c.top-8 && getComputedStyle(el).pointerEvents==='none';
    }),width+': foreground model rises above the card without intercepting input');
    check(await round.locator('.occ-card__model').evaluateAll(imgs=>imgs.every(img=>img.getAttribute('src')?.startsWith('/assets/belle/billie/'))),width+': only the local optimized editorial portraits are used');

    check(await round.locator('.occ-card.is-active').count()===1,width+': one active category');
    if(width===1440){
      await page.waitForFunction(()=>document.querySelector('[data-occ-round]')?.dataset.autoOrbit==='running',null,{timeout:8000});
      const before=await round.locator('.occ-card[data-occasion="dia"]').evaluate(el=>getComputedStyle(el).transform);
      await page.waitForTimeout(680);
      const after=await round.locator('.occ-card[data-occasion="dia"]').evaluate(el=>getComputedStyle(el).transform);
      check(before!==after,width+': infinite orbit advances continuously without user interaction');
    }
    check((await round.locator('.occ-card.is-active').getAttribute('data-occasion'))==='dia',width+': default active moment is day');
    check(await round.locator('.occ-card').evaluateAll(els=>els.some(el=>getComputedStyle(el).transform.startsWith('matrix3d('))),width+': side panels use 3D perspective without new canvas');
    check(await round.locator('.occ-card a[data-filter-occasion]').count()===3,width+': original commercial filters preserved');
    check(await round.locator('.occ-card .editorial-cutout').count()===6,width+': paired original product images still rendered');
    check(await page.locator('#ocasioes canvas').count()===0,width+': no extra Three.js canvas');
    check(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),width+': no horizontal page overflow');

    await round.locator('[data-occ-next]').click();
    await page.waitForFunction(()=>document.querySelector('.occ-round__stage')?.dataset.activeIndex==='1',null,{timeout:6000});
    check((await round.locator('.occ-card.is-active').getAttribute('data-occasion'))==='noite',width+': next arrow selects evening');
    await page.waitForFunction(()=>document.querySelector('[data-occ-counter]')?.textContent?.trim()==='02 / 03',null,{timeout:6000});
    check(await round.locator('.occ-card a[data-filter-occasion][tabindex="0"]').count()===1,width+': only active CTA is in keyboard sequence');
    await round.locator('[data-occ-prev]').click();
    await page.waitForFunction(()=>document.querySelector('[data-occ-counter]')?.textContent?.trim()==='01 / 03',null,{timeout:6000});
    check((await round.locator('.occ-card.is-active').getAttribute('data-occasion'))==='dia',width+': back arrow returns to day');

    await round.locator('.occ-round__stage').focus();
    await page.keyboard.press('ArrowLeft');
    await page.waitForFunction(()=>document.querySelector('[data-occ-counter]')?.textContent?.trim()==='03 / 03',null,{timeout:6000});
    check((await round.locator('.occ-card.is-active').getAttribute('data-occasion'))==='celebrar',width+': keyboard wraps to celebration');
    await page.keyboard.press('ArrowRight');
    await page.waitForFunction(()=>document.querySelector('[data-occ-counter]')?.textContent?.trim()==='01 / 03',null,{timeout:6000});
    check((await round.locator('.occ-card.is-active').getAttribute('data-occasion'))==='dia',width+': keyboard returns to day');

    // The commercial action must still filter/navigate rather than rotating.
    await round.locator('.occ-card.is-active [data-filter-occasion]').click();
    // The commerce module intentionally prevents the native hash jump and
    // applies the catalog occasion filter while scrolling to its section.
    await page.waitForFunction(()=>document.querySelector('#catalogMount [data-occ="dia"]')?.getAttribute('aria-pressed')==='true',null,{timeout:6000});
    check(await page.locator('#catalogMount [data-occ="dia"]').getAttribute('aria-pressed')==='true',width+': active shopping CTA applies the original catalog filter');
    check(errors.length===0,width+': no JavaScript runtime errors '+errors.join(';'));
    await context.close();
  }
  const reduce=await browser.newContext({viewport:{width:390,height:844},reducedMotion:'reduce'});
  const rp=await reduce.newPage();
  await rp.goto(base+'/?tier=static',{waitUntil:'domcontentloaded'});
  check(!(await rp.locator('[data-occ-round]').evaluate(el=>el.classList.contains('is-round'))),'reduced motion preserves original three-card grid');
  check(await rp.locator('.occ-card__portrait').first().isHidden(),'reduced motion does not show breakout portraits');

  check(await rp.locator('.occ-card [data-filter-occasion]').count()===3,'reduced motion exposes all 3 shopping actions');
  await reduce.close();

  const ess=await browser.newContext({viewport:{width:390,height:844}});
  const ep=await ess.newPage();
  await ep.addInitScript(()=>sessionStorage.setItem('belle:v4:intro','1'));
  await ep.goto(base+'/?tier=static',{waitUntil:'domcontentloaded'});
  // The carousel is intentionally code-split and mounts only near the section.
  await ep.locator('#ocasioes').scrollIntoViewIfNeeded();
  await ep.waitForFunction(()=>document.querySelector('[data-occ-round]')?.classList.contains('is-round'),null,{timeout:10000});
  await ep.evaluate(()=>document.getElementById('directorToggle')?.click());
  await ep.waitForFunction(()=>!document.querySelector('[data-occ-round]')?.classList.contains('is-round'));
  check(await ep.locator('.occ-card [data-filter-occasion]').count()===3,'essential mode restores static accessible occasion cards');
  check(await ep.locator('.occ-card [data-filter-occasion][aria-hidden="true"]').count()===0,'essential mode restores all clickable links');
  await ess.close();
  console.log('PASSED '+total+' occasion carousel checks');
}finally{await browser.close();}
