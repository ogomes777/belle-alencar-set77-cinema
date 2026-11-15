/** Belle V55: real browser regression across desktop and mobile.
 * Hardware FPS depends on the user device; this checks behavioral stability.
 */
import {createRequire} from 'node:module';
const require=createRequire(import.meta.url);
const {chromium}=require('playwright');
const base=process.env.BASE||'http://127.0.0.1:4173';
const assert=(ok,why)=>{if(!ok)throw Error(why)};
const browser=await chromium.launch({headless:true,args:['--use-angle=swiftshader','--enable-unsafe-swiftshader','--disable-dev-shm-usage']});
try{
 for(const width of [390,1440]){
  const mobile=width===390;
  const context=await browser.newContext({viewport:{width,height:mobile?844:900},isMobile:mobile,hasTouch:mobile,reducedMotion:'no-preference'});
  const page=await context.newPage();
  const errors=[],phoneRequests=[];
  page.on('pageerror',e=>errors.push(e.message));
  page.on('request',r=>{if(r.url().includes('/belle-v54/phones/'))phoneRequests.push(r.url().split('/').pop())});
  await page.addInitScript(()=>{try{sessionStorage.setItem('belle:v4:intro','1')}catch{}});
  await page.goto(base+'/?tier=static#inicio',{waitUntil:'domcontentloaded',timeout:45000});
  await page.locator('#porta .chapter__card').waitFor({state:'attached',timeout:12000});
  await page.waitForTimeout(700);
  assert(!phoneRequests.some(x=>/frutal|catalao|mineiros|ibia|franca/.test(x)),'Remote city phone assets blocked first-hero rendering: '+phoneRequests);
  assert(documentTitleVisible(await page.title()),'Document title missing');
  await page.evaluate(()=>document.getElementById('porta').scrollIntoView({block:'center',behavior:'instant'}));
  await page.waitForFunction(()=>document.querySelector('#porta .chapter__card')?.classList.contains('is-glass-appeared'),null,{timeout:12000});
  for(let i=0;i<5;i++){
   await page.evaluate(y=>window.scrollBy({top:y,behavior:'instant'}),i%2? -12:12);
   await page.waitForTimeout(100);
   assert(await page.locator('#porta .chapter__card').evaluate(e=>e.classList.contains('is-glass-appeared')),'Caption blinked at threshold '+width);
  }
  await page.evaluate(()=>window.scrollTo({top:document.documentElement.scrollHeight,behavior:'instant'}));
  await page.waitForFunction(()=>!document.querySelector('#porta .chapter__card')?.classList.contains('is-glass-appeared'),null,{timeout:14000});
  await page.evaluate(()=>document.getElementById('porta').scrollIntoView({block:'center',behavior:'instant'}));
  await page.waitForFunction(()=>document.querySelector('#porta .chapter__card')?.classList.contains('is-glass-appeared'),null,{timeout:14000});
  await page.evaluate(()=>document.getElementById('atendimento').scrollIntoView({block:'center',behavior:'instant'}));
  await page.waitForFunction(()=>document.querySelector('#conciergeTitle')?.dataset.typoAnimated==='true',null,{timeout:14000});
  await page.waitForTimeout(900);
  const countBefore=await page.locator('#conciergeTitle').evaluate(e=>e.getAnimations().length);
  await page.evaluate(()=>window.scrollBy({top:40,behavior:'instant'}));
  await page.waitForTimeout(160);
  const countAfter=await page.locator('#conciergeTitle').evaluate(e=>e.getAnimations().length);
  assert(countBefore===0&&countAfter===0,'Editorial typography flashed repeatedly '+width);
  await page.evaluate(()=>document.getElementById('lojas').scrollIntoView({block:'center',behavior:'instant'}));
  await page.locator('#lojas [data-geo-trail] .stores__geo-pick').first().waitFor({timeout:21000});
  assert(await page.locator('#lojas .stores__city-hit').count()===6,'Lazy globe did not initialize six pins '+width);
  assert(errors.length===0,'Browser exceptions '+width+': '+errors.join(' | '));
  console.log('PASS BELLE V55 '+width+'px: hero resource isolation, no text blink, reverse reveal, deferred globe');
  await context.close();
 }
}finally{await browser.close()}
function documentTitleVisible(v){return v.includes('Belle Alencar')}
