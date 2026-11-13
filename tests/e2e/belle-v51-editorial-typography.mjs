/* BELLE V51 — font coverage, motion and responsive QA */
import {createRequire} from 'node:module';
const require=createRequire(import.meta.url);
const {chromium}=require('playwright');
const base=process.env.BASE||'http://127.0.0.1:4173';
const assert=(cond,msg)=>{if(!cond)throw Error(msg)};
const browser=await chromium.launch({headless:true,args:['--use-angle=swiftshader','--enable-unsafe-swiftshader','--disable-dev-shm-usage']});
const names=['Gebuk','Allesya','Savage Roses','Wasted Vindey','Playfair Display'];
try{
 for(const width of [320,390,768,1440]){
  const height=width===320?700:width===390?844:width===768?1024:900;
  const context=await browser.newContext({viewport:{width,height},reducedMotion:'reduce'});
  const page=await context.newPage();
  await page.addInitScript(()=>{sessionStorage.setItem('belle:v4:intro','1')});
  const errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.goto(base+'/?tier=static',{waitUntil:'domcontentloaded',timeout:45000});
  await page.locator('#finaleTitle').waitFor({state:'attached'});
  const results=await page.evaluate((names)=>{
   const own=e=>[...e.childNodes].some(n=>n.nodeType===3&&n.textContent?.trim());
   const textEls=[...document.body.querySelectorAll('*')].filter(e=>e instanceof HTMLElement && own(e));
   const bad=textEls.filter(el=>!names.some(name=>getComputedStyle(el).fontFamily.includes(name))).slice(0,8).map(el=>el.outerHTML.slice(0,160));
   const check=selector=>{
    const el=document.querySelector(selector);
    return el?getComputedStyle(el).fontFamily:null;
   };
   const rect=selector=>{const r=document.querySelector(selector).getBoundingClientRect();return {width:r.width,height:r.height}};
   return {bad,count:textEls.length,
    selected:{
     intro:check('.intro__signature-ink'),hero:check('#inicio .display'),
     italic:check('#inicio .display em'),collection:check('#colecaoTitle'),
     product:check('.pcard__title')??check('.store-card h3'),ui:check('.store-pill__label'),body:check('#como-comprar .lede')
    },overflow:document.documentElement.scrollWidth-innerWidth,
    film:rect('#inicio .chapter__card'),mobile:innerWidth<900
   };
  },names);
  assert(results.bad.length===0,'Unmapped typography '+width+' '+results.bad.join('|'));
  assert(results.count>150,'Too few on-screen text nodes '+results.count);
  assert(results.selected.intro.includes('Allesya'),'Signature family');
  assert(results.selected.hero.includes('Wasted Vindey'),'Editorial hero family');
  assert(results.selected.italic.includes('Allesya'),'Calligraphic phrase');
  assert(results.selected.collection.includes('Savage Roses'),'Campaign serif family');
  assert(results.selected.product?.includes('Playfair Display'),'Catalog/store serif family');
  assert(results.selected.ui.includes('Gebuk'),'CTA family');
  assert(results.selected.body.includes('Playfair Display'),'Body reading family');
  assert(results.overflow<=3,'Horizontal overflow '+width+' '+results.overflow);
  if(width<900)assert(results.film.width<=286,'Mobile film geometry regression '+width);
  assert(errors.length===0,'JS exceptions '+width+': '+errors.join('|'));
  console.log('PASS V51',width,'width,',results.count,'text nodes, five roles, no overflow');
  await context.close();
 }
 const context=await browser.newContext({viewport:{width:390,height:844},reducedMotion:'no-preference'});
 const page=await context.newPage();
 await page.addInitScript(()=>{sessionStorage.setItem('belle:v4:intro','1')});
 await page.goto(base+'/?tier=static',{waitUntil:'domcontentloaded',timeout:45000});
 await page.evaluate(()=>document.querySelector('#colecaoTitle').scrollIntoView({block:'center',behavior:'instant'}));
 await page.waitForFunction(()=>document.querySelector('#colecaoTitle').dataset.typoAnimated==='true',{timeout:12000});
 await page.evaluate(()=>document.querySelector('#finaleTitle').scrollIntoView({block:'center',behavior:'instant'}));
 await page.waitForFunction(()=>document.querySelector('#finaleTitle').dataset.typoAnimated==='true',{timeout:12000});
 console.log('PASS V51 dynamic heading reveal and reverse-friendly observer');
 await context.close();
 const reduced=await browser.newContext({viewport:{width:390,height:844},reducedMotion:'reduce'});
 const p=await reduced.newPage();
 await p.addInitScript(()=>{sessionStorage.setItem('belle:v4:intro','1')});
 await p.goto(base+'/?tier=static',{waitUntil:'domcontentloaded'});
 await p.evaluate(()=>document.querySelector('#colecaoTitle').scrollIntoView({block:'center',behavior:'instant'}));
 const quiet=await p.locator('#colecaoTitle').evaluate(el=>el.dataset.typoAnimated!=='true');
 assert(quiet,'Reduced motion enabled typographic animation');
 await reduced.close();console.log('PASS V51 reduced motion');
}finally{await browser.close()}
