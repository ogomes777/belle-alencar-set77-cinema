/** Belle Alencar · Living Glass & Search Atelier V15 regression */
import { createRequire } from 'node:module';
const require=createRequire(import.meta.url);
let chromium;
try{({chromium}=require('playwright'));}catch{({chromium}=require('/opt/node-tools/node_modules/playwright'));}
const browser=await chromium.launch({args:['--use-angle=swiftshader','--enable-unsafe-swiftshader']});
const base=process.env.BASE||'http://127.0.0.1:4173';
let checks=0;
function ok(cond,message){if(!cond)throw new Error('FAIL '+message);console.log('PASS '+message);checks++;}
try{
for(const width of [320,360,390,768,1024,1440]){
  const ctx=await browser.newContext({
    viewport:{width,height:width===768?1024:900},
    isMobile:width<=768,hasTouch:width<=768,
  });
  const page=await ctx.newPage();
  const errors=[];
  page.on('pageerror',error=>errors.push(error.message));
  await page.addInitScript(()=>sessionStorage.setItem('belle:v4:intro','1'));
  await page.goto(base+'/?tier=static',{waitUntil:'domcontentloaded'});
  const header=page.locator('#siteHeader');
  const rect=await header.boundingBox();
  ok(rect&&rect.x>=-2&&rect.x+rect.width<=width+2,width+': floating glass fits viewport');
  ok(await page.locator('#siteHeader .brand__mark svg.mono').count()===1,width+': original monogram preserved');
  ok(await page.locator('#siteHeader .brand__mark .mono').evaluate(el=>getComputedStyle(el).animationName.includes('belleBrandBreathe')),width+': monogram pulses');
  await page.locator('#colecao').scrollIntoViewIfNeeded();
  await page.waitForFunction(()=>document.querySelector('#siteHeader')?.getAttribute('data-atmosphere')==='pearl');
  await page.waitForTimeout(900);
  const pearl=await header.evaluate(el=>getComputedStyle(el).backgroundColor);
  await page.locator('#lojas').scrollIntoViewIfNeeded();
  await page.waitForFunction(()=>document.querySelector('#siteHeader')?.getAttribute('data-atmosphere')==='noir');
  await page.waitForTimeout(900);
  const noir=await header.evaluate(el=>getComputedStyle(el).backgroundColor);
  ok(pearl!==noir,width+': actual computed background colors differ across sections ('+pearl+' vs '+noir+')');
  await page.locator('#searchButton').click();
  const search=page.locator('#searchDialog');
  ok(await search.isVisible(),width+': search dialog opens from original icon');
  ok(await page.locator('#searchDialog .ba-search-title').textContent()==='Encontre o seu look.',width+': editorial search renders');
  ok(await page.locator('#searchDialog .search-group--products .search-hit--product').count()>0,width+': default discovery shows actual product assets');
  const searchBox=await page.locator('#searchDialog .ov__panel').boundingBox();
  ok(searchBox&&searchBox.x>=-2&&searchBox.x+searchBox.width<=width+2,width+': fullscreen search stays inside viewport');
  await page.locator('#searchDialog [data-search-term="Bolsas"]').click();
  const query=await page.locator('#searchInput').inputValue();
  ok(query==='Bolsas',width+': category chip fills and triggers search');
  ok(await page.locator('#searchDialog .search-hit--product').count()>0,width+': product search returns catalog items');
  await page.locator('#searchDialog .ba-search-clear').click();
  ok(await page.locator('#searchInput').inputValue()==='',width+': clear button resets search');
  await page.locator('#searchInput').fill('xyz-nenhuma-peca-1234');
  ok(await page.locator('#searchDialog .ba-search-empty').isVisible(),width+': no-result empty state is actionable');
  await page.locator('#searchInput').fill('vestido');
  ok(await page.locator('#searchDialog .search-hit--product').count()>0,width+': typed search finds products');
  await page.locator('#searchDialog .search-hit--product').first().click();
  await page.waitForSelector('#quickView.is-open',{timeout:4500});
  ok(true,width+': actual product opens quick view');
  await page.keyboard.press('Escape');
  ok(errors.length===0,width+': no JavaScript exceptions '+errors.join(';'));
  await ctx.close();
}
const reduced=await browser.newContext({viewport:{width:390,height:844},reducedMotion:'reduce'});
const rp=await reduced.newPage();
await rp.goto(base+'/?tier=static',{waitUntil:'domcontentloaded'});
ok(await rp.locator('.site-header .brand__mark .mono').evaluate(el=>getComputedStyle(el).animationName==='none'),'reduced motion removes logo pulse');
await rp.locator('#searchButton').click();
ok(await rp.locator('#searchDialog').isVisible(),'reduced motion preserves search');
await reduced.close();
console.log('PASS '+checks+' living glass and search checks');
}finally{await browser.close();}
