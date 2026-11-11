/** SET77 · Motion Director V8 – page-level motion must not break the shop. */
import { createRequire } from 'node:module';
const require=createRequire(import.meta.url);
let chromium;
try { ({chromium}=require('playwright')); }
catch { ({chromium}=require('/opt/node-tools/node_modules/playwright')); }
const browser=await chromium.launch({args:['--use-angle=swiftshader','--enable-unsafe-swiftshader']});
const base=process.env.BASE||'http://127.0.0.1:4173';
const sceneIds=['passarela','ocasioes','colecao','looks','como-comprar','lojas','atendimento','duvidas'];
let checks=0;
function check(value,label) {
  if(!value)throw new Error('FAIL '+label);
  console.log('PASS',label);
  checks++;
}
try {
  for(const width of [360,390,768,1440]) {
    const context=await browser.newContext({viewport:{width,height:width===768?1024:width===1440?900:844},isMobile:width<900,hasTouch:width<900});
    const page=await context.newPage();
    await page.addInitScript(()=>sessionStorage.setItem('belle:v4:intro','1'));
    const errors=[];
    page.on('pageerror',e=>errors.push(e.message));
    await page.goto(base+'/?tier=static',{waitUntil:'domcontentloaded'});
    await page.waitForFunction(()=>document.documentElement.classList.contains('md-motion'));
    check(await page.locator('[data-md-scene]').count()===9,width+': nine motion scenes mounted');
    check(!(await page.locator('#duvidas').evaluate(el=>el.classList.contains('md-in'))),width+': future scenes not prematurely revealed');
    check(await page.locator('.film .chapter').count()===7,width+': seven film chapters preserved');
    for(const id of sceneIds){
      const scene=page.locator('#'+id);
      await scene.scrollIntoViewIfNeeded();
      await page.waitForFunction(id=>document.getElementById(id)?.classList.contains('md-in'),id);
      check(await scene.locator('.md-reveal').count()>0,width+': '+id+' entered with child reveals');
    }
    await page.locator('.finale').scrollIntoViewIfNeeded();
    await page.waitForFunction(()=>document.querySelector('.finale')?.classList.contains('md-in'));
    check(await page.locator('.finale .md-reveal').count()===3,width+': ceremonial closing stage');
    check(await page.locator('.runway__card').count()===18,width+': all 18 runway cards preserved');
    const overflowInfo=await page.evaluate(()=>{
      const vw=innerWidth,doc=document.documentElement.scrollWidth;
      const offenders=Array.from(document.querySelectorAll('body *')).map(el=>{
        const r=el.getBoundingClientRect();
        return {id:el.id,cl:typeof el.className==='string'?el.className.slice(0,90):'',left:Math.round(r.left),right:Math.round(r.right),top:Math.round(r.top),bottom:Math.round(r.bottom)};
      }).filter(x=>x.right>vw+1 && x.left<vw && x.bottom>0 && x.top<document.documentElement.scrollHeight).slice(0,12);
      return {vw,doc,offenders};
    });
    if(overflowInfo.doc>overflowInfo.vw+1)console.log('OVERFLOW_DIAG '+width+' '+JSON.stringify(overflowInfo));
    check(overflowInfo.doc<=overflowInfo.vw+1,width+': no horizontal overflow');
    check(await page.evaluate(()=>{
      const veil=document.querySelector('.md-runway-veil');
      return !!veil && getComputedStyle(veil).pointerEvents==='none';
    }),width+': runway curtain cannot block touch or clicks');
    check(errors.length===0,width+': no runtime page errors '+errors.join(';'));
    await context.close();
  }
  const context=await browser.newContext({viewport:{width:390,height:844},reducedMotion:'reduce'});
  const page=await context.newPage();
  await page.goto(base+'/?tier=static',{waitUntil:'domcontentloaded'});
  check(!(await page.evaluate(()=>document.documentElement.classList.contains('md-motion'))),'reduced motion bypasses all editorial entrance effects');
  check(await page.locator('#colecao').isVisible(),'reduced motion keeps catalog visible');
  await context.close();
  console.log('PASS '+checks+' motion-storytelling assertions');
} finally {await browser.close();}
