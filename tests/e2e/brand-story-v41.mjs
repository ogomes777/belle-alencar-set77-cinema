/* Belle V41 — actual browser QA, never replaces the existing cinema/3D. */
import {createRequire} from 'node:module';
import {mkdir} from 'node:fs/promises';
const require=createRequire(import.meta.url);
const {chromium}=require('playwright');
const base=process.env.BASE||'http://127.0.0.1:4173';
const assert=(ok,msg)=>{if(!ok)throw Error(msg)};
const urls=[
 'belle.alencar','frutal.bellealencar','catalao.bellealencar',
 'bellealencar.mineiros','bellealencar.ibia','bellealencar.franca',
 'gislayne.alencar','bellealencar_eventos'
];
const browser=await chromium.launch({headless:true,args:['--use-angle=swiftshader','--enable-unsafe-swiftshader','--disable-dev-shm-usage']});
await mkdir('artifacts/belle-v41',{recursive:true});
try{
 for(const width of [390,768,1440]){
  const context=await browser.newContext({
   viewport:{width,height:width===768?1050:width===390?844:900},
   isMobile:width===390,hasTouch:width===390,reducedMotion:'reduce'
  });
  const page=await context.newPage(),errors=[];
  page.on('pageerror',e=>errors.push(e.message));
  await page.addInitScript(()=>{try{sessionStorage.setItem('belle:v4:intro','1')}catch{}});
  await page.goto(base+'/?tier=static#atendimento',{waitUntil:'domcontentloaded',timeout:45000});
  await page.locator('#atendimento [data-concierge-reveal]').waitFor({timeout:16000});
  for(const theme of ['light','dark','rose']){
   await page.evaluate(t=>{document.documentElement.dataset.belleTheme=t},theme);
   const layout=await page.evaluate(()=>{
    const story=document.querySelector('#atendimento'),media=story.querySelector('.style-reveal'),
      finale=document.querySelector('.finale'),service=document.querySelector('#atendimento-final');
    const r=el=>{const b=el.getBoundingClientRect();return{x:b.x,y:b.y,w:b.width,h:b.height}};
    return {originalId:story.id,media:r(media),story:r(story),storyCopy:r(story.querySelector('.brand-story')),
      finale:r(finale),service:r(service),canvas:!!media.querySelector('canvas.style-reveal__canvas'),
      text:story.querySelector('.brand-story__paragraph')?.textContent,
      footer:document.querySelector('.site-footer')?.textContent,
      list:[...document.querySelectorAll('#belleInstagramDialog a[href]')].map(x=>x.getAttribute('href')),
      scrollWidth:document.documentElement.scrollWidth-innerWidth,
      finalTitle:document.querySelector('#finaleTitle')?.textContent,
      menuTarget:document.querySelector('#belleMenuPanel a[href*="atendimento"]')?.getAttribute('href')
    };
   });
   assert(layout.originalId==='atendimento'&&layout.canvas,'Original Billie reveal gone '+width+' '+theme);
   assert(layout.media.w>0&&layout.media.h>0,'Billie media invisible '+width+' '+theme);
   assert(layout.storyCopy.w>0&&layout.storyCopy.h>0,'Brand story invisible '+width+' '+theme);
   assert(layout.text.includes('Gislayne'),'Founder/entrepreneur narrative missing '+width+' '+theme);
   assert(layout.text.includes('Araxá'),'Real city context missing');
   assert(layout.footer.includes('Ibiá')&&layout.footer.includes('Franca'),'New cities absent');
   assert(layout.service.w>0,'Final customer service absent');
   assert(layout.menuTarget==='#atendimento-final','Menu not targeting relocated customer service');
   assert(layout.finalTitle.includes('A próxima escolha'),'Original finale headline lost');
   assert(layout.list.length===8,'Expected all eight supplied Instagram accounts');
   urls.forEach(handle=>assert(layout.list.includes('https://www.instagram.com/'+handle+'/'),'Missing Instagram '+handle));
   assert(layout.scrollWidth<=2,'Horizontal overflow '+width+' '+theme+': '+layout.scrollWidth);
   await page.locator('#atendimento .brand-story').screenshot({
    path:'artifacts/belle-v41/story-'+width+'-'+theme+'.png',
    animations:'disabled',timeout:20000
   });
   await page.locator('.finale__copy').screenshot({
    path:'artifacts/belle-v41/finale-'+width+'-'+theme+'.png',
    animations:'disabled',timeout:20000
   });
   console.log('PASS STORY + FINALE',width,theme);
  }
  // Native focus, Escape, identical directory from both entry points.
  await page.locator('.brand-story [data-instagram-directory]').click({timeout:18000});
  assert(await page.locator('#belleInstagramDialog').evaluate(d=>d.open),'Story chooser did not open '+width);
  await page.screenshot({path:'artifacts/belle-v41/social-'+width+'.png',animations:'disabled'});
  await page.keyboard.press('Escape');
  assert(!(await page.locator('#belleInstagramDialog').evaluate(d=>d.open)),'Escape failed '+width);
  await page.locator('.finale__actions [data-instagram-directory]').click({timeout:18000});
  assert(await page.locator('#belleInstagramDialog').evaluate(d=>d.open),'Finale chooser did not open '+width);
  await page.locator('#belleInstagramDialog .belle-ig-dialog__close').click();
  assert(!(await page.locator('#belleInstagramDialog').evaluate(d=>d.open)),'Close button failed '+width);
  assert(errors.length===0,'JS exceptions '+width+': '+errors.join(' | '));
  await context.close();
 }
 const context=await browser.newContext({viewport:{width:1280,height:800},reducedMotion:'reduce'});
 const page=await context.newPage();
 await page.addInitScript(()=>{try{sessionStorage.setItem('belle:v4:intro','1')}catch{}});
 await page.goto(base+'/?tier=static',{waitUntil:'domcontentloaded'});
 const languageCases={
  en:['The story behind Belle','Fashion with','THE BELLE ALENCAR UNIVERSE','Stores and collections'],
  es:['La historia detrás de Belle','Moda con','EL UNIVERSO BELLE ALENCAR','Tiendas y colecciones'],
  it:['La storia dietro Belle','Moda con','IL MONDO BELLE ALENCAR','Negozi e collezioni'],
  pt:['A história por trás da Belle','Moda com','O UNIVERSO BELLE ALENCAR','Lojas e coleções']
 };
 for(const [lang,expected] of Object.entries(languageCases)){
  await page.evaluate(locale=>{
    localStorage.setItem('belle:v31:locale',locale);
    location.reload();
  },lang);
  await page.waitForFunction(locale=>document.documentElement.lang.startsWith(locale),lang,{timeout:18000});
  const values=await page.evaluate(()=>[
   document.querySelector('#atendimento .brand-story .eyebrow').textContent.trim(),
   document.querySelector('#conciergeTitle').firstChild.textContent.trim(),
   document.querySelector('.belle-ig-dialog__eyebrow').textContent.trim(),
   document.querySelector('.belle-ig-dialog__group-label').textContent.trim()
  ]);
  assert(JSON.stringify(values)===JSON.stringify(expected),'Missing translation '+lang+': '+JSON.stringify(values));
  console.log('PASS LANGUAGE',lang);
 }
 await context.close();
}finally{await browser.close()}
