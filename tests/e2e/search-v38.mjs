/**
 * V38 browser QA: GB-inspired Belle discovery.
 * Functional search, store routing, quickview, keyboard, theme, mobile.
 * Screenshots are archived for visual approval (not automatically production).
 */
import {createRequire} from 'node:module';
import {mkdir} from 'node:fs/promises';
const require=createRequire(import.meta.url);
let chromium;
try{({chromium}=require('playwright'))}
catch{({chromium}=require('/opt/node-tools/node_modules/playwright'))}
const base=process.env.BASE||'http://127.0.0.1:4173';
const browser=await chromium.launch({headless:true,args:['--use-angle=swiftshader','--enable-unsafe-swiftshader']});
await mkdir('artifacts/belle-search-v38',{recursive:true});
const assert=(state,message)=>{if(!state)throw new Error(message)};
try{
 for(const width of [360,390,768,1440]){
  const ctx=await browser.newContext({viewport:{width,height:width>1000?900:844},isMobile:width<700,hasTouch:width<700});
  const page=await ctx.newPage();
  const errors=[];
  page.on('pageerror',e=>errors.push(e.message));
  await page.addInitScript(()=>{try{sessionStorage.setItem('belle:v4:intro','1')}catch{}});
  await page.goto(base+'/?tier=static',{waitUntil:'load'});
  await page.waitForSelector('#searchDialog',{state:'attached'});
  await page.locator('#searchButton').click();
  const search=page.locator('#searchDialog');
  await search.locator('.ba-v38-suggest-card').first().waitFor({state:'visible'});
  assert(await search.locator('.ba-v38-suggest-card').count()===4,'four references '+width);
  assert(await search.locator('.search-hit--product').count()===8,'eight product starters '+width);
  assert(await search.locator('input#searchInput').evaluate(el=>document.activeElement===el),'autofocus '+width);
  const overflow=await page.evaluate(()=>{
    const p=document.querySelector('#searchDialog .ov__panel');
    return {window:document.documentElement.scrollWidth-document.documentElement.clientWidth,
      panel:p.scrollWidth-p.clientWidth};
  });
  assert(overflow.window<=1&&overflow.panel<=1,'overflow '+width+' '+JSON.stringify(overflow));
  const compact=await page.evaluate(()=>{
    const card=document.querySelector('#searchDialog .search-hit--product');
    const art=card.querySelector('.ba-search-product-image').getBoundingClientRect();
    const info=card.querySelector('.ba-search-product-description').getBoundingClientRect();
    const style=getComputedStyle(card);
    return {display:style.display,direction:style.flexDirection,dy:Math.abs(art.top-info.top),dx:info.left-art.left};
  });
  assert(compact.display==='flex'&&compact.direction==='row'&&compact.dx>25&&compact.dy<28,
    'product results not a compact horizontal row '+width+' '+JSON.stringify(compact));
  await page.screenshot({path:'artifacts/belle-search-v38/default-'+width+'.png',animations:'disabled'});
  await search.locator('#searchInput').fill('vestido preto');
  const matched=search.locator('.search-hit--product');
  assert(await matched.count()>0,'compound search failed '+width);
  await matched.first().click();
  await page.locator('#quickView.is-open').waitFor({state:'visible'});
  assert(await page.locator('#quickView .qv__title').isVisible(),'quickView missing '+width);
  await page.keyboard.press('Escape');
  await page.keyboard.press('Control+k');
  await page.waitForFunction(()=>document.activeElement?.id==='searchInput');
  await search.locator('#searchInput').fill('catalao');
  assert(await search.locator('[data-hit-store="catalao"]').count()===1,'store search failed '+width);
  await search.locator('#searchInput').fill('zzzznonsense');
  assert(await search.locator('.ba-search-empty').isVisible(),'empty result failed '+width);
  await search.locator('.ba-search-clear').click();
  assert(await search.locator('.ba-v38-suggest-card').count()===4,'clear failed '+width);
  await search.locator('[data-search-term="bolsas"]').first().click();
  assert(await search.locator('.search-hit--product').count()>0,'category suggestion failed '+width);
  await page.screenshot({path:'artifacts/belle-search-v38/results-'+width+'.png',animations:'disabled'});
  for(const theme of ['dark','rose']){
    await page.evaluate(value=>document.documentElement.setAttribute('data-belle-theme',value),theme);
    const state=await page.evaluate(()=>{
      const stage=document.querySelector('#searchDialog');
      const panel=stage.querySelector('.ov__panel');
      return {color:getComputedStyle(panel).color,background:getComputedStyle(panel).backgroundColor,
        overflow:panel.scrollWidth-panel.clientWidth};
    });
    assert(state.background!=='rgba(0, 0, 0, 0)'&&state.overflow<=1,theme+' invalid '+width+' '+JSON.stringify(state));
    const visible=await page.evaluate(()=>{
      const el=document.querySelector('#searchDialog .ov__panel');
      const rect=el.getBoundingClientRect();
      const css=getComputedStyle(el);
      const root=document.querySelector('#searchDialog');
      return {open:root.classList.contains('is-open'),hidden:root.hidden,opacity:Number(css.opacity),
        visibility:css.visibility,top:rect.top,left:rect.left,width:rect.width,height:rect.height,
        center:document.elementFromPoint(innerWidth/2,innerHeight/2)?.className};
    });
    assert(visible.open&&!visible.hidden&&visible.opacity>.98&&visible.visibility==='visible'&&visible.width>=width*.92&&visible.height>=760,
      theme+' search panel became hidden '+width+' '+JSON.stringify(visible));

    if(width===390||width===1440)
      await page.screenshot({path:'artifacts/belle-search-v38/'+theme+'-'+width+'.png',animations:'disabled'});
  }
  assert(errors.length===0,'JS errors '+width+' '+errors.join(' | '));
  console.log('PASS '+width+'px: 4 hints, 8 products, ranked query, quickview, store, clear, dark/rose');
  await ctx.close();
 }
 const ctx=await browser.newContext({viewport:{width:390,height:844},reducedMotion:'reduce'});
 const page=await ctx.newPage();
 await page.goto(base+'/?tier=static',{waitUntil:'load'});
 await page.locator('#searchButton').click();
 const result=await page.evaluate(()=>{
  const stage=document.getElementById('searchDialog');
  return {open:stage.classList.contains('is-open'),input:!!stage.querySelector('#searchInput'),
    reduced:matchMedia('(prefers-reduced-motion: reduce)').matches};
 });
 assert(result.open&&result.input&&result.reduced,'reduced-motion search broken');
 console.log('PASS reduced motion');
 await ctx.close();
} finally {await browser.close();}
