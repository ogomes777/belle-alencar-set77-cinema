/** SET77 / Belle V19 · fracture/impact bidirectional scroll regression. */
import {createRequire} from 'node:module';
const require=createRequire(import.meta.url);
let chromium;try{({chromium}=require('playwright'));}catch{({chromium}=require('/opt/node-tools/node_modules/playwright'));}
const browser=await chromium.launch({args:['--use-angle=swiftshader','--enable-unsafe-swiftshader']});
const BASE=process.env.BASE||'http://127.0.0.1:4173';
let count=0;const check=(condition,msg)=>{if(!condition)throw Error('FAIL '+msg);console.log('PASS '+msg);count++;};
const cssCard=async(page,id)=>page.locator('#colecao .pgrid .pcard[data-product="'+id+'"]').evaluate(el=>{
 const s=getComputedStyle(el);
 return {opacity:Number(s.opacity),clip:s.clipPath,transform:s.transform,
  staged:el.classList.contains('is-collection-staged'),
  revealed:el.classList.contains('is-collection-revealed'),
  shear:Number.parseFloat(el.style.getPropertyValue('--cr-sheen'))||0};
});
try{
 for(const width of [360,390,768,1024,1440]){
  const mobile=width<=768;
  const ctx=await browser.newContext({viewport:{width,height:width===768?1024:900},
      isMobile:mobile,hasTouch:mobile});
  const page=await ctx.newPage(),errors=[];
  page.on('pageerror',e=>errors.push(e.message));
  await page.addInitScript(()=>sessionStorage.setItem('belle:v4:intro','1'));
  await page.goto(BASE+'/?tier=static',{waitUntil:'domcontentloaded'});
  await page.locator('#colecao').scrollIntoViewIfNeeded();
  await page.waitForFunction(()=>document.querySelector('#colecao .pgrid')?.classList.contains('is-cine-scroll'),null,{timeout:13000});
  const product=page.locator('#colecao .pcard').nth(12);
  const id=await product.getAttribute('data-product');
  const move=async(p)=>{
   await page.evaluate(({id,p})=>{
    const grid=document.querySelector('#colecao .pgrid');
    const card=grid?.querySelector('[data-product="'+id+'"]');
    if(!grid||!card)return;
    const h=innerHeight;
    const travel=Math.max(190,Math.min(h*(innerWidth<=820?.43:.50),420));
    const target=h*.97-p*travel;
    const y=grid.getBoundingClientRect().top+card.offsetTop;
    scrollTo({top:scrollY+y-target,behavior:'instant'});
   },{id,p});
   await page.waitForTimeout(170);
  };
  // Sweep the actual card's document-space entry interval in small
  // scroll increments. This samples the complete opening rather than
  // assuming a single fixed offset, which varies after mobile image decode.
  const span=await page.evaluate(id=>{
    const grid=document.querySelector('#colecao .pgrid');
    const card=grid?.querySelector('[data-product="'+id+'"]');
    if(!grid||!card)return {from:0,to:0};
    const absolute=scrollY+grid.getBoundingClientRect().top+card.offsetTop;
    return {
      from:Math.max(0,absolute-innerHeight*1.22),
      to:Math.max(0,absolute-innerHeight*.08)
    };
  },id);
  let mid=await cssCard(page,id);
  const samples=[];
  for(let step=0;step<=24;step++){
    const target=span.from+(span.to-span.from)*(step/24);
    await page.evaluate(y=>scrollTo({top:y,behavior:'instant'}),target);
    await page.waitForTimeout(76);
    mid=await cssCard(page,id);
    samples.push({step,opacity:mid.opacity,clip:mid.clip.slice(0,18),shear:mid.shear});
    if(mid.staged&&mid.opacity>.07&&mid.opacity<.95&&mid.shear>.01)break;
  }
  check(mid.staged&&mid.opacity>.07&&mid.opacity<.95,width+': one product appears partially fractured during scrolling '+JSON.stringify({span,mid,samples}));
  check(mid.clip.startsWith('polygon('),width+': actual jagged CSS clip mask exposed mid-entrance');
  check(mid.transform!=='none',width+': product shifts/rotates while reassembling');
  check(mid.shear>.01,width+': golden fracture seam follows the visible edge');
  await move(1.20);
  await page.waitForFunction(id=>{
    const el=document.querySelector('#colecao .pgrid .pcard[data-product="'+id+'"]');
    return !!el&&el.classList.contains('is-collection-revealed')&&Number(getComputedStyle(el).opacity)>.99;
  },id,{timeout:4500});
  const full=await cssCard(page,id);
  check(full.clip==='none'&&full.revealed,width+': card becomes sharp, solid and fully clickable after reveal');
  await move(.27);
  await page.waitForFunction(id=>{
    const el=document.querySelector('#colecao .pgrid .pcard[data-product="'+id+'"]');
    return !!el&&el.classList.contains('is-collection-staged')&&getComputedStyle(el).clipPath.startsWith('polygon(');
  },id,{timeout:4500});
  const back=await cssCard(page,id);
  check(back.opacity<.95&&back.clip!=='none',width+': scrolling UP visibly fractures the SAME card back into its entrance');
  await move(1.20);
  await page.waitForFunction(id=>document.querySelector('#colecao .pgrid .pcard[data-product="'+id+'"]')?.classList.contains('is-collection-revealed'),id,{timeout:4500});
  check(true,width+': repeated downward scroll recomposes the card without re-rendering the catalog');
  check(await page.locator('#colecao .pcard').count()===48,width+': all 48 catalog products remain intact');
  check(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),width+': no horizontal overflow with diagonal slices');
  check(errors.length===0,width+': no browser runtime errors '+errors.join('; '));
  const impact=await page.locator('#como-comprar').evaluate(section=>{
    const card=section.querySelector('.how__steps li');
    section.classList.add('how--enhanced');
    section.style.setProperty('--how-bottom','1');
    const initial={
      opacity:'1',x:'164px',y:'186px',z:'-280px',rotation:'30deg',tiltX:'19deg',tiltZ:'8deg',scale:'.33'};
    const finish={opacity:'1',x:'0px',y:'0px',z:'0px',rotation:'0deg',tiltX:'0deg',tiltZ:'0deg',scale:'1'};
    const apply=state=>{
      for(const [key,value] of Object.entries({
       '--how-card-opacity':state.opacity,'--how-card-x':state.x,'--how-card-y':state.y,
       '--how-card-z':state.z,'--how-card-rotation':state.rotation,
       '--how-card-tilt-x':state.tiltX,'--how-card-tilt-z':state.tiltZ,
       '--how-card-scale':state.scale}))card.style.setProperty(key,value);
      return getComputedStyle(card).transform;
    };
    const a=apply(initial),b=apply(finish);
    section.classList.remove('how--enhanced');
    return {a,b};
  });
  check(impact.a!==impact.b,width+': solid four-card sequence encodes stronger 3D impact and settling');
  await ctx.close();
 }
 const c=await browser.newContext({viewport:{width:390,height:844},reducedMotion:'reduce'});
 const p=await c.newPage();await p.goto(BASE+'/?tier=static',{waitUntil:'domcontentloaded'});
 check(await p.locator('#colecao .pgrid.is-cine-scroll').count()===0,'reduced motion: cards remain static and legible');
 check(await p.locator('#colecao .pcard').count()===48,'reduced motion: catalog preserved');
 await c.close();
 console.log('PASS '+count+' V19 fracture-and-impact assertions');
}finally{await browser.close();}
