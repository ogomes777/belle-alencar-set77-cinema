/**
 * QA V37 extra | execução por Codex depois da implementação.
 * Requer Playwright (instalar no ambiente de QA, não no bundle de produção).
 * BASE=http://127.0.0.1:4173 node BELLE_CODEX_KIT_V37/qa/verify-boundaries.mjs
 */
import {createRequire} from 'node:module';
import {mkdir} from 'node:fs/promises';
import path from 'node:path';
const require=createRequire(import.meta.url);
let chromium;
try{({chromium}=require('playwright'))}catch{throw Error('Playwright nao encontrado. Instale no ambiente de QA, nao em producao.');}
const base=process.env.BASE||'http://127.0.0.1:4173';
const out=process.env.OUTPUT||'docs/qa-v37/visual';
await mkdir(out,{recursive:true});
const browser=await chromium.launch({args:['--use-angle=swiftshader','--enable-unsafe-swiftshader']});
const selectors=['#inicio','#porta','#sala','#vestido','#detalhe','#categorias','#provador',
'#passarela','#ocasioes','#colecao','#como-comprar','#lojas','#atendimento','#duvidas','.finale'];
const fail=(msg)=>{throw new Error('FAIL '+msg)};
const inspect=async(page,label)=>{
 const state=await page.evaluate(()=>{
  const forbidden=['#belleMicroStage','#belleCoutureWipe','.bm35-stage','.ct33-wipe','.md-runway-veil'];
  const bad=forbidden.filter(s=>document.querySelector(s));
  const dw=document.documentElement.scrollWidth;
  const vw=document.documentElement.clientWidth;
  const overlays=[...document.body.children].filter(el=>{
    const st=getComputedStyle(el);
    return st.position==='fixed'&&st.pointerEvents!=='none'&&el.getBoundingClientRect().height>=innerHeight*.95&&el.id!=='intro';
  }).map(el=>el.id||el.className);
  return {bad,dw,vw,overlays,film:document.querySelectorAll('.film .chapter').length,
    sections:['passarela','ocasioes','colecao','como-comprar','lojas','atendimento','duvidas'].every(id=>!!document.getElementById(id))};
 });
 if(state.bad.length)fail(label+' V33/V35: '+state.bad.join(','));
 if(state.dw>state.vw+1)fail(label+' overflow '+state.dw+'/'+state.vw);
 if(state.film!==7||!state.sections)fail(label+' estrutura original alterada');
 // overlays pode incluir dialogs legitimamente abertos; avaliar caso a caso.
 return state;
};
try{
for(const width of [360,390,768,1440]){
 const height=width===1440?900:width===768?1024:844;
 const context=await browser.newContext({viewport:{width,height},hasTouch:width<900,isMobile:width<900,
   recordVideo:{dir:out,size:{width,height}}});
 const page=await context.newPage();
 await page.addInitScript(()=>{try{sessionStorage.setItem('belle:v4:intro','1')}catch{}});
 const errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.goto(base+'/?tier=static',{waitUntil:'load'});
 await inspect(page,'initial '+width);
 for(const direction of ['down','up']){
  const route=direction==='down'?selectors:[...selectors].reverse();
  for(let i=0;i<route.length;i++){
   const selector=route[i];
   const exists=await page.locator(selector).count();
   if(!exists)fail(width+' missing '+selector);
   await page.locator(selector).first().evaluate(el=>el.scrollIntoView({behavior:'instant',block:'start'}));
   await page.waitForTimeout(120);
   await inspect(page,width+' '+direction+' '+selector);
   if(i===0||i===route.length-1||i%3===0)
     await page.screenshot({path:path.join(out,`${width}-${direction}-${i}.png`),animations:'disabled'});
  }
 }
 await page.locator('#colecao .pcard__title [data-qv]').first().scrollIntoViewIfNeeded();
 await page.locator('#colecao .pcard__title [data-qv]').first().click();
 await page.locator('.qv').waitFor({state:'visible',timeout:8000});
 await page.keyboard.press('Escape');
 if(errors.length)fail(width+' console errors: '+errors.join(' | '));
 await context.close();
 console.log('PASS '+width+'px scroll ida/volta; commerce abre; sem overlays legados; video QA gravado');
}
const ctx=await browser.newContext({viewport:{width:390,height:844},reducedMotion:'reduce'});
const pg=await ctx.newPage();await pg.goto(base+'/?tier=static',{waitUntil:'load'});
await inspect(pg,'reduced-motion');await ctx.close();
console.log('PASS reduced-motion estrutura original preservada');
}finally{await browser.close()}
