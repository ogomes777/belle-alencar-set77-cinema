/** SET77 · Belle Collection V13 · Scroll scrub & removal regression.
 * Validates the real dynamic catalog on 4 viewport sizes, not screenshots.
 */
import { createRequire } from 'node:module';
const require=createRequire(import.meta.url);
let chromium;
try{({chromium}=require('playwright'));}
catch{({chromium}=require('/opt/node-tools/node_modules/playwright'));}
const browser=await chromium.launch({args:['--use-angle=swiftshader','--enable-unsafe-swiftshader']});
const base=process.env.BASE||'http://127.0.0.1:4173';
let total=0;
function check(ok,label){if(!ok)throw Error('FAIL '+label);console.log('PASS',label);total++;}
try{
  for(const width of [360,390,768,1440]){
    const mobile=width<900;
    const ctx=await browser.newContext({
      viewport:{width,height:width===768?1024:width===1440?900:844},
      isMobile:mobile,hasTouch:mobile
    });
    const page=await ctx.newPage();
    const errors=[];
    page.on('pageerror',e=>errors.push(e.message));
    await page.addInitScript(()=>sessionStorage.setItem('belle:v4:intro','1'));
    await page.goto(base+'/?tier=static',{waitUntil:'domcontentloaded'});
    check(await page.locator('#looks').count()===0,width+': discontinued Looks section removed');
    check(await page.locator('a[href="#looks"]').count()===0,width+': no dead header navigation');
    check(await page.locator('#catalogMount .pcard').count()===48,width+': all preview products preserved');
    await page.evaluate(()=>document.getElementById('colecao').scrollIntoView({block:'start'}));
    await page.waitForFunction(()=>document.querySelector('#colecao .pgrid')?.classList.contains('is-cine-scroll'),null,{timeout:12000});
    const grid=page.locator('#colecao .pgrid');
    check(await grid.locator('.pcard.is-collection-staged').count()>0,width+': deeper product rows staged below the viewport');
    check(await grid.locator('.pcard').count()===48,width+': reveal does not remove or clone products');
    const next=grid.locator('.pcard.is-collection-staged').last();
    const id=await next.getAttribute('data-product');
    const initialOpacity=await next.evaluate(el=>Number.parseFloat(getComputedStyle(el).opacity));
    check(initialOpacity<.7,width+': unseen product waits for scroll-driven reveal');
    await next.scrollIntoViewIfNeeded();
    await page.waitForFunction(id=>{
      const card=document.querySelector('.pcard[data-product="'+id+'"]');
      return card?.classList.contains('is-collection-revealed') &&
        Number.parseFloat(getComputedStyle(card).opacity)>=.99;
    },id,{timeout:5500});
    check(await grid.locator('.pcard[data-product="'+id+'"] .pcard__media').isVisible(),width+': product appears fully as scroll passes');
    check(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),width+': no horizontal overflow after scroll reveal');

    await page.locator('#catalogMount [data-occ="noite"]').click();
    const filtered=await grid.locator('.pcard').count();
    check(filtered>0&&filtered<48,width+': commercial occasion filter still works');
    check(await grid.locator('.pcard').count()===filtered,width+': no duplicated cards after re-render');
    await grid.locator('.pcard__title [data-qv]').first().click();
    await page.waitForSelector('.qv',{state:'visible',timeout:4500});
    check(true,width+': quick view still opens after filtered reveal');
    await page.keyboard.press('Escape');
    check(errors.length===0,width+': no runtime JS errors '+errors.join(';'));
    await ctx.close();
  }
  const reduce=await browser.newContext({viewport:{width:390,height:844},reducedMotion:'reduce'});
  const rp=await reduce.newPage();
  await rp.goto(base+'/?tier=static',{waitUntil:'domcontentloaded'});
  await rp.locator('#colecao').scrollIntoViewIfNeeded();
  check(!(await rp.locator('#colecao .pgrid').evaluate(el=>el.classList.contains('is-cine-scroll'))),'reduced-motion uses original static catalog grid');
  check(await rp.locator('.pcard').count()===48,'reduced-motion still displays 48 items');
  await reduce.close();

  const essential=await browser.newContext({viewport:{width:1440,height:900}});
  const ep=await essential.newPage();
  await ep.addInitScript(()=>sessionStorage.setItem('belle:v4:intro','1'));
  await ep.goto(base+'/?tier=static',{waitUntil:'domcontentloaded'});
  await ep.locator('#colecao').scrollIntoViewIfNeeded();
  await ep.waitForFunction(()=>document.querySelector('.pgrid')?.classList.contains('is-cine-scroll'));
  await ep.evaluate(()=>document.getElementById('directorToggle')?.click());
  await ep.waitForFunction(()=>!document.querySelector('.pgrid')?.classList.contains('is-cine-scroll'),null,{timeout:3500});
  check(await ep.locator('.pcard.is-collection-staged').count()===0,'essential mode removes staged opacity and transforms');
  check(await ep.locator('.pcard').count()===48,'essential mode preserves catalog content');
  await essential.close();
  console.log('PASS '+total+' collection scroll reveal assertions');
}finally{await browser.close();}
