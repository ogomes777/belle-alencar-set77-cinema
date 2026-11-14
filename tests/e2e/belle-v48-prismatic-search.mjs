/** Belle V48: real browser verification, not just CSS parsing.
 * Uses actual existing search overlay, catalog and theme-specific variables.
 */
import {createRequire} from 'node:module';
const require=createRequire(import.meta.url);
let chromium;
try{({chromium}=require('playwright'))}catch{({chromium}=require('/opt/node-tools/node_modules/playwright'))}
const browser=await chromium.launch({headless:true,args:['--use-angle=swiftshader','--enable-unsafe-swiftshader','--disable-dev-shm-usage']});
const base=process.env.BASE||'http://127.0.0.1:4173';
const ok=(yes,msg)=>{if(!yes)throw Error('FAIL '+msg);console.log('PASS '+msg)};
try{
 for(const width of [320,390,768,1440]){
  const context=await browser.newContext({
   viewport:{width,height:width<=390?844:950},isMobile:width<=390,hasTouch:width<=390
  });
  const page=await context.newPage(),errors=[];
  page.on('pageerror',e=>errors.push(e.message));
  await page.addInitScript(()=>{try{sessionStorage.setItem('belle:v4:intro','1')}catch{}});
  await page.goto(base+'/?tier=static',{waitUntil:'domcontentloaded',timeout:45000});
  for(const theme of ['light','dark','rose']){
   await page.evaluate(t=>document.documentElement.dataset.belleTheme=t,theme);
   await page.locator('#searchButton').click();
   await page.locator('#searchDialog.is-open .ba-search-field').waitFor({state:'visible',timeout:15000});
   const state=await page.evaluate(()=>{
    const root=document.querySelector('#searchDialog');
    const title=root.querySelector('.ba-search-title'),titleStyle=getComputedStyle(title);
    const input=root.querySelector('.search-input'),field=root.querySelector('.ba-search-field');
    const style=getComputedStyle(field),f=field.getBoundingClientRect();
    const panel=root.querySelector('.ov__panel').getBoundingClientRect();
    return {
     title:title.textContent.trim(),animation:titleStyle.animationName,
     gradient:titleStyle.backgroundImage,clip:titleStyle.backgroundClip,
     textFill:titleStyle.webkitTextFillColor,
     surface:style.backgroundImage,bgColor:style.backgroundColor,
     radius:parseFloat(style.borderTopLeftRadius),
     blur:style.backdropFilter||style.webkitBackdropFilter,
     field:{left:f.left,right:f.right,width:f.width,height:f.height},
     panel:{left:panel.left,right:panel.right},
     inputSize:parseFloat(getComputedStyle(input).fontSize),
     count:root.querySelectorAll('.search-hit--product').length,
     tabCount:root.querySelectorAll('.ba-search-view').length,
     overflow:document.documentElement.scrollWidth-innerWidth,
     locale:document.documentElement.lang
    };
   });
   const name=width+' '+theme;
   ok(state.title.length>8,name+' title exists');
   ok(state.animation.includes('baV48TitleIn')&&state.animation.includes('baV48TitlePrism'),name+' directional entrance + multicolor live gradient');
   ok(state.gradient.includes('linear-gradient'),name+' title has real optical gradient');
   ok(state.radius>=29,name+' full pill glass geometry '+state.radius);
   ok(state.blur.includes('blur'),name+' backdrop blur supported');
   ok(state.surface.includes('radial-gradient'),name+' multilayer glass optic');
   ok(state.field.left>=-2&&state.field.right<=width+2,name+' search input within viewport');
   ok(state.panel.left>=-2&&state.panel.right<=width+2,name+' overlay within viewport');
   ok(state.inputSize>=16&&state.field.height>=65,name+' readable type and hit target');
   ok(state.tabCount===4&&state.count>0,name+' interactive existing catalogue preserved');
   ok(state.overflow<=2,name+' no horizontal page overflow');
   await page.locator('#searchInput').fill('vestido');
   ok(await page.locator('#searchDialog .search-hit--product').count()>0,name+' live search preserved');
   await page.keyboard.press('Escape');
   await page.waitForFunction(()=>document.getElementById('searchDialog').hidden,null,{timeout:6000});
  }
  // Confirm the entrance is replayable, not only fired once per app load.
  let starts=0;
  await page.evaluate(()=>{
    window.__belleV48Starts=0;
    document.querySelector('#searchDialog .ba-search-title')
      .addEventListener('animationstart',e=>{
        if(e.animationName==='baV48TitleIn')window.__belleV48Starts++;
      });
  });
  for(let i=0;i<2;i++){
   await page.locator('#searchButton').click();
   await page.locator('#searchDialog.is-open .ba-search-title').waitFor({state:'visible'});
   // Headless Chromium can defer its first rAF on graphics-heavy viewports;
   // wait for the actual CSS animationstart instead of assuming wall-clock time.
   await page.waitForFunction(expected=>window.__belleV48Starts>=expected,
     i+1,{timeout:15000});
   const anim=await page.evaluate(()=>{
    const e=document.querySelector('#searchDialog .ba-search-title');
    return {events:window.__belleV48Starts,
      name:getComputedStyle(e).animationName,
      active:e.getAnimations().map(a=>({currentTime:a.currentTime,playState:a.playState}))};
   });
   console.log('V48 REOPEN '+width+' iteration='+i+' '+JSON.stringify(anim));
   await page.keyboard.press('Escape');
   await page.waitForFunction(()=>document.getElementById('searchDialog').hidden,null,{timeout:6000});
  }
  starts=await page.evaluate(()=>window.__belleV48Starts);
  ok(starts===2,width+' reveal restarts on every search opening ('+starts+')');
  ok(errors.length===0,width+' no JS exceptions '+errors.join(';'));
  await context.close();
 }
 // Reduced motion must show full readable content, without infinite color cycle.
 const reduced=await browser.newContext({viewport:{width:390,height:844},reducedMotion:'reduce'});
 const page=await reduced.newPage();
 await page.addInitScript(()=>{try{sessionStorage.setItem('belle:v4:intro','1')}catch{}});
 await page.goto(base+'/?tier=static',{waitUntil:'domcontentloaded'});
 await page.locator('#searchButton').click();
 const a=await page.locator('#searchDialog .ba-search-title').evaluate(el=>{
  const s=getComputedStyle(el);return {name:s.animationName,opacity:s.opacity,clip:s.clipPath,text:el.textContent};
 });
 ok(a.name==='none'&&a.opacity==='1'&&a.clip==='none'&&a.text.length>8,'reduced motion keeps title fully readable and stops shimmer');
 const f=await page.locator('#searchDialog .ba-search-field').evaluate(el=>getComputedStyle(el).animationName);
 ok(f==='none','reduced motion disables field entrance');
 await reduced.close();
 console.log('V48 browser checks all passed');
}finally{await browser.close()}
