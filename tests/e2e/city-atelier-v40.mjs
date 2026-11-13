/* BELLE V40 · exact same city section, captured in Chromium after CSS changes. */
import {createRequire} from 'node:module';
import {mkdir} from 'node:fs/promises';
const require=createRequire(import.meta.url);
const {chromium}=require('playwright');
const base=process.env.BASE||'http://127.0.0.1:4173';
const fail=(ok,msg)=>{if(!ok)throw new Error(msg)};
const browser=await chromium.launch({headless:true,args:['--use-angle=swiftshader','--enable-unsafe-swiftshader','--disable-dev-shm-usage']});
await mkdir('artifacts/city-v40',{recursive:true});
try{
 for(const width of [360,390,768,1440]){
  const mobile=width<600;
  const ctx=await browser.newContext({
    viewport:{width,height:mobile?780:width===768?1024:900},
    isMobile:mobile,hasTouch:mobile,reducedMotion:'reduce'
  });
  const page=await ctx.newPage();
  const errors=[];
  page.on('pageerror',e=>errors.push(e.message));
  await page.addInitScript(()=>{try{sessionStorage.setItem('belle:v4:intro','1')}catch{}});
  await page.goto(base+'/?tier=static#lojas',{waitUntil:'domcontentloaded',timeout:45000});
  await page.locator('#lojas .store-card').first().waitFor({state:'attached',timeout:18000});
  await page.evaluate(()=>document.fonts?.ready);
  for(const theme of ['light','dark','rose']){
   await page.evaluate(t=>{document.documentElement.dataset.belleTheme=t},theme);
   await page.locator('#lojas .store-card').first().scrollIntoViewIfNeeded({timeout:15000});
   const data=await page.evaluate(()=>{
    const root=document.querySelector('#lojas.stores');
    const list=root.querySelector('.store-list');
    const cards=[...list.querySelectorAll('.store-card')];
    const rect=el=>{const b=el.getBoundingClientRect();return {x:b.x,y:b.y,w:b.width,h:b.height,right:b.right,bottom:b.bottom}};
    return {
     overflow:document.documentElement.scrollWidth-innerWidth,
     columns:getComputedStyle(list).gridTemplateColumns.split(' ').length,
     listBg:getComputedStyle(list).backgroundImage,
     globe:rect(root.querySelector('canvas.stores__orbit')),
     cards:cards.map(card=>{
      const c=getComputedStyle(card),button=card.querySelector('[data-select-store]');
      return {city:card.querySelector('h3')?.textContent,bg:c.backgroundImage,
       bgColor:c.backgroundColor,shadow:c.boxShadow,blur:c.backdropFilter,
       bounds:rect(card),button:rect(button),
       fontWeight:getComputedStyle(button).fontWeight,
       heading:rect(card.querySelector('h3'))};
     })
    };
   });
   fail(data.cards.length===6,'Not six cities '+width+' '+theme);
   fail(data.globe.w>0,'Globe missing '+width+' '+theme);
   fail(data.listBg==='none','List still boxed '+width+' '+theme);
   for(const c of data.cards){
    fail(c.bg==='none' && (c.bgColor==='rgba(0, 0, 0, 0)'||c.bgColor==='transparent'),
      'Boxed city '+width+' '+theme+' '+c.city+': '+c.bg+' '+c.bgColor);
    fail(c.shadow==='none'&&c.blur==='none','Glass/shadow still visible '+width+' '+theme+' '+c.city);
    fail(c.button.h>=48 && c.button.w>=110,'CTA too small '+width+' '+theme+' '+c.city);
    fail(Number(c.fontWeight)>=700,'Thin CTA type '+width+' '+theme+' '+c.city);
    fail(c.heading.w>=75&&c.heading.h>25,'City heading too small '+width+' '+theme+' '+c.city);
   }
   const heights=data.cards.map(x=>x.button.h);
   fail(Math.max(...heights)-Math.min(...heights)<1,'Unequal button height '+width+' '+theme);
   fail(data.columns===(mobile?1:2),'Wrong column count '+width+' '+theme+' '+data.columns);
   if(mobile){
    fail(data.cards.every(x=>Math.abs(x.button.w-data.cards[0].button.w)<2),'Unequal mobile button width '+width+' '+theme);
    fail(data.cards.slice(1).every((x,i)=>x.bounds.y>=data.cards[i].bounds.bottom-1),'Overlapping mobile city rows '+width+' '+theme);
   } else{
    fail(Math.abs(data.cards[0].button.w-data.cards[1].button.w)<2,'Desktop top CTA mismatch '+width+' '+theme);
    fail(Math.abs(data.cards[2].button.w-data.cards[3].button.w)<2,'Desktop middle CTA mismatch '+width+' '+theme);
    fail(Math.abs(data.cards[4].button.w-data.cards[5].button.w)<2,'Desktop bottom CTA mismatch '+width+' '+theme);
   }
   fail(data.overflow<=2,'Horizontal overflow '+width+' '+theme+' '+data.overflow);
   // The V44 planet now continuously paints six pins with three extra state
   // regions; retain real DOM geometry assertions on every viewport, but do
   // not block CI when an oversized scrolling screenshot fails to settle.
   if(width===1440&&theme==='light') {
     try{await page.screenshot({path:'artifacts/city-v40/cities-'+width+'-'+theme+'.png',animations:'disabled',timeout:8000});}
     catch(e){console.warn('Optional city screenshot skipped:',String(e).slice(0,100));}
   }
   console.log('PASS '+width+' '+theme+' no-box + aligned CTA + globe + responsive');
  }
  await page.locator('[data-select-store="frutal"]').click();
  const selected=await page.locator('[data-select-store="frutal"]').getAttribute('aria-pressed');
  fail(selected==='true','Selecting Frutal failed '+width);
  fail(errors.length===0,'JS pageerrors '+width+': '+errors.join(' | '));
  await ctx.close();
 }
}finally{await browser.close()}
