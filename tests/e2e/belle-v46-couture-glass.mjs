/** Belle V46 real Chromium checks: 4 translucent couture cards, luxury CTA,
 * scrolling/video DOM preserved, theme/mobile geometry and all four locales.
 * Automated QA is functional; human visual review still matters for polish.
 */
import {createRequire} from 'node:module';
const require=createRequire(import.meta.url);
const {chromium}=require('playwright');
const base=process.env.BASE||'http://127.0.0.1:4173';
const check=(v,msg)=>{if(!v)throw Error(msg)};
const browser=await chromium.launch({headless:true,args:[
 '--use-angle=swiftshader','--enable-unsafe-swiftshader','--disable-dev-shm-usage'
]});
try{
 for(const width of [360,390,768,1440]){
  const mobile=width<=390;
  const ctx=await browser.newContext({
    viewport:{width,height:mobile?844:width===768?1024:900},
    isMobile:mobile,hasTouch:mobile,reducedMotion:'reduce'
  });
  const page=await ctx.newPage();const errors=[];
  page.on('pageerror',e=>errors.push(e.message));
  await page.addInitScript(()=>{
   try{sessionStorage.setItem('belle:v4:intro','1')}catch{}
  });
  await page.goto(base+'/?tier=static#como-comprar',{
    waitUntil:'domcontentloaded',timeout:45000
  });
  await page.locator('#como-comprar .how__collection-cta__icon svg').waitFor({
    state:'attached',timeout:18000
  });
  await page.evaluate(()=>document.fonts?.ready);
  for(const theme of ['light','dark','rose']){
   const v=await page.evaluate(theme=>{
    document.documentElement.dataset.belleTheme=theme;
    document.documentElement.dataset.intensity='cinematic';
    document.documentElement.classList.remove('perf-lite');
    const root=document.querySelector('#como-comprar');
    const steps=[...root.querySelectorAll('.how__steps>li')];
    const btn=root.querySelector('.how__collection-cta');
    const rect=el=>{
      const b=el.getBoundingClientRect();
      return {x:b.x,y:b.y,w:b.width,h:b.height,r:b.right,bot:b.bottom}
    };
    const cards=steps.map(card=>{
      const s=getComputedStyle(card);
      const c=s.backgroundColor;
      const title=card.querySelector('h3'),copy=card.querySelector('p');
      return {rgba:c,backdrop:s.backdropFilter,webkitBackdrop:s.webkitBackdropFilter,
       bg:s.backgroundImage,rad:s.borderRadius,outline:s.outlineStyle,
       border:s.borderColor,title:getComputedStyle(title).color,
       copy:getComputedStyle(copy).color,
       text:copy.textContent,rect:rect(card),
       t:rect(title),p:rect(copy),
       hasLumen:!!card.querySelector('.how__lumen')};
    });
    const a=getComputedStyle(btn);
    const before=getComputedStyle(btn,'::before');
    return {
      cards,cta:{
        href:btn.getAttribute('href'),text:btn.textContent.trim(),
        hasIcon:!!btn.querySelector('svg path'),size:rect(btn),
        bg:a.backgroundImage,border:a.borderColor,
        color:a.color,animation:before.animationName,focusable:btn.tabIndex===0,
        parent:btn.closest('.how__foot')!==null
      },
      count:root.querySelectorAll('.how__steps>li').length,
      video:!!root.querySelector('[data-how-video]'),
      cardVarsDeclared:[...document.styleSheets].some(ss=>{
        try{return [...ss.cssRules].some(r=>r.cssText.includes('--how-card-scale'))}
        catch{return false}
      }),
      grid:getComputedStyle(root.querySelector('.how__steps')).gridTemplateColumns.split(' ').length,
      overflow:document.documentElement.scrollWidth-innerWidth,
      theme:document.documentElement.dataset.belleTheme
    };
   },theme);
   const key=width+'/'+theme;
   check(v.count===4&&v.cards.length===4,'Cards missing '+key);
   check(v.video,'Original scroll-synced video missing '+key);
   check(v.cta.href==='#colecao','Collection CTA destination changed '+key);
   check(v.cta.text==='Explorar a coleção','Collection CTA label changed '+key);
   check(v.cta.parent&&v.cta.hasIcon&&v.cta.focusable,'CTA broken '+key);
   check(v.cta.size.h>=50&&v.cta.size.w>=160,'CTA undersized '+key);
   check(v.cta.bg.includes('gradient'),'Luxury CTA finish not applied '+key);
   check(v.overflow<=2,'Horizontal overflow '+key+': '+v.overflow);
   check(v.grid===(width<600?1:width<=900?2:4),'Unexpected card grid '+key+': '+v.grid);
   for(const [i,card] of v.cards.entries()){
     check(card.bg.includes('radial-gradient'),'Glass highlight missing '+key+'/'+i);
     check(card.backdrop.includes('blur')||card.webkitBackdrop.includes('blur'),
        'Glass blur disabled by legacy V18 rule '+key+'/'+i+': '+card.backdrop);
     const match=card.rgba.match(/rgba?\(([^)]+)\)/);
     const alpha=match?.[1]?.split(/,\s*/).map(Number)?.[3]??1;
     check(alpha<0.8,'Card background still opaque '+key+'/'+i+': '+card.rgba);
     check(card.hasLumen,'Original per-card impact light lost '+key+'/'+i);
     check(card.rect.w>110&&card.rect.h>85,'Card collapsed '+key+'/'+i);
     check(card.p.r<=card.rect.r+3,'Card copy overflows '+key+'/'+i);
   }
   console.log('PASS V46',key,'glass + existing choreography + CTA + mobile geometry');
  }
  check(errors.length===0,'JS runtime error '+width+': '+errors.join(' | '));
  await ctx.close();
 }
 const ctx=await browser.newContext({viewport:{width:1280,height:900},reducedMotion:'reduce'});
 const page=await ctx.newPage();
 const locales={pt:'Explorar a coleção',en:'Explore the collection',
  es:'Explorar la colección',it:'Scopri la collezione'};
 for(const [locale,expected] of Object.entries(locales)){
   await page.addInitScript(locale=>{
     try{localStorage.setItem('belle:v31:locale',locale);sessionStorage.setItem('belle:v4:intro','1')}catch{}
   },locale);
   await page.goto(base+'/?tier=static#como-comprar',{waitUntil:'domcontentloaded'});
   await page.waitForFunction(locale=>document.documentElement.lang.startsWith(locale),locale,{timeout:16000});
   const d=await page.locator('#como-comprar .how__collection-cta').evaluate(el=>({
      text:el.querySelector('.how__collection-cta__label')?.textContent.trim(),
      icon:!!el.querySelector('svg path'),href:el.getAttribute('href')
   }));
   check(d.text===expected,'Missing CTA translation '+locale+': '+d.text);
   check(d.icon&&d.href==='#colecao','CTA icon or destination lost after '+locale+' translation');
   console.log('PASS V46 locale',locale);
 }
 await page.locator('#como-comprar .how__collection-cta').evaluate(el=>el.click());
 check(new URL(page.url()).hash==='#colecao','Collection CTA no longer navigates to catalogue');
 await ctx.close();
}finally{await browser.close()}
