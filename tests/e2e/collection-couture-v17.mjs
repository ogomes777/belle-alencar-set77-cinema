/** Belle Alencar / SET77 · V17 product-to-video continuity regression */
import { createRequire } from 'node:module';
const require=createRequire(import.meta.url);
let chromium;
try{({chromium}=require('playwright'));}catch{({chromium}=require('/opt/node-tools/node_modules/playwright'));}
const browser=await chromium.launch({args:['--use-angle=swiftshader','--enable-unsafe-swiftshader']});
const BASE=process.env.BASE||'http://127.0.0.1:4173';
let checks=0;function ok(condition,message){if(!condition)throw Error('FAIL '+message);console.log('PASS '+message);checks++;}
try{
 for(const width of [360,390,768,1024,1440]){
  const context=await browser.newContext({viewport:{width,height:width===768?1024:900},isMobile:width<=768,hasTouch:width<=768});
  const page=await context.newPage(),errors=[];
  page.on('pageerror',e=>errors.push(e.message));
  await page.addInitScript(()=>sessionStorage.setItem('belle:v4:intro','1'));
  await page.goto(BASE+'/?tier=static',{waitUntil:'domcontentloaded'});
  ok(await page.locator('#catalogMount .pcard').count()===48,width+': forty-eight actual catalog cards retained');
  ok(await page.locator('#colecao .collection__handoff').count()===1,width+': one coherent chapter bridge');
  ok(await page.locator('#colecao .collection__handoff h2').textContent().then(x=>x.includes('A Belle cuida')),width+': handoff copy completes the buying narrative');
  ok(await page.locator('#como-comprar video[data-how-video]').count()===1,width+': actual video chapter preserved');
  ok(await page.locator('#como-comprar .how__steps li').count()===4,width+': four commerce steps kept');
  await page.locator('#colecao').scrollIntoViewIfNeeded();
  await page.waitForFunction(()=>document.querySelector('#colecao')?.classList.contains('is-cine-story'),null,{timeout:12000});
  ok(await page.locator('#colecao').evaluate(el=>getComputedStyle(el).paddingBottom==='0px'),width+': collection has no extra bottom padding gap');
  const card=page.locator('#colecao .pcard').first();
  const chrome=await card.evaluate(el=>{
    const css=getComputedStyle(el.querySelector('.pcard__inner'));
    return {radius:parseFloat(css.borderTopLeftRadius),shadow:css.boxShadow,category:el.dataset.category};
  });
  ok(chrome.radius>=12&&chrome.shadow!=='none'&&!!chrome.category,width+': bespoke premium card skin and category');
  ok(await page.locator('#colecao .pcard__microcta').count()===48,width+': each card gets unobtrusive detail cue');
  await page.locator('#colecao .collection__handoff').evaluate(el=>
    el.scrollIntoView({block:'center',behavior:'instant'})
  );
  // Deep-link jumps may coincide with image/layout reflow. Re-align the actual
  // handoff position before asserting scroll progress, not just the first tick.
  await page.waitForTimeout(260);
  let aligned=await page.evaluate(()=>{
    const r=document.querySelector('#colecao .collection__handoff').getBoundingClientRect();
    return r.top<innerHeight*.78&&r.bottom>innerHeight*.1;
  });
  if(!aligned){
    await page.locator('#colecao .collection__handoff').evaluate(el=>el.scrollIntoView({block:'center',behavior:'instant'}));
    await page.waitForTimeout(320);
  }
  await page.waitForFunction(()=>{
    const el=document.getElementById('colecao');
    return Number(el?.style.getPropertyValue('--collection-bridge')||0)>=.1;
  },null,{timeout:3000});
  const seam=await page.evaluate(()=>{
    const a=document.querySelector('#colecao').getBoundingClientRect();
    const b=document.querySelector('#como-comprar').getBoundingClientRect();
    const css=getComputedStyle(document.querySelector('#colecao'));
    const bridge=getComputedStyle(document.querySelector('#colecao .collection__handoff'));
    return {gap:b.top-a.bottom,scrollWidth:document.documentElement.scrollWidth,width:innerWidth,
      bridgeBackground:bridge.backgroundImage,story:css.getPropertyValue('--collection-bridge'),
      handoffTop:document.querySelector('#colecao .collection__handoff').getBoundingClientRect().top,
      scrollY,innerHeight};
  });
  ok(Math.abs(seam.gap)<=3,width+': no visible geometric gap between catalog and next video '+seam.gap);
  ok(seam.scrollWidth<=seam.width+1,width+': no horizontal overflow in chapter handoff');
  ok(Number(seam.story)>=.1,width+': handoff has scroll-driven reveal progress '+JSON.stringify(seam));
  await page.locator('#catalogMount [data-occ="noite"]').click();
  const filtered=await page.locator('#colecao .pcard').count();
  ok(filtered>0&&filtered<48,width+': commerce filters remain live');
  await page.locator('#colecao .pcard__title button').first().click();
  await page.waitForSelector('.qv',{state:'visible',timeout:4500});
  ok(true,width+': card detail button still opens the commercial quick view');
  await page.keyboard.press('Escape');
  ok(errors.length===0,width+': no JavaScript errors: '+errors.join('; '));
  await context.close();
 }
 const reduced=await browser.newContext({viewport:{width:390,height:844},reducedMotion:'reduce'});
 const page=await reduced.newPage();await page.goto(BASE+'/?tier=static',{waitUntil:'domcontentloaded'});
 await page.locator('#colecao').scrollIntoViewIfNeeded();
 ok(!(await page.locator('#colecao').evaluate(el=>el.classList.contains('is-cine-story'))),'reduced-motion fallback leaves copy and cards visible');
 ok(await page.locator('#como-comprar .how__steps li').count()===4,'reduced motion retains all purchase instructions');
 await reduced.close();
 console.log('PASS '+checks+' V17 chapter continuity checks');
}finally{await browser.close();}
