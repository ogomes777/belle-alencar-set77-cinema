import assert from 'node:assert/strict';
import { chromium } from 'playwright';

/** BELLE V62: only original Originkit WebGL Rotunda, with real live MP4 textures. */
const base=process.env.BASE_URL||'http://127.0.0.1:4173';
const browser=await chromium.launch({headless:true,args:['--no-sandbox','--disable-dev-shm-usage']});
try{
 for(const cfg of [{name:'desktop',width:1280,height:720,mobile:false},{name:'mobile',width:390,height:844,mobile:true}]){
  const context=await browser.newContext({viewport:{width:cfg.width,height:cfg.height},isMobile:cfg.mobile,hasTouch:cfg.mobile});
  await context.addInitScript(()=>{
   try{sessionStorage.setItem('belle:v4:intro','1')}catch{}
   window.open=(url)=>{window.__v62Destination=url;return null};
  });
  const page=await context.newPage(),errors=[];
  page.on('pageerror',e=>errors.push(e.message));
  await page.goto(base+'/?tier=static&gov=off#belle-cidades',{waitUntil:'domcontentloaded'});
  await page.locator('[data-v54-open]').click({force:true});
  await page.waitForFunction(()=>Number(document.querySelector('[data-rotunda-engine]')?.dataset.rotundaPlaying)>0,null,{timeout:55000});
  const first=await page.evaluate(()=>{
   const root=document.querySelector('[data-rotunda-engine]');
   return {engine:root.dataset.rotundaEngine,playing:Number(root.dataset.rotundaPlaying),
    foreground:document.querySelectorAll('.v54-clip-deck video').length,
    deckHidden:getComputedStyle(document.querySelector('.v54-clip-deck')).display,
    glError:root.querySelector('canvas').getContext('webgl')?.getError()};
  });
  assert.equal(first.engine,'originkit-webgl-video');
  assert(first.playing>=2,'Curved WebGL MP4 streams should be playing together');
  assert.equal(first.foreground,0,'Do not create the rejected foreground cards');
  assert.equal(first.deckHidden,'none');
  assert.equal(first.glError,0);
  await page.locator('[data-v54-next]').click({force:true});
  await page.waitForTimeout(700);
  assert(await page.evaluate(()=>Number(document.querySelector('[data-rotunda-engine]').dataset.rotundaPlaying))>=2);
  const backgrounds=[];
  for(const theme of ['light','dark','rose']){
   await page.evaluate(t=>document.documentElement.dataset.belleTheme=t,theme);
   backgrounds.push(await page.locator('#belleV54FilmDialog').evaluate(e=>getComputedStyle(e).backgroundColor));
  }
  assert.equal(new Set(backgrounds).size,3,'Glass camera backdrop must follow Belle themes');
  await page.locator('[data-v54-select]').selectOption('frutal');
  await page.waitForFunction(()=>document.querySelector('[data-rotunda-engine]')&&Number(document.querySelector('[data-rotunda-engine]').dataset.rotundaPlaying)>0,null,{timeout:45000});
  assert.equal(await page.locator('[data-v54-dialog-city]').textContent(),'Belle Frutal');
  await page.locator('[data-v54-select]').selectOption('ibia');
  const ibia=await page.evaluate(()=>({open:document.querySelector('#belleV54FilmDialog').open,destination:window.__v62Destination}));
  assert.equal(ibia.open,false);
  assert.equal(ibia.destination,'https://www.instagram.com/bellealencar.ibia/');
  assert.deepEqual(errors,[]);
  console.log('PASS',cfg.name,JSON.stringify({first,backgrounds,ibia}));
  await context.close();
 }
}finally{await browser.close();}
