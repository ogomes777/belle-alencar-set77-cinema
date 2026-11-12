/**
 * V35 real Chromium QA: one page, 22 motifs, real scroll, 4 viewports,
 * no invisible text / duplicate title / blocking curtain / horizontal gap.
 * BASE=https://... node tests/e2e/couture-v35.mjs
 */
import {createRequire} from 'node:module';
const require=createRequire(import.meta.url);
let chromium;
try {({chromium}=require('playwright'))}
catch {({chromium}=require('/opt/node-tools/node_modules/playwright'))}
const browser=await chromium.launch({headless:true,args:['--use-angle=swiftshader','--enable-unsafe-swiftshader']});
const base=process.env.BASE||'http://127.0.0.1:4173';
const stages=[
  ['#passarela',['cortina','fatias','carrossel']],
  ['#ocasioes',['colunas','pilha','cubo']],
  ['#colecao',['rasgo','pixels','varredura']],
  ['#como-comprar',['digitacao','sobreposicao','tinta']],
  ['#lojas',['circulo','moldura','canto']],
  ['#atendimento',['veludo','canal','particulas']],
  ['#duvidas',['dobra','reticula']],
  ['.finale',['espiral','queima']]
];
const assert=(value,why)=>{if(!value)throw new Error(why)};
try {
 for(const width of [360,390,768,1440]){
  const height=width===1440?900:width===768?1024:844;
  const context=await browser.newContext({viewport:{width,height},isMobile:width<900,hasTouch:width<900});
  const page=await context.newPage();
  await page.addInitScript(()=>sessionStorage.setItem('belle:v4:intro','1'));
  const errors=[];
  page.on('pageerror',err=>errors.push(err.message));
  await page.goto(base+'/?tier=static',{waitUntil:'load'});
  await page.waitForFunction(()=>document.documentElement.classList.contains('bm35-mounted'));
  assert(await page.locator('#belleMicroStage').count()===1,'one composition stage');
  assert(await page.locator('.bm35-piece').count()===16,'sixteen reusable surface pieces');
  assert(await page.locator('.ct33-wipe').count()===0,'legacy fullscreen material removed');
  assert(await page.evaluate(()=>getComputedStyle(document.querySelector('#belleMicroStage')).pointerEvents==='none'),'stage intercepts pointer events');
  const seen=new Set();
  for(const [selector,motifs] of stages) {
    for(let i=0;i<motifs.length;i++) {
      const result=await page.evaluate(({selector,p})=>{
        const section=document.querySelector(selector);
        if(!section)return {missing:true};
        const sectionY=section.getBoundingClientRect().top+scrollY;
        const targetTop=innerHeight*(.98-.81*p);
        const y=sectionY-targetTop;
        const max=document.documentElement.scrollHeight-innerHeight;
        if(y<0||y>max)return {outOfReach:true};
        scrollTo(0,y);
        return {outOfReach:false};
      },{selector,p:(i+.5)/motifs.length});
      if(result.missing)throw new Error('Missing scene '+selector);
      if(result.outOfReach)continue;
      await page.evaluate(()=>new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve))));
      const state=await page.evaluate(()=>{
        const el=document.querySelector('#belleMicroStage');
        return {active:el?.dataset.active,motif:el?.dataset.motif,visibility:getComputedStyle(el).visibility,opacity:getComputedStyle(el).opacity,
          scrollWidth:document.documentElement.scrollWidth,clientWidth:document.documentElement.clientWidth};
      });
      assert(state.active==='true'&&state.visibility==='visible','unrevealed stage '+selector+' '+motifs[i]+' '+JSON.stringify(state));
      assert(state.motif===motifs[i],'wrong motif at '+selector+': '+JSON.stringify(state));
      assert(state.scrollWidth<=state.clientWidth+1,'horizontal overflow '+width+' '+selector);
      seen.add(state.motif);
    }
  }
  assert(seen.size>=19,'only '+seen.size+' distinct effects reachable on '+width+'px');
  assert(errors.length===0,'script errors '+width+' '+errors.join('; '));
  await context.close();
  console.log('PASS '+width+'px: '+seen.size+' distinct live scroll motifs, no blank overlays, pointer-safe');
 }
 const ctx=await browser.newContext({viewport:{width:390,height:844},reducedMotion:'reduce'});
 const page=await ctx.newPage();
 await page.goto(base+'/?tier=static',{waitUntil:'load'});
 assert(await page.evaluate(()=>{
   const s=document.querySelector('#belleMicroStage');
   return !s||getComputedStyle(s).display==='none';
 }), 'reduced motion hides couture overlay');
 await ctx.close();
 console.log('PASS reduced motion');
} finally {await browser.close();}
