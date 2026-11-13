/** BELLE V49 · Real Chromium geometry + theme + motion QA.
 * Structural/cross-theme assertions do not claim subjective visual approval.
 */
import {createRequire} from 'node:module';
const require=createRequire(import.meta.url);
const {chromium}=require('playwright');
const base=process.env.BASE||'http://127.0.0.1:4173';
const check=(condition,msg)=>{if(!condition)throw new Error(msg)};
const ids=['inicio','porta','sala','vestido','detalhe','categorias','provador'];
const browser=await chromium.launch({headless:true,args:[
 '--use-angle=swiftshader','--enable-unsafe-swiftshader','--disable-dev-shm-usage'
]});
try{
 for(const width of [320,390,768,1440]){
  const mobile=width<900, height=width===320?700:width===390?844:width===768?1024:900;
  const context=await browser.newContext({
    viewport:{width,height},isMobile:width<=390,hasTouch:width<=390,
    reducedMotion:'reduce'
  });
  const page=await context.newPage();
  const exceptions=[];page.on('pageerror',e=>exceptions.push(e.message));
  await page.addInitScript(()=>{try{sessionStorage.setItem('belle:v4:intro','1')}catch{}});
  await page.goto(base+'/?tier=static#inicio',{waitUntil:'domcontentloaded',timeout:45000});
  await page.locator('#filme #provador .chapter__card').waitFor({state:'attached',timeout:17000});
  await page.evaluate(()=>document.fonts?.ready);
  for(const theme of ['light','dark','rose']){
   const result=await page.evaluate(theme=>{
    document.documentElement.dataset.belleTheme=theme;
    const cards=[...document.querySelectorAll('#filme .film__chapters .chapter__card')];
    const rect=e=>{
      const b=e.getBoundingClientRect();
      return {left:b.left,right:b.right,width:b.width,height:b.height}
    };
    return {
      rootTheme:document.documentElement.dataset.belleTheme,
      filmResolvedInk:getComputedStyle(document.querySelector('#filme')).getPropertyValue('--v49-ink'),
      darkRuleMatches:document.querySelector('#filme').matches('html[data-belle-theme="dark"] #filme'),
      bodyOverflow:document.documentElement.scrollWidth-innerWidth,
      canvas:document.querySelectorAll('#filmCanvas').length,
      cards:cards.map(c=>{
       const st=getComputedStyle(c);
       const id=c.closest('article').id;
       const h=c.querySelector('.display');
       return {
         id,rect:rect(c),radius:parseFloat(st.borderTopLeftRadius),
         blur:st.backdropFilter||st.webkitBackdropFilter,
         surface:st.backgroundImage,base:st.backgroundColor,
         text:getComputedStyle(h).color,
         scrollHeight:c.scrollHeight,clientHeight:c.clientHeight,
         maxHeight:st.maxHeight,
         categories:[...c.querySelectorAll('.portal-list button')].map(x=>({
           height:x.getBoundingClientRect().height,
           key:x.getAttribute('data-filter-category')
         })),
         options:c.querySelectorAll('.fitting__choice').length,
       };
      }),
      goCollection:document.querySelector('#inicio .btn[href="#colecao"]')!==null,
      selectStore:document.querySelector('#inicio button[data-open-store]')!==null,
      gridCols:getComputedStyle(document.querySelector('#categorias .portal-list')).gridTemplateColumns.split(' ').length
    };
   },theme);
   const label=width+'px '+theme;
   check(result.canvas===1,'film canvas missing '+label);
   check(result.cards.map(x=>x.id).join(',')===ids.join(','),'7 film chapters changed '+label);
   check(result.goCollection&&result.selectStore,'hero actions lost '+label);
   check(result.bodyOverflow<=2,'horizontal overflow '+label+' '+result.bodyOverflow);
   check(result.gridCols===2,'category grid must have 2 columns '+label);
   for(const c of result.cards){
     const key=label+' #'+c.id;
     const maxWidth=mobile?333:c.id==='inicio'?500:c.id==='provador'?435:405;
     check(c.rect.width<=maxWidth,'card too wide '+key+' '+c.rect.width);
     check(c.rect.width>140,'card too narrow '+key);
     check(c.radius>=(mobile?20:23),'not rounded '+key+' '+c.radius);
     check(c.surface.includes('radial-gradient'),'missing optical glass layers '+key);
     check(c.blur.includes('blur'),'old opaque flat panel not replaced '+key);
     check(c.base.includes('rgba('),'surface lacks transparency '+key);
     if(mobile){
       const ratio=c.id==='inicio'?.46:c.id==='provador'?.49:.43;
       check(c.rect.height<=height*ratio+2,'card obscures film '+key+' h='+c.rect.height);
       check(c.scrollHeight>=c.clientHeight,'overflow content not reachable '+key);
     }
     if(theme==='dark'){
       check(c.base.includes('25, 15, 19')||c.base.includes('25,15,19'),
         'dark card must be warm smoke not gray '+key+' '+c.base);
       check(c.text.includes('255, 241, 226'),'dark text lost contrast '+key+' '+c.text+' root='+result.rootTheme+' var='+result.filmResolvedInk+' match='+result.darkRuleMatches+' bg='+c.base);
     }
   }
   check(result.cards.find(x=>x.id==='categorias').categories.length===8,
     '8 categories missing '+label);
   check(result.cards.find(x=>x.id==='categorias').categories.every(x=>x.height>=43.5),
     'category touch targets too small '+label);
   console.log('PASS V49 responsive optical glass',label,'all seven cards, dark warmth, 2-column categories');
  }
  check(exceptions.length===0,'JavaScript exceptions '+width+' '+exceptions.join(' | '));
  await context.close();
 }
 // Standard-motion observer: entering a card should perform a brief impact
 // and re-arm after it leaves the viewport; reverse scroll remains native.
 const context=await browser.newContext({viewport:{width:390,height:844},reducedMotion:'no-preference'});
 const page=await context.newPage();
 await page.addInitScript(()=>{try{sessionStorage.setItem('belle:v4:intro','1')}catch{}});
 await page.goto(base+'/?tier=static#inicio',{waitUntil:'domcontentloaded',timeout:45000});
 const card=page.locator('#porta .chapter__card');
 await page.evaluate(()=>document.getElementById('porta').scrollIntoView({block:'center',behavior:'instant'}));
 await card.waitFor({state:'attached'});
 await page.waitForFunction(()=>document.querySelector('#porta .chapter__card').classList.contains('is-glass-appeared'),null,{timeout:15000});
 let active=await card.evaluate(el=>el.getAnimations().some(a=>a instanceof Animation &&
    a.effect instanceof KeyframeEffect && a.effect.getKeyframes().length===3));
 check(active,'V49 three-step cinematic WAAPI entrance not triggered');
 await page.evaluate(()=>window.scrollTo({top:document.documentElement.scrollHeight,behavior:'instant'}));
 await page.waitForFunction(()=>!document.querySelector('#porta .chapter__card').classList.contains('is-glass-appeared'),null,{timeout:15000});
 await page.evaluate(()=>document.getElementById('porta').scrollIntoView({block:'center',behavior:'instant'}));
 await page.waitForFunction(()=>document.querySelector('#porta .chapter__card').classList.contains('is-glass-appeared'),null,{timeout:15000});
 console.log('PASS V49 reverse-scroll entrance replay');
 await context.close();
 // Reduced motion: only composited optical surface, no moving impact.
 const reduced=await browser.newContext({viewport:{width:390,height:844},reducedMotion:'reduce'});
 const reducedPage=await reduced.newPage();
 await reducedPage.addInitScript(()=>{try{sessionStorage.setItem('belle:v4:intro','1')}catch{}});
 await reducedPage.goto(base+'/?tier=static#inicio',{waitUntil:'domcontentloaded'});
 await reducedPage.evaluate(()=>document.getElementById('porta').scrollIntoView({block:'center',behavior:'instant'}));
 await reducedPage.waitForFunction(()=>document.querySelector('#porta .chapter__card').classList.contains('is-glass-appeared'),null,{timeout:15000});
 const staticEffect=await reducedPage.locator('#porta .chapter__card').evaluate(el=>({
   own:el.getAnimations().filter(a=>a.effect?.target===el).length,
   glint:getComputedStyle(el.querySelector('.chapter__glint')).animationName
 }));
 check(staticEffect.own===0&&staticEffect.glint==='none','reduced motion should have no landing/glint animation '+JSON.stringify(staticEffect));
 console.log('PASS V49 reduced motion');
 await reduced.close();
}finally{await browser.close()}
