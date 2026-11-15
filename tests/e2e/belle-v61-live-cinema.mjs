/**
 * Belle V61: six city film UX / browser regression.
 * Run against the Vite preview: node tests/e2e/belle-v61-live-cinema.mjs
 * Requires Playwright Chromium installed in the QA environment.
 */
import { chromium } from 'playwright';
import assert from 'node:assert/strict';
const base=process.env.BASE_URL||'http://127.0.0.1:4173';
const browser=await chromium.launch({headless:true,args:['--no-sandbox','--disable-dev-shm-usage']});
try{
 for(const p of [
  {name:'desktop',viewport:{width:1440,height:900},mobile:false,expected:5},
  {name:'mobile',viewport:{width:390,height:844},mobile:true,expected:3}
 ]){
  const context=await browser.newContext({viewport:p.viewport,isMobile:p.mobile,hasTouch:p.mobile});
  await context.addInitScript(()=>{
   try{sessionStorage.setItem('belle:v4:intro','1')}catch{}
   window.open=(url)=>{window.__cinemaOutbound=url;return null};
  });
  const page=await context.newPage();const errors=[];
  page.on('pageerror',e=>errors.push(e.message));
  await page.goto(base+'/?tier=static&gov=off#belle-cidades',{waitUntil:'domcontentloaded'});
  await page.evaluate(()=>document.querySelector('#belle-cidades').scrollIntoView({block:'center',behavior:'instant'}));
  await page.locator('[data-v54-open]').click({force:true});
  await page.waitForFunction(n=>document.querySelectorAll('.v54-film-dialog[open] .v54-clip video').length===n,p.expected,{timeout:30000});
  await page.waitForTimeout(1300);
  const playing=await page.evaluate(()=>{
   const vs=[...document.querySelectorAll('.v54-film-dialog .v54-clip video')];
   window.__clipRetained=document.querySelector('.v54-clip[data-offset="0"] video');
   return {count:vs.length,playing:vs.filter(v=>!v.paused).length,initialTime:window.__clipRetained.currentTime,loop:vs.every(v=>v.loop&&v.muted&&v.playsInline)};
  });
  assert.equal(playing.count,p.expected,p.name+' video count');
  assert.equal(playing.playing,p.expected,p.name+' simultaneous playback');
  assert(playing.loop,p.name+' automatic muted loops');
  await page.locator('[data-v54-next]').click({force:true});
  await page.waitForTimeout(250);
  const continuity=await page.evaluate(()=>({
   retained:window.__clipRetained.isConnected,
   offset:window.__clipRetained.closest('.v54-clip')?.dataset.offset,
   paused:window.__clipRetained.paused,
   now:window.__clipRetained.currentTime
  }));
  assert.equal(continuity.retained,true,'the current video should not be unmounted on next');
  assert.equal(continuity.offset,'-1','the playing video should move to its adjacent panel');
  assert.equal(continuity.paused,false,'retained video must continue playing');
  assert(continuity.now>=playing.initialTime,'video time should not restart on next');
  await page.locator('[data-v54-select]').selectOption('frutal');
  assert.equal(await page.locator('[data-v54-dialog-city]').textContent(),'Belle Frutal');
  assert.equal(await page.locator('.v54-clip video').count(),p.expected);
  await page.locator('[data-v54-select]').selectOption('ibia');
  const redirected=await page.evaluate(()=>({dialog:document.querySelector('#belleV54FilmDialog').open,link:window.__cinemaOutbound}));
  assert.equal(redirected.dialog,false);
  assert.equal(redirected.link,'https://www.instagram.com/bellealencar.ibia/');
  assert.deepEqual(errors,[]);
  console.log('PASS',p.name,playing,continuity,redirected);
  await context.close();
 }
}finally{await browser.close();}
