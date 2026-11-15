/* BELLE V65 | Regression for shared PREVIEWS / FAQ background and vertical flip.
   Run with BASE_URL=http://localhost:4173 node tests/e2e/belle-v65-seamless-chapters.mjs
   Requires Playwright Chromium in the QA environment.
*/
import assert from 'node:assert/strict';
import { chromium } from 'playwright';
const browser=await chromium.launch({headless:true,args:['--no-sandbox','--disable-dev-shm-usage']});
const base=process.env.BASE_URL||'http://127.0.0.1:4173';
try{
 for(const device of [{label:'desktop',width:1440,height:900,mobile:false},
                      {label:'mobile',width:390,height:844,mobile:true}]){
  const context=await browser.newContext({viewport:{width:device.width,height:device.height},
    isMobile:device.mobile,hasTouch:device.mobile});
  await context.addInitScript(()=>{try{sessionStorage.setItem('belle:v4:intro','1')}catch{}});
  const page=await context.newPage(),errors=[];
  page.on('pageerror',e=>errors.push(e.message));
  await page.goto(base+'/?tier=static&gov=off#belle-previews',{waitUntil:'domcontentloaded'});
  await page.locator('#belle-previews').scrollIntoViewIfNeeded();
  await page.locator('[data-rotunda-engine="originkit-webgl-video"]').waitFor({timeout:40000});
  const themeBackgrounds=[];
  for(const theme of ['light','dark','rose']){
   await page.evaluate(t=>document.documentElement.dataset.belleTheme=t,theme);
   const computed=await page.evaluate(()=>{
    const preview=document.getElementById('belle-previews');
    const faq=document.getElementById('duvidas');
    const shell=preview.parentElement;
    return {shared:shell===faq.parentElement && shell.classList.contains('v65-seamless-chapters'),
      sectionPreview:getComputedStyle(preview).backgroundColor,
      sectionFaq:getComputedStyle(faq).backgroundColor,
      imageFaq:getComputedStyle(faq).backgroundImage,
      imagePreview:getComputedStyle(preview).backgroundImage,
      shellBackground:getComputedStyle(shell).background,
      arrowVisible:getComputedStyle(document.querySelector('#belle-previews [data-v54-next]')).opacity,
      overflow:document.documentElement.scrollWidth-innerWidth};
   });
   assert(computed.shared,'Both chapters must share one background layer');
   assert.equal(computed.sectionPreview,'rgba(0, 0, 0, 0)');
   assert.equal(computed.sectionFaq,'rgba(0, 0, 0, 0)');
   assert.equal(computed.imageFaq,'none');
   assert.equal(computed.imagePreview,'none');
   assert.equal(computed.overflow,0);
   themeBackgrounds.push(computed.shellBackground);
  }
  assert.equal(new Set(themeBackgrounds).size,3,'Theme surface must change for each choice');
  const flip=page.locator('[data-v64-title-flip]');
  await flip.click({force:true});
  assert.equal(await flip.evaluate(el=>getComputedStyle(el).animationName),'v65-preview-vertical-flip');
  await page.waitForFunction(()=>document.querySelector('[data-rotunda-engine]')?.dataset.rotundaPlaying==='27',null,{timeout:70000});
  await page.locator('#belle-previews [data-v54-next]').click({force:true});
  assert.deepEqual(errors,[]);
  console.log('PASS',device.label,'seamless three themes, vertical title, videos still running');
  await context.close();
 }
}finally{await browser.close();}
