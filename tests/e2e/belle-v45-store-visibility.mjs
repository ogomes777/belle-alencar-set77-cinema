/* V45: reproduce original late-row clip at partial scroll reveal, then
   prove all six city buttons remain inside their naturally sized cards. */
import {createRequire} from 'node:module';
const require=createRequire(import.meta.url);
const {chromium}=require('playwright');
const base=process.env.BASE||'http://127.0.0.1:4173';
const assert=(ok,msg)=>{if(!ok)throw new Error(msg)};
const browser=await chromium.launch({headless:true,args:[
 '--use-angle=swiftshader','--enable-unsafe-swiftshader','--disable-dev-shm-usage'
]});
const ids=['araxa','frutal','catalao','mineiros','ibia','franca'];
try{
 for(const width of [320,360,390,768,1440]){
  const mobile=width<600;
  const ctx=await browser.newContext({
   viewport:{width,height:mobile?780:width===768?1024:900},
   isMobile:mobile,hasTouch:mobile,reducedMotion:'reduce'
  });
  const page=await ctx.newPage();
  const errors=[];
  page.on('pageerror',e=>errors.push(e.message));
  await page.addInitScript(()=>{
    try{sessionStorage.setItem('belle:v4:intro','1')}catch{}
  });
  await page.goto(base+'/?tier=static#lojas',{waitUntil:'domcontentloaded',timeout:45000});
  await page.locator('#lojas [data-store-card="franca"] [data-select-store]').waitFor({state:'attached',timeout:20000});
  await page.evaluate(()=>document.fonts?.ready);
  for(const theme of ['light','dark','rose']){
   await page.evaluate(t=>{
    document.documentElement.dataset.belleTheme=t;
    document.documentElement.classList.add('md-motion');
    document.querySelector('#lojas').classList.add('stores--scrubbed');
    document.querySelector('#lojas').classList.remove('md-in');
    for(const card of document.querySelectorAll('#lojas .store-card')){
     card.classList.add('md-reveal');
     card.style.setProperty('--stores-reveal','0.31');
    }
   },theme);
   const data=await page.evaluate(()=>{
    const section=document.querySelector('#lojas');
    const list=section.querySelector('.store-list');
    const cards=[...list.querySelectorAll('.store-card')];
    const r=e=>{const b=e.getBoundingClientRect();return {top:b.top,bottom:b.bottom,left:b.left,right:b.right,w:b.width,h:b.height};};
    return {
      overflow:document.documentElement.scrollWidth-innerWidth,
      columns:getComputedStyle(list).gridTemplateColumns.split(' ').length,
      canvas:section.querySelectorAll('canvas.stores__orbit').length,
      cases:cards.map(card=>{
       const btn=card.querySelector('[data-select-store]');
       const map=card.querySelector('.store-card__map');
       const addr=card.querySelector('.store-card__addr');
       return {id:card.dataset.storeCard,card:r(card),btn:r(btn),map:r(map),addr:r(addr),
        clip:getComputedStyle(card).clipPath,
        overflow:getComputedStyle(card).overflow,
        btnText:btn.textContent.trim(),
        btnHeight:getComputedStyle(btn).height,
        cardHeight:getComputedStyle(card).height,
        visible:btn.getClientRects().length>0,
       };
      })
    };
   });
   assert(data.canvas===1,'Original globe was replaced '+width+' '+theme);
   assert(JSON.stringify(data.cases.map(c=>c.id))===JSON.stringify(ids),'City list changed '+width+' '+theme);
   assert(data.columns===(mobile?1:2),'Incorrect grid columns '+width+' '+theme);
   assert(data.overflow<=2,'Horizontal overflow '+width+' '+theme+': '+data.overflow);
   for(const c of data.cases){
    const key=width+'px / '+theme+' / '+c.id;
    assert(c.visible,'CTA not rendered '+key);
    assert(c.clip==='none','Card partial scroll reveal is clipping CTA '+key+': '+c.clip);
    assert(c.overflow==='visible','Card still masks children '+key);
    assert(c.btn.h>=52,'CTA too short '+key);
    assert(c.btn.bottom<=c.card.bottom-6,
      'CTA exceeds/gets cropped by card bottom '+key+': '+JSON.stringify(c));
    assert(c.btn.top>=c.card.top,'CTA overlaps card top '+key);
    assert(c.btn.left>=c.card.left-1&&c.btn.right<=c.card.right+1,
      'CTA width exceeds card '+key);
    assert(c.map.bottom<=c.btn.top+1,'Map link overlaps CTA '+key);
    assert(c.addr.bottom<=c.map.top+1,'Address overlaps map link '+key);
    assert(c.btnText.length>5,'CTA text missing '+key);
   }
   if(mobile){
    for(let i=1;i<data.cases.length;i++){
      assert(data.cases[i].card.top>=data.cases[i-1].card.bottom-1,
       'Mobile city cards overlap '+width+' '+theme+' '+data.cases[i].id);
    }
    assert(data.cases.every(c=>Math.abs(c.btn.w-data.cases[0].btn.w)<2),
      'Mobile CTA widths differ '+width+' '+theme);
   }
   console.log('PASS '+width+' '+theme+' all six cards fully visible, no crop, correct mobile flow');
  }
  assert(errors.length===0,'Unexpected JS runtime errors '+width+': '+errors.join(' | '));
  await ctx.close();
 }
}finally{await browser.close()}
