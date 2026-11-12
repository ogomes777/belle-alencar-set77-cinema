/**
 * V36 CLEANUP / assert that V35/V33 and the V8 secondary overlay are gone.
 * Existing film, commerce, video scroll, 3D carousel, stores still run.
 */
import {createRequire} from 'node:module';
const require=createRequire(import.meta.url);
let chromium;
try{({chromium}=require('playwright'))}
catch{({chromium}=require('/opt/node-tools/node_modules/playwright'))}
const base=process.env.BASE||'http://127.0.0.1:4173';
const browser=await chromium.launch({headless:true,args:['--use-angle=swiftshader','--enable-unsafe-swiftshader']});
const sectionIds=['inicio','porta','sala','vestido','detalhe','categorias','provador',
                  'passarela','ocasioes','colecao','como-comprar','lojas','atendimento','duvidas'];
const fail=(message)=>{throw new Error(message)};
const check=async(page,where)=>{
  const state=await page.evaluate(()=>{
    const forbidden=['#belleMicroStage','.bm35-stage','.bm35-copy','.ct33-wipe',
                     '.ct33-panel','.md-runway-veil','.md-scene','.md-reveal'];
    return {
      forbidden:forbidden.filter(s=>document.querySelector(s)),
      cssDirector:document.documentElement.classList.contains('md-motion'),
      cssV35:document.documentElement.classList.contains('bm35-mounted'),
      width:document.documentElement.scrollWidth,
      viewport:document.documentElement.clientWidth,
      filmChapters:document.querySelectorAll('.film .chapter').length,
      sections:['passarela','ocasioes','colecao','como-comprar','lojas','atendimento','duvidas']
        .every(id=>!!document.getElementById(id)),
      catalogCount:document.querySelectorAll('.pgrid .pcard').length,
      topLayers:[...document.querySelectorAll('body > *')].filter(el=>el.id==='belleMicroStage')
        .length
    };
  });
  if(state.forbidden.length||state.cssDirector||state.cssV35||state.topLayers)
    fail(where+' lingering global overlays: '+JSON.stringify(state));
  if(state.width>state.viewport+1)
    fail(where+' horizontal overflow: '+JSON.stringify(state));
  if(state.filmChapters!==7||!state.sections||state.catalogCount<1)
    fail(where+' original content missing: '+JSON.stringify(state));
};
try{
  for(const width of [360,390,768,1440]){
    const height=width===1440?900:width===768?1024:844;
    const context=await browser.newContext({viewport:{width,height},isMobile:width<900,hasTouch:width<900});
    const page=await context.newPage();
    await page.addInitScript(()=>{try{sessionStorage.setItem('belle:v4:intro','1')}catch{}});
    const errors=[];page.on('pageerror',e=>errors.push(e.message));
    await page.goto(base+'/?tier=static',{waitUntil:'load'});
    await page.waitForTimeout(250);
    await check(page,'initial '+width);
    for(const id of sectionIds){
      await page.evaluate(id=>{
        const el=document.getElementById(id);
        el?.scrollIntoView({block:'center',behavior:'instant'});
      },id);
      await page.evaluate(()=>new Promise(resolve=>requestAnimationFrame(resolve)));
      await check(page,width+' '+id);
    }
    // Real commerce interaction: the catalog remains clickable, not a blank curtain.
    const first=page.locator('#colecao .pcard__title [data-qv]').first();
    await first.scrollIntoViewIfNeeded();
    await first.click({timeout:6000});
    if(!(await page.locator('.qv').isVisible()))fail(width+' quick view blocked');
    await page.keyboard.press('Escape');
    if(errors.length)fail(width+' javascript errors: '+errors.join(' | '));
    await context.close();
    console.log('PASS '+width+'px clean scroll: no V35/V33/V8 overlays; real film, catalog, quickview intact');
  }
  const context=await browser.newContext({viewport:{width:390,height:844},reducedMotion:'reduce'});
  const page=await context.newPage();
  await page.goto(base+'/?tier=static',{waitUntil:'load'});
  await check(page,'reduced-motion');
  await context.close();
  console.log('PASS reduced motion: content always visible, no global overlay');
}finally{await browser.close()}
