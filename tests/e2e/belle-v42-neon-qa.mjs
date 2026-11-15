/** Belle V42: visual and behavioral proof of scoped luxury signature + neon CTAs. */
import {createRequire} from 'node:module';
import {mkdir} from 'node:fs/promises';
const require=createRequire(import.meta.url);
const {chromium}=require('playwright');
const base=process.env.BASE||'http://127.0.0.1:4173';
const assert=(ok,msg)=>{if(!ok)throw new Error(msg)};
const browser=await chromium.launch({headless:true,args:['--use-angle=swiftshader','--enable-unsafe-swiftshader','--disable-dev-shm-usage']});
await mkdir('artifacts/belle-v42',{recursive:true});
const coords=el=>{
 const r=el.getBoundingClientRect();
 return {x:r.x,y:r.y,w:r.width,h:r.height,right:r.right,bottom:r.bottom};
};
try{
 for(const width of [360,390,768,1440]){
  const mobile=width<600;
  const ctx=await browser.newContext({viewport:{width,height:mobile?844:width===768?1024:900},isMobile:mobile,hasTouch:mobile});
  const page=await ctx.newPage();
  const errors=[];
  page.on('pageerror',e=>errors.push(e.message));
  await page.addInitScript(()=>{try{sessionStorage.setItem('belle:v4:intro','1')}catch{}});
  await page.goto(base+'/?tier=static#atendimento-final',{waitUntil:'domcontentloaded',timeout:45000});
  await page.locator('#atendimento .style-reveal__original').waitFor({state:'attached'});
  await page.evaluate(()=>document.fonts?.ready);
  for(const theme of ['light','dark','rose']){
   await page.evaluate(t=>{document.documentElement.dataset.belleTheme=t},theme);
   const v=await page.evaluate(()=>{
    const story=document.querySelector('#atendimento .brand-story');
    const media=document.querySelector('#atendimento [data-concierge-reveal]');
    const a=document.querySelector('.finale__actions .belle-neon--wa');
    const b=document.querySelector('.finale__actions .belle-neon--ig');
    const getrect=el=>{const r=el.getBoundingClientRect();return {x:r.x,y:r.y,w:r.width,h:r.height,right:r.right,bottom:r.bottom}};
    const getButton=el=>({r:getrect(el),
      text:el.textContent.trim(),icon:!!el.querySelector('.belle-neon__icon svg path'),
      iconBox:getrect(el.querySelector('.belle-neon__icon')),
      color:getComputedStyle(el).color,
      border:getComputedStyle(el).borderColor,
      bg:getComputedStyle(el).backgroundImage,
      animation:getComputedStyle(el).animationName,
      strokeAnimation:getComputedStyle(el,'::before').animationName,
      styleLabel:getComputedStyle(el).fontWeight
    });
    const title=story.querySelector('#conciergeTitle'),lead=story.querySelector('.brand-story__lead'),
      paragraph=story.querySelector('.brand-story__paragraph');
    return {
      mediaId:media.id,mediaImage:media.querySelector('.style-reveal__original')?.getAttribute('src'),
      revealCanvas:!!media.querySelector('canvas.style-reveal__canvas'),
      title:title.textContent.trim(),titleWeight:getComputedStyle(title).fontWeight,
      titleFont:getComputedStyle(title).fontFamily,titleSize:parseFloat(getComputedStyle(title).fontSize),
      titleColor:getComputedStyle(title).color,
      leadSize:parseFloat(getComputedStyle(lead).fontSize),
      paraSize:parseFloat(getComputedStyle(paragraph).fontSize),
      paraWeight:getComputedStyle(paragraph).fontWeight,
      paraColor:getComputedStyle(paragraph).color,
      storyline:story.querySelectorAll('.brand-story__paragraph').length,
      storyRect:getrect(story),wa:getButton(a),ig:getButton(b),
      igAttr:b.hasAttribute('data-instagram-directory'),
      waHref:a.getAttribute('href'),
      overflow:document.documentElement.scrollWidth-innerWidth
    };
   });
   assert(v.mediaImage==='/concierge/billie-original.webp'&&v.revealCanvas,'Billie/source/reveal changed');
   assert(v.title.includes('assinatura.')&&v.titleFont.includes('Cormorant'),'Signature type missing '+width+'/'+theme);
   assert(v.titleSize>=48&&v.leadSize>=25&&v.paraSize>=15,'Unreadable editorial typography '+width+'/'+theme);
   assert(v.storyline===2&&v.storyRect.w>0,'Brand-story structure missing '+width+'/'+theme);
   assert(v.waHref==='https://wa.me/message/YYDB5NC7JMUQP1','WhatsApp destination altered');
   assert(v.igAttr,'Instagram chooser trigger missing');
   assert(v.wa.icon&&v.ig.icon&&v.wa.iconBox.w>=19&&v.ig.iconBox.w>=19,'Missing brand icon '+width+'/'+theme);
   assert(v.wa.bg.includes('gradient')&&v.ig.bg.includes('gradient'),'Neon base not applied '+width+'/'+theme);
   assert(v.wa.animation.includes('belle-v42-breathe')&&v.ig.strokeAnimation.includes('belle-v42-orbit'),'Infinite neon not working '+width+'/'+theme);
   assert(v.wa.r.h>=57&&v.ig.r.h>=57,'Undersized CTA '+width+'/'+theme);
   assert(Math.abs(v.wa.r.h-v.ig.r.h)<2,'Unequal CTA heights '+width+'/'+theme);
   assert(v.wa.r.w>110&&v.ig.r.w>110,'Narrow CTA '+width+'/'+theme);
   assert(v.wa.color===v.ig.color,'Inconsistent contrast '+width+'/'+theme);
   assert(v.wa.border!==v.ig.border,'Both neon glows have the same color '+width+'/'+theme);
   assert(v.overflow<=2,'Unexpected horizontal overflow '+width+'/'+theme+': '+v.overflow);
   // Browser viewport captures don't wait for the scroll-linked section to become
   // geometrically stable. The actual scene continues moving in desktop cinematic mode.
   await page.evaluate(()=>document.querySelector('#atendimento .brand-story')?.scrollIntoView({behavior:'instant',block:'center'}));
   await page.screenshot({path:'artifacts/belle-v42/story-'+width+'-'+theme+'.png',animations:'disabled',timeout:35000});
   await page.evaluate(()=>document.querySelector('.finale__copy')?.scrollIntoView({behavior:'instant',block:'center'}));
   await page.screenshot({path:'artifacts/belle-v42/finale-'+width+'-'+theme+'.png',animations:'disabled',timeout:35000});
   console.log('PASS',width,theme,'Billie unchanged, readable type, 2 neon CTAs, aligned buttons');
  }
  await page.locator('.finale__actions [data-instagram-directory]').click({timeout:15000});
  assert(await page.locator('#belleInstagramDialog').evaluate(d=>d.open),'Instagram chooser stopped working '+width);
  await page.keyboard.press('Escape');
  assert(!(await page.locator('#belleInstagramDialog').evaluate(d=>d.open)),'ESC no longer closes Instagram modal '+width);
  assert(errors.length===0,'Page runtime errors '+width+': '+errors.join(' | '));
  await ctx.close();
 }
 const ctx=await browser.newContext({viewport:{width:390,height:844},reducedMotion:'reduce'});
 const page=await ctx.newPage();
 await page.goto(base+'/?tier=static#atendimento-final',{waitUntil:'domcontentloaded',timeout:45000});
 const reduced=await page.evaluate(()=>{
  const btn=document.querySelector('.finale__actions .belle-neon--wa');
  return {name:getComputedStyle(btn).animationName,halo:getComputedStyle(btn,'::before').animationName};
 });
 assert(reduced.name==='none'&&reduced.halo==='none','Neon animation must disable for reduced motion');
 console.log('PASS reduced motion');
 await ctx.close();
}finally{await browser.close()}
