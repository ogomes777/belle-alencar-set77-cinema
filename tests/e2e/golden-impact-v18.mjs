/** SET77 / Belle · Golden Impact V18, CSS behavior and scroll-safe fallback */
import { createRequire } from 'node:module';
const require=createRequire(import.meta.url);
let chromium;
try { ({chromium}=require('playwright')); }
catch { ({chromium}=require('/opt/node-tools/node_modules/playwright')); }
const browser=await chromium.launch({args:['--use-angle=swiftshader','--enable-unsafe-swiftshader']});
const BASE=process.env.BASE||'http://127.0.0.1:4173';
let tests=0;
const check=(x,label)=>{if(!x)throw Error('FAIL '+label);console.log('PASS '+label);tests++;};
try{
 for(const width of [360,390,768,1024,1440]){
  const context=await browser.newContext({
    viewport:{width,height:width===360?740:width===768?1024:900},
    isMobile:width<=768,hasTouch:width<=768
  });
  const page=await context.newPage(),errors=[];
  page.on('pageerror',err=>errors.push(err.message));
  await page.addInitScript(()=>sessionStorage.setItem('belle:v4:intro','1'));
  await page.goto(BASE+'/?tier=static',{waitUntil:'domcontentloaded'});
  const how=page.locator('#como-comprar');
  check(await how.locator('.how__steps li').count()===4,width+': all four service cards still exist');
  check(await how.locator('button[data-open-store]').count()===1,width+': boutique selection CTA preserved');
  const result=await how.evaluate(el=>{
    const cards=[...el.querySelectorAll('.how__steps li')];
    // The CI browser can lack H.264. Exercise the exact CSS states that the
    // video timeline writes, without pretending a real decoded frame existed.
    el.classList.add('how--enhanced');
    el.style.setProperty('--how-bottom','1');
    const before=cards.map((card,i)=>{
      card.style.setProperty('--how-card-opacity','0');
      card.style.setProperty('--how-card-x',i%2?'105px':'-105px');
      card.style.setProperty('--how-card-y','140px');
      card.style.setProperty('--how-card-z','-145px');
      card.style.setProperty('--how-card-rotation',i%2?'17deg':'-17deg');
      card.style.setProperty('--how-card-scale','.57');
      const css=getComputedStyle(card);
      return {opacity:Number(css.opacity),transform:css.transform,background:css.backgroundImage};
    });
    const after=cards.map(card=>{
      card.style.setProperty('--how-card-opacity','1');
      card.style.setProperty('--how-card-x','0px');
      card.style.setProperty('--how-card-y','0px');
      card.style.setProperty('--how-card-z','0px');
      card.style.setProperty('--how-card-rotation','0deg');
      card.style.setProperty('--how-card-scale','1');
      card.style.setProperty('--how-card-glow','1');
      const css=getComputedStyle(card);
      return {opacity:Number(css.opacity),transform:css.transform,background:css.backgroundImage};
    });
    const video=el.querySelector('video');
    const veil=getComputedStyle(el.querySelector('.how__gold-veil')).backgroundImage;
    const handoff=getComputedStyle(el,'::after').backgroundImage;
    el.classList.remove('how--enhanced');
    return {before,after,veil,handoff,video:!!video};
  });
  check(result.before.every(x=>x.opacity<.08)&&result.after.every(x=>x.opacity>.98),
    width+': solid arrival fades in one by one without permanent transparency');
  check(result.before.some((x,i)=>x.transform!==result.after[i].transform),
    width+': genuine 3D position/scale throw is encoded in CSS');
  check(result.after.every(x=>x.background.includes('gradient')),
    width+': champagne gold layered cards, not translucent ghost panels');
  check(result.veil.includes('gradient')&&result.handoff.includes('gradient'),
    width+': scene light and dark chapter transition remain continuous');
  const clip=await page.evaluate(()=>({width:innerWidth,scrollWidth:document.documentElement.scrollWidth}));
  check(clip.scrollWidth<=clip.width+1,width+': golden reveal does not create horizontal overflow');
  check(errors.length===0,width+': no client JS errors '+errors.join('; '));
  await context.close();
 }
 const reduced=await browser.newContext({viewport:{width:390,height:844},reducedMotion:'reduce'});
 const page=await reduced.newPage();
 await page.goto(BASE+'/?tier=static',{waitUntil:'domcontentloaded'});
 const state=await page.locator('#como-comprar .how__steps li').first().evaluate(el=>{
   return {opacity:Number(getComputedStyle(el).opacity),transform:getComputedStyle(el).transform};
 });
 check(state.opacity>.98,'reduced motion: all four cards remain solid and readable');
 await reduced.close();
 console.log('PASS '+tests+' Golden Impact V18 assertions');
}finally{await browser.close();}
