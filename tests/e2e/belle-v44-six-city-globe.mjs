/** Belle V44 six-city globe + map journey QA, real Chromium on 4 viewports x 3 themes. */
import {createRequire} from 'node:module';
import {mkdir} from 'node:fs/promises';
const require=createRequire(import.meta.url);
const {chromium}=require('playwright');
const base=process.env.BASE||'http://127.0.0.1:4173';
const check=(value,msg)=>{if(!value)throw Error(msg)};
const expected=['araxa','frutal','catalao','mineiros','ibia','franca'];
const browser=await chromium.launch({headless:true,args:['--use-angle=swiftshader','--enable-unsafe-swiftshader','--disable-dev-shm-usage']});
await mkdir('artifacts/belle-v44',{recursive:true});
try{
 for(const width of [360,390,768,1440]){
  const mobile=width<=390;
  const context=await browser.newContext({viewport:{width,height:mobile?844:width===768?1024:900},isMobile:mobile,hasTouch:mobile});
  const page=await context.newPage();const errors=[];
  page.on('pageerror',e=>errors.push(e.message));
  await page.addInitScript(()=>{
   try{localStorage.removeItem('belle:v4:store');sessionStorage.setItem('belle:v4:intro','1')}catch{}
  });
  await page.goto(base+'/?tier=static#lojas',{waitUntil:'domcontentloaded',timeout:45000});
  await page.locator('[data-geo-trail] .stores__geo-pick').first().waitFor({timeout:22000});
  await page.evaluate(()=>document.fonts?.ready);
  const shape=await page.evaluate(async()=>{
   const data=await fetch('/geo/boundaries.json').then(r=>r.json());
   return data.find(x=>x.name==='São Paulo'&&x.kind==='state')?.rings?.length??0;
  });
  check(shape>=1,'Missing São Paulo border in source geography');
  for(const theme of ['light','dark','rose']){
    await page.evaluate(t=>{document.documentElement.dataset.belleTheme=t},theme);
    const state=await page.evaluate(()=>{
      const cards=[...document.querySelectorAll('#lojas [data-store-card]')].map(x=>x.dataset.storeCard);
      const groups=[...document.querySelectorAll('#lojas .stores__geo-group')].map(x=>x.textContent.trim());
      const canvas=document.querySelector('#lojas canvas.stores__orbit');
      const mapBtn=document.querySelector('#lojas .stores__enter-map');
      return {cards,groups,
       pins:document.querySelectorAll('#lojas .stores__city-hit').length,
       canvases:document.querySelectorAll('#lojas canvas.stores__orbit').length,
       center:canvas?.getContext('2d')!==null,
       globeParent:canvas?.parentElement?.className,
       mapSvg:!!mapBtn.querySelector('svg path[fill="#4285F4"]'),
       mapLabel:mapBtn.textContent.trim(),
       pending:[...document.querySelectorAll('#lojas .store-card__addr.is-pending')].map(x=>x.textContent.trim()),
       overflow:document.documentElement.scrollWidth-innerWidth
      };
    });
    check(JSON.stringify(state.cards)===JSON.stringify(expected),'Wrong store cards '+width+' '+theme+JSON.stringify(state.cards));
    check(state.groups.length===3&&state.groups[0].includes('Ibiá')&&state.groups[2].includes('Franca'),'State hierarchy missing '+width+' '+theme);
    check(state.pins===6&&state.canvases===1&&state.center,'Globe/pin engine changed '+width+' '+theme);
    check(state.mapSvg&&state.mapLabel.includes('Google Maps'),'Missing real map icon/button');
    check(state.pending.length===2&&state.pending.every(x=>!x.includes('null')),'Incorrect street address gap');
    check(state.overflow<=2,'Horizontal overflow '+width+' '+theme+': '+state.overflow);
    // The real 2D globe continuously repaints. A full-page screenshot can
    // stall in headless SwiftShader while the active globe never settles.
    // The geometry + responsive + semantic assertions above are mandatory;
    // visual snapshot is optional and only attempted once on desktop.
    if(width===1440&&theme==='light'){
      try{
        await page.evaluate(()=>document.querySelector('#lojas')?.scrollIntoView({block:'center',behavior:'instant'}));
        await page.screenshot({path:'artifacts/belle-v44/overview-'+width+'-'+theme+'.png',animations:'disabled',timeout:8000});
      }catch(e){console.warn('Optional globe screenshot skipped:',String(e).slice(0,100));}
    }
    console.log('PASS overview',width,theme,'6 cities 3 states real SP boundary');
  }
  // Check the fully animated CTA once, then suspend active canvas repaints
  // while verifying clicks, dialogs and map links. This is not a product
  // change: the real site continues to animate by default.
  const animated=await page.locator('#lojas .stores__enter-map').evaluate(
    el=>getComputedStyle(el,'::before').animationName);
  check(animated.includes('belle-maps-orbit'),'Maps neon loop missing in full-motion mode '+width);
  await page.evaluate(()=>{document.documentElement.dataset.intensity='essential'});
  page.setDefaultTimeout(12000);
  await page.locator('#lojas .stores__geo-pick').filter({hasText:'Ibiá'}).click({timeout:12000});
  await page.waitForFunction(()=>document.querySelector('[data-geo-trail]')?.textContent.includes('Ibiá')&&!document.querySelector('[data-geo-trail]')?.textContent.includes('Franca'),{timeout:15000});
  let current=await page.evaluate(()=>{
   const trail=document.querySelector('[data-geo-trail]');
   const map=document.querySelector('.stores__enter-map');
   return {trail:trail.textContent,reset:!!trail.querySelector('.stores__geo-reset'),
      mapVisible:!map.hidden,animation:getComputedStyle(map,'::before').animationName,
      mapsTitle:map.getAttribute('aria-label'),
      store:document.querySelector('[data-store-label]')?.textContent};
  });
  check(current.trail.includes('Brasil')&&current.trail.includes('Minas Gerais')&&current.trail.includes('Ibiá'),'Ibiá breadcrumb is incomplete');
  check(current.store==='Ibiá','Ibiá not selected in commerce');
  check(current.mapVisible&&current.animation==='none','Maps CTA missing / essential-mode fallback not working');
  await page.locator('.stores__enter-map').click({timeout:15000});
  await page.waitForFunction(()=>!!document.querySelector('.stores-map[open]'));
  const map=await page.evaluate(()=>({title:document.querySelector('.stores-map h2').textContent,desc:document.querySelector('.stores-map__address').textContent,url:document.querySelector('.stores-map iframe').src}));
  check(map.title.includes('Ibiá')&&map.desc.includes('endereço da loja a confirmar'),'Ibiá map must not invent address');
  check(decodeURIComponent(map.url).includes('Ibiá'),'Ibiá map coordinates/search missing');
  await page.locator('.stores-map form button').click();
  await page.locator('.stores__geo-reset').click();
  check(await page.locator('.stores__geo-pick').count()===6,'Overview reset should reveal all six');
  await page.locator('.stores__geo-pick').filter({hasText:'Franca'}).click();
  await page.waitForFunction(()=>document.querySelector('[data-geo-trail]')?.textContent.includes('São Paulo')&&document.querySelector('[data-store-label]')?.textContent==='Franca');
  await page.locator('.stores__enter-map').click({timeout:16000});
  await page.waitForFunction(()=>!!document.querySelector('.stores-map[open]'));
  const franca=await page.evaluate(()=>({text:document.querySelector('.stores-map__address').textContent,url:document.querySelector('.stores-map iframe').src}));
  check(franca.text.includes('Franca')&&!franca.text.includes('null'),'Franca address must not be fabricated');
  check(decodeURIComponent(franca.url).includes('Franca')&&decodeURIComponent(franca.url).includes('São Paulo'),'Franca map outside correct state');
  if(width===1440){
    try{await page.screenshot({path:'artifacts/belle-v44/franca-'+width+'.png',animations:'disabled',timeout:8000});}
    catch(e){console.warn('Optional Franca screenshot skipped:',String(e).slice(0,100));}
  }
  await page.locator('.stores-map form button').click();
  check(errors.length===0,'Runtime exceptions '+width+': '+errors.join(' | '));
  console.log('PASS interactive',width,'Ibiá/Franca selection, correct maps, overview reset');
  await context.close();
 }
 const context=await browser.newContext({viewport:{width:390,height:844},reducedMotion:'reduce'});
 const page=await context.newPage();
 await page.addInitScript(()=>{try{localStorage.setItem('belle:v4:store','"ibia"');sessionStorage.setItem('belle:v4:intro','1')}catch{}});
 await page.goto(base+'/?tier=static#lojas',{waitUntil:'domcontentloaded',timeout:45000});
 await page.locator('.stores__enter-map').waitFor();
 const reduced=await page.locator('.stores__enter-map').evaluate(e=>({button:getComputedStyle(e).animationName,border:getComputedStyle(e,'::before').animationName}));
 check(reduced.button==='none'&&reduced.border==='none','Accessibility: map neon must stop under reduced motion');
 console.log('PASS reduced motion');
 await context.close();
}finally{await browser.close()}
