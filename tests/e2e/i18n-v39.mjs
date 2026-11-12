/** V39 e2e: real Chromium language switching and animated menu. */
import { createRequire } from 'node:module';
import { mkdir } from 'node:fs/promises';
const require=createRequire(import.meta.url);
let chromium;
try{({chromium}=require('playwright'))}
catch{({chromium}=require('/opt/node-tools/node_modules/playwright'))}
const base=process.env.BASE || 'http://127.0.0.1:4173';
const browser=await chromium.launch({headless:true,args:['--use-angle=swiftshader','--enable-unsafe-swiftshader']});
const requireCheck=(ok,message)=>{if(!ok)throw new Error(message)};
const expected={
 pt:['A loja','Passarela','Ocasiões','Coleção','Lojas','Atendimento','Como comprar','Dúvidas','WhatsApp','Instagram'],
 en:['The boutique','Runway','Occasions','Collection','Stores','Personal assistance','How to shop','Questions','WhatsApp','Instagram'],
 es:['La boutique','Pasarela','Ocasiones','Colección','Tiendas','Atención personalizada','Cómo comprar','Preguntas','WhatsApp','Instagram'],
 it:['La boutique','Passerella','Occasioni','Collezione','Negozi','Assistenza','Come acquistare','Domande','WhatsApp','Instagram']
};
await mkdir('artifacts/i18n-v39',{recursive:true});
try{
 for(const width of [390,1440]){
  const context=await browser.newContext({viewport:{width,height:width>800?900:844},isMobile:width<700,hasTouch:width<700});
  const page=await context.newPage();
  const errors=[];
  page.on('pageerror',e=>errors.push(e.message));
  await page.addInitScript(()=>{
    try{sessionStorage.setItem('belle:v4:intro','1')}catch{}
  });
  await page.goto(base+'/?tier=static',{waitUntil:'load'});
  await page.locator('#belleSettingsButton').waitFor({state:'visible',timeout:15000});
  for(const lang of ['en','es','it','pt']){
    await page.locator('#belleSettingsButton').click();
    await page.locator('#belleSettingsPanel [data-lang-option="'+lang+'"]').click();
    await page.waitForFunction(locale=>document.documentElement.lang.startsWith(locale),lang);
    await page.locator('#belleSettingsPanel [data-close-settings]').click();
    await page.locator('#belleMenuButton').click();
    await page.waitForFunction(()=>document.getElementById('belleMenuPanel')?.classList.contains('is-open'));
    const menu=await page.evaluate(()=>{
      const anchors=[...document.querySelectorAll('#belleMenuPanel a[data-split]')].map(a=>({
        text:a.getAttribute('aria-label'),letters:[...a.querySelectorAll('.cn-ch__a')].map(x=>x.textContent).join(''),
        count:a.querySelectorAll('.cn-letters').length
      }));
      const pane=document.getElementById('belleMenuPanel');
      const rect=pane.getBoundingClientRect();
      return {anchors,open:pane.classList.contains('is-open'),top:rect.top,width:rect.width,
        markers:pane.querySelectorAll('.couture-nav__marker').length,
        panelVisible:getComputedStyle(pane).visibility!=='hidden'};
    });
    const desired=expected[lang];
    requireCheck(menu.anchors.length===10,'menu items mismatch '+lang+' '+width);
    desired.forEach((label,index)=>{
      const item=menu.anchors[index];
      requireCheck(item?.text===label,'menu translation '+lang+' '+width+' '+index+' '+item?.text+' expected '+label);
      requireCheck(item.count===1,'letter split lost '+lang+' '+width);
      requireCheck(item.letters===label.replace(/\s+/g,''),'letter layers mismatch '+lang+' '+width);
    });
    requireCheck(menu.markers===6 && menu.open && menu.panelVisible,'menu broken '+lang+' '+width);
    const over=await page.evaluate(()=>document.documentElement.scrollWidth-innerWidth);
    requireCheck(over<=1,'horizontal overflow '+width+' '+lang+' '+over);
    await page.screenshot({path:'artifacts/i18n-v39/menu-'+lang+'-'+width+'.png',animations:'disabled'});
    await page.keyboard.press('Escape');
    await page.waitForFunction(()=>document.getElementById('belleMenuButton')?.getAttribute('aria-expanded')==='false');
    await page.locator('#searchButton').click();
    const heading=await page.locator('#searchDialog .ba-search-title').textContent();
    requireCheck(heading?.trim()===({pt:'Encontre o seu look.',en:'Find your look.',es:'Encuentra tu look.',it:'Trova il tuo look.'})[lang],
      'search copy untranslated '+lang+' '+width+':'+heading);
    await page.keyboard.press('Escape');
    console.log('PASS',width,lang,'animated menu, search, overflow, keyboard');
  }
  requireCheck(errors.length===0,'uncaught JS '+width+' '+errors.join(' | '));
  await context.close();
 }
}finally{await browser.close()}
