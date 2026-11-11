/** Scroll Couture V16: validates integration of Codex delivery with the V15 glass/search baseline. */
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
let chromium;
try { ({chromium}=require('playwright')); }
catch { ({chromium}=require('/opt/node-tools/node_modules/playwright')); }
const browser=await chromium.launch({args:['--use-angle=swiftshader','--enable-unsafe-swiftshader']});
const base=process.env.BASE||'http://127.0.0.1:4173';
let checks=0;
const check=(pass,message)=>{if(!pass)throw Error('FAIL '+message);console.log('PASS '+message);checks++;};
try {
  const paths=['/media/belle-scroll-desktop.mp4','/media/belle-scroll-mobile.mp4','/media/belle-scroll-poster.webp'];
  for (const path of paths) {
    const response=await fetch(base+path);
    const size=+(response.headers.get('content-length')||0);
    check(response.status===200 && size>18000,'bundled real media served: '+path+' ('+size+' B)');
  }
  for(const width of [360,390,768,1024,1440]){
    const ctx=await browser.newContext({viewport:{width,height:width===360?640:width===390?844:900},isMobile:width<=768,hasTouch:width<=768});
    const page=await ctx.newPage();
    const errors=[];
    page.on('pageerror',err=>errors.push(err.message));
    await page.addInitScript(()=>sessionStorage.setItem('belle:v4:intro','1'));
    await page.goto(base+'/?tier=static&loja=araxa',{waitUntil:'domcontentloaded'});
    const how=page.locator('#como-comprar');
    check(await how.count()===1,width+': exactly one scroll couture scene');
    check(await how.locator('.how__steps li').count()===4,width+': four original commercial steps preserved');
    check(await how.locator('video[data-how-video]').count()===1,width+': native silent video with scroll scrubbing');
    check(await how.locator('.how__poster').count()===1,width+': still poster for no-video fallback');
    check(await how.locator('button[data-open-store]').count()===1,width+': store CTA preserved');
    check(await how.locator('a[href="#colecao"]').count()===1,width+': collection CTA preserved');
    check(await page.locator('#searchButton').count()===1,width+': V15 original search still present');
    await page.evaluate(()=>{const s=document.getElementById('como-comprar');if(s)scrollTo({top:scrollY+s.getBoundingClientRect().top+12,behavior:'instant'});});
    await page.waitForTimeout(600);
    const initial=await how.evaluate(el=>{
       const video=el.querySelector('video'),r=el.getBoundingClientRect();
       return {src:video?.getAttribute('src'),width:r.width,scrollW:document.documentElement.scrollWidth,viewport:innerWidth};
    });
    check(initial.width<=width+2&&initial.scrollW<=width+2,width+': no horizontal overflow at couture scene');
    const expected=width<700?'belle-scroll-mobile.mp4':'belle-scroll-desktop.mp4';
    check(initial.src?.endsWith(expected),width+': adaptive source is '+expected);
    await page.waitForFunction(()=>{
      const v=document.querySelector('#como-comprar video');
      return v && v.readyState>=1 && v.duration>0;
    },{timeout:15000});
    const target=await page.evaluate(()=>{
      const el=document.getElementById('como-comprar');
      return el ? scrollY+el.getBoundingClientRect().top+Math.max(0,el.offsetHeight-innerHeight)*.98 : 0;
    });
    await page.evaluate(target=>scrollTo({top:target,behavior:'instant'}),target);
    await page.waitForTimeout(900);
    const progressed=await how.evaluate(el=>{
      const v=el.querySelector('video');
      return {time:v?.currentTime??-1,interactive:el.classList.contains('how--interactive'),enhanced:el.classList.contains('how--enhanced')};
    });
    check(progressed.enhanced&&progressed.interactive,width+': four cards are revealed and CTAs interactive at scroll end');
    check(progressed.time>0.15,width+': scroll advances actual video playback position');
    const backward=await page.evaluate(()=>{
      const el=document.getElementById('como-comprar');
      return el?scrollY+el.getBoundingClientRect().top+Math.max(0,el.offsetHeight-innerHeight)*.22:0;
    });
    await page.evaluate(target=>scrollTo({top:target,behavior:'instant'}),backward);
    await page.waitForTimeout(950);
    const rewound=await how.locator('video').evaluate(v=>v.currentTime);
    check(rewound<progressed.time-.1,width+': native scroll reverses video');
    check(errors.length===0,width+': no JavaScript errors ('+errors.join('; ')+')');
    await ctx.close();
  }
  const reduced=await browser.newContext({viewport:{width:390,height:844},reducedMotion:'reduce'});
  const page=await reduced.newPage();
  await page.goto(base+'/?tier=static',{waitUntil:'domcontentloaded'});
  const how=page.locator('#como-comprar');
  await how.scrollIntoViewIfNeeded();
  check(!await how.evaluate(el=>el.classList.contains('how--enhanced')),'reduced motion has no sticky scrub');
  check(await how.locator('.how__steps li').count()===4,'reduced motion keeps four readable purchase steps');
  check(await how.locator('button[data-open-store]').isVisible(),'reduced motion keeps store CTA');
  await reduced.close();
  console.log('PASS '+checks+' Scroll Couture V16 assertions');
}finally{await browser.close();}
