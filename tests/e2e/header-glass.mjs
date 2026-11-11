/**
 * BELLE GLASS HEADER V14 · Browser acceptance
 * Validates adaptive section colors, safe areas, native Belle actions,
 * mobile glass sheet navigation, focus and responsive 320–1440px fit.
 */
import {createRequire} from 'node:module';
const require=createRequire(import.meta.url);
let chromium;
try{({chromium}=require('playwright'));}
catch{({chromium}=require('/opt/node-tools/node_modules/playwright'));}
const browser=await chromium.launch({args:['--use-angle=swiftshader','--enable-unsafe-swiftshader']});
const base=process.env.BASE||'http://127.0.0.1:4173';
let passed=0;
function check(ok,desc){if(!ok)throw Error('FAIL '+desc);console.log('PASS '+desc);passed++;}
try{
 for(const width of [320,360,390,768,1024,1440]){
  const context=await browser.newContext({
    viewport:{width,height:width===768?1024:900},
    isMobile:width<=768,hasTouch:width<=768
  });
  const page=await context.newPage();
  const errors=[];
  page.on('pageerror',e=>errors.push(e.message));
  await page.addInitScript(()=>sessionStorage.setItem('belle:v4:intro','1'));
  await page.goto(base+'/?tier=static&loja=araxa',{waitUntil:'domcontentloaded'});
  const header=page.locator('#siteHeader');
  // CSS-loaded and initial width transition must have settled before testing geometry.
  await page.waitForTimeout(800);
  const rect=await header.boundingBox();
  if(!rect||rect.x < -1||rect.x + rect.width > width+1) {
    console.log('HEADER GEOMETRY DIAGNOSTIC',JSON.stringify(await header.evaluate(el=>{
      const cs=getComputedStyle(el),r=el.getBoundingClientRect();
      return {rect:{left:r.left,right:r.right,width:r.width},viewport:innerWidth,
        cssWidth:cs.width,position:cs.position,left:cs.left,right:cs.right,
        transform:cs.transform,minWidth:cs.minWidth,overflow:cs.overflow};
    })));
  }
  check(rect&&rect.x>=-1&&rect.x+rect.width<=width+1,width+': floating header fits the viewport');
  check(await header.evaluate(h=>getComputedStyle(h).borderRadius!=='0px'),width+': glass capsule has rounded corners');
  check(await header.evaluate(h=>getComputedStyle(h).position==='fixed'),width+': app-like header stays fixed');
  check(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),width+': no horizontal overflow at start');
  for(const id of ['storeButton','searchButton','wishlistButton','bagButton']){
    check(await page.locator('#'+id).evaluate(el=>{
      const r=el.getBoundingClientRect(),v=getComputedStyle(el);
      return v.display!=='none'&&r.width>=40&&r.height>=40&&r.left>=-1&&r.right<=innerWidth+1;
    }),width+': real '+id+' retains a 40px+ touch target');
  }
  if(width<=1020){
    const toggle=page.locator('#belleMenuButton');
    check(await toggle.isVisible(),width+': custom menu button visible');
    await toggle.click();
    check(await toggle.getAttribute('aria-expanded')==='true'&&await page.locator('#belleMenuPanel').isVisible(),width+': glass navigation opens');
    const panel=await page.locator('#belleMenuPanel').boundingBox();
    check(panel&&panel.x>=-1&&panel.x+panel.width<=width+1,width+': mobile menu stays within safe viewport');
    await page.keyboard.press('Escape');
    check(await toggle.getAttribute('aria-expanded')==='false'&&await page.locator('#belleMenuPanel').isHidden(),width+': Escape closes menu');
    await toggle.click();
    await page.locator('#belleMenuPanel a[href="#colecao"]').click();
    check(await page.locator('#belleMenuPanel').isHidden(),width+': tapping collection closes sheet');
  }else{
    check(await page.locator('#belleMenuButton').isHidden(),width+': wide header shows the actual desktop navigation');
    check(await page.locator('.site-nav a').count()===5,width+': desktop links preserved');
  }
  await page.locator('#colecao').scrollIntoViewIfNeeded();
  await page.waitForFunction(()=>document.getElementById('siteHeader')?.dataset.atmosphere==='pearl',null,{timeout:4000});
  check(true,width+': collection sets pearl glass');
  await page.locator('#lojas').scrollIntoViewIfNeeded();
  await page.waitForFunction(()=>document.getElementById('siteHeader')?.dataset.atmosphere==='noir',null,{timeout:4000});
  // The glass color changes smoothly; assert final contrast only after
  // the 720ms text transition finishes, not on its first animation frame.
  await page.waitForTimeout(870);
  // Allow interpolation during the intentionally smooth color transition.
  // Check meaningful final brightness, not a fragile exact RGB triple.
  await page.waitForFunction(()=>{
    const header=document.getElementById('siteHeader');
    const c=header?getComputedStyle(header).color:'';
    const values=c.match(/[0-9.]+/g)?.map(Number)??[];
    return values.length>=3&&values[0]>205&&values[1]>185&&values[2]>160;
  },null,{timeout:3800});
  check(true,width+': dark section changes to bright, legible text');
  check(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),width+': no overflow in dark section');
  await page.locator('#ocasioes').scrollIntoViewIfNeeded();
  await page.waitForFunction(()=>['sand','olive','wine','sky'].includes(document.getElementById('siteHeader')?.dataset.atmosphere||''),null,{timeout:4000});
  check(true,width+': occasion colors remain within Belle palette');
  check(errors.length===0,width+': no client JS exception ('+errors.join(', ')+')');
  await context.close();
 }
 const context=await browser.newContext({viewport:{width:390,height:844},reducedMotion:'reduce'});
 const page=await context.newPage();
 await page.goto(base+'/?tier=static',{waitUntil:'domcontentloaded'});
 await page.locator('#lojas').scrollIntoViewIfNeeded();
 await page.waitForFunction(()=>document.getElementById('siteHeader')?.dataset.atmosphere==='noir');
 check(await page.locator('#siteHeader').isVisible(),'reduced motion still changes header palette without animations');
 await page.locator('#belleMenuButton').click();
 check(await page.locator('#belleMenuPanel').isVisible(),'reduced motion retains an accessible menu');
 await context.close();
 console.log('PASS '+passed+' adaptive Belle header checks');
} finally{await browser.close();}
