/** Belle V47 true browser QA: navbar liquid glass, 3 themes,
 * editorial search, interactive result scopes and mobile layouts.
 * Existing shopping, bag, search overlay and bookable store handlers intact.
 */
import {createRequire} from 'node:module';
const require=createRequire(import.meta.url);
const {chromium}=require('playwright');
const base=process.env.BASE||'http://127.0.0.1:4173';
const check=(ok,msg)=>{if(!ok)throw Error(msg)};
const browser=await chromium.launch({headless:true,args:[
  '--use-angle=swiftshader','--enable-unsafe-swiftshader','--disable-dev-shm-usage'
]});
const widths=[320,390,768,1440];
try{
 for(const width of widths){
  const mobile=width<=390;
  const context=await browser.newContext({
    viewport:{width,height:mobile?844:width===768?1024:900},
    isMobile:mobile,hasTouch:mobile,reducedMotion:'reduce'
  });
  const page=await context.newPage();
  const errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.addInitScript(()=>{try{sessionStorage.setItem('belle:v4:intro','1')}catch{}});
  await page.goto(base+'/?tier=static',{waitUntil:'domcontentloaded',timeout:45000});
  await page.locator('#searchButton').waitFor({state:'attached',timeout:20000});
  for(const theme of ['light','dark','rose']){
   await page.evaluate(t=>{document.documentElement.dataset.belleTheme=t},theme);
   const nav=await page.evaluate(()=>{
    const header=document.getElementById('siteHeader');
    const s=getComputedStyle(header);
    const b=header.getBoundingClientRect();
    const a=[...header.querySelectorAll('.icon-btn')];
    return {bg:s.backgroundColor,raw:s.backgroundImage,
      blur:s.backdropFilter||s.webkitBackdropFilter,
      rect:{left:b.left,right:b.right,width:b.width},
      buttons:a.map(x=>({w:x.getBoundingClientRect().width,
        border:getComputedStyle(x).borderTopWidth,box:getComputedStyle(x).boxShadow})),
      brand:header.querySelectorAll('.brand__mark svg.mono').length,
      search:!!header.querySelector('#searchButton'),
      bag:!!header.querySelector('#bagButton'),
      overflow:document.documentElement.scrollWidth-innerWidth,
    };
   });
   const nkey=width+'/'+theme;
   check(nav.rect.left>=-2&&nav.rect.right<=width+2,'Navbar outside viewport '+nkey);
   check(nav.brand===1&&nav.search,'Brand and native search lost '+nkey);
   check(nav.buttons.length>=3&&nav.buttons.every(b=>b.w>=40),'Controls too small '+nkey);
   check(nav.raw.includes('radial-gradient')&&nav.blur.includes('blur'),'Glass not rendered '+nkey);
   check(nav.overflow<=2,'Nav horizontal overflow '+nkey+': '+nav.overflow);
   await page.locator('#searchButton').click();
   await page.locator('#searchDialog .search-input').waitFor({state:'visible',timeout:15000});
   const ui=await page.evaluate(()=>{
     const root=document.getElementById('searchDialog');
     const field=root.querySelector('.ba-search-field');
     const input=root.querySelector('input.search-input');
     const i=getComputedStyle(input);
     const panel=root.querySelector('.ov__panel').getBoundingClientRect();
     const tabs=[...root.querySelectorAll('.ba-search-view')];
     const cards=[...root.querySelectorAll('.search-hit--product')];
     const r=field.getBoundingClientRect();
     return {
       field:{x:r.left,right:r.right,h:r.height,bg:getComputedStyle(field).backgroundImage},
       text:{size:parseFloat(i.fontSize),weight:parseFloat(i.fontWeight),
         family:i.fontFamily,color:i.color,placeholder:getComputedStyle(input,'::placeholder').color},
       tabs:tabs.map(t=>({name:t.textContent.trim(),aria:t.getAttribute('aria-pressed')})),
       products:cards.length, count:root.querySelector('.search-count').textContent,
       panel:{left:panel.left,right:panel.right},
       theme:document.documentElement.dataset.belleTheme
     };
   });
   check(ui.field.x>=-2&&ui.field.right<=width+2&&ui.field.h>=62,
     'Search input frame outside mobile layout '+nkey);
   check(ui.panel.left>=-2&&ui.panel.right<=width+2,'Search overlay overflow '+nkey);
   check(ui.text.weight>=650&&ui.text.size>=16,'Input not bold/readable '+nkey);
   check(ui.text.family.toLowerCase().includes('sans'),'Search input still thin serif '+nkey);
   check(ui.tabs.length===4&&ui.tabs[0].aria==='true','Real scope tabs missing '+nkey);
   check(ui.products>0,'Actual catalogue assets not rendered '+nkey);
   await page.locator('#searchDialog [data-search-term="Bolsas"]').click();
   check(await page.locator('#searchInput').inputValue()==='Bolsas','Quick search broken '+nkey);
   check(await page.locator('#searchDialog .search-hit--product').count()>0,
     'Bag category returns no products '+nkey);
   await page.locator('#searchDialog [data-search-view="stores"]').click();
   check(await page.locator('#searchDialog .ba-search-empty').isVisible(),
     'Store filter does not filter results '+nkey);
   check(await page.locator('#searchDialog [data-search-view="stores"]').getAttribute('aria-pressed')==='true',
     'Search tab selection is decorative '+nkey);
   await page.locator('#searchDialog [data-search-reset]').click();
   check(await page.locator('#searchInput').inputValue()==='',
     'Empty-state return did not clear query '+nkey);
   check(await page.locator('#searchDialog [data-search-view="all"]').getAttribute('aria-pressed')==='true',
     'Reset did not restore all result scopes '+nkey);
   await page.locator('#searchInput').fill('Franca');
   await page.locator('#searchDialog [data-search-view="stores"]').click();
   check(await page.locator('#searchDialog [data-hit-store="franca"]').count()===1,
     'Live city search failed '+nkey);
   await page.locator('#searchInput').fill('vestido');
   await page.locator('#searchDialog [data-search-view="products"]').click();
   check(await page.locator('#searchDialog .search-hit--product').count()>0,
     'Product scope did not return dresses '+nkey);
   await page.locator('#searchDialog .search-hit--product').first().click();
   await page.locator('#quickView.is-open').waitFor({timeout:10000});
   await page.keyboard.press('Escape');
   if(await page.locator('#searchDialog .ov__close').isVisible()){
     await page.locator('#searchDialog .ov__close').click({timeout:5000});
   }
   check(errors.length===0,'Runtime exception '+nkey+': '+errors.join(' | '));
   console.log('PASS V47 nav/search',nkey,'glass, real tabs, store, products, quickview');
  }
  await context.close();
 }
 // Language QA: fixed and newly added text translated without stale init scripts.
 const context=await browser.newContext({viewport:{width:390,height:844},reducedMotion:'reduce'});
 const page=await context.newPage();
 const strings={
  pt:{placeholder:'Vestidos, bolsas, acessórios…',all:'Tudo',title:'Sua próxima descoberta.'},
  en:{placeholder:'Dresses, bags, accessories…',all:'All',title:'Your next discovery.'},
  es:{placeholder:'Vestidos, bolsos, accesorios…',all:'Todo',title:'Tu próximo descubrimiento.'},
  it:{placeholder:'Abiti, borse, accessori…',all:'Tutto',title:'La tua prossima scoperta.'}
 };
 await page.goto(base+'/?tier=static',{waitUntil:'domcontentloaded'});
 for(const [locale,expected] of Object.entries(strings)){
  await page.evaluate(locale=>localStorage.setItem('belle:v31:locale',locale),locale);
  await page.reload({waitUntil:'domcontentloaded'});
  await page.locator('#searchButton').click();
  await page.waitForFunction(locale=>document.documentElement.lang.startsWith(locale),locale,{timeout:20000});
  const actual=await page.evaluate(()=>{
    const r=document.getElementById('searchDialog');
    return {placeholder:r.querySelector('.search-input').getAttribute('placeholder'),
      all:r.querySelector('[data-search-view="all"] .ba-search-view__name').textContent.trim(),
      title:r.querySelector('.ba-search-explore-bar__headline').textContent.trim()};
  });
  check(actual.placeholder===expected.placeholder&&actual.all===expected.all&&actual.title===expected.title,
    'Search locale not fully translated '+locale+': '+JSON.stringify(actual));
  console.log('PASS V47 i18n',locale);
 }
 await context.close();
}finally{await browser.close()}
