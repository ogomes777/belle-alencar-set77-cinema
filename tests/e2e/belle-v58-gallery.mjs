/**
 * BELLE V58 / repeatable browser evidence.
 * Captures the SAME Three.js scene from six camera poses, then records
 * the actual UI walkthrough. SwiftShader results are diagnostic, not claims
 * about customer hardware FPS.
 */
import { chromium } from 'playwright';
import { mkdir, copyFile, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
const OUT='artifacts/belle-pov-v58';
const BASE=process.env.BASE_URL||'http://127.0.0.1:4173';
await mkdir(OUT,{recursive:true});
const browser=await chromium.launch({headless:true,args:[
  '--no-sandbox','--disable-dev-shm-usage','--use-angle=swiftshader',
  '--enable-unsafe-swiftshader','--ignore-gpu-blocklist'
]});
const report={generatedAt:new Date().toISOString(),engine:'Chromium headless + SwiftShader (software GPU)',results:[],shots:[]};
function assert(v,msg){if(!v)throw Error(msg);}
async function load(page,tier='touch'){
  const started=Date.now();
  await page.goto(BASE+'/?tier='+tier+'&gov=off#inicio',{waitUntil:'domcontentloaded',timeout:45000});
  if(tier!=='static'){
    await page.waitForFunction(()=>window.__belle?.world?.()?.frames>=2,null,{timeout:70000});
  }
  return Date.now()-started;
}
async function sceneReady(page){
  await page.waitForFunction(()=>{
    const w=window.__belle?.world?.();
    return w && w.products.total>0 && w.products.ready+w.products.failed===w.products.total;
  },null,{timeout:35000});
}
async function sala(page){
  await page.evaluate(()=>document.querySelector('[data-chapter="sala"]').scrollIntoView({behavior:'instant',block:'center'}));
  await page.waitForFunction(()=>window.__belle?.chapter==='sala',null,{timeout:14000});
}
function installErrors(page,errors){
  page.on('pageerror',e=>errors.push(e.message));
  page.on('console',msg=>{if(msg.type()==='error')errors.push(msg.text());});
}
try {
  const context=await browser.newContext({viewport:{width:1440,height:810},deviceScaleFactor:1});
  await context.addInitScript(()=>{try{sessionStorage.setItem('belle:v4:intro','1')}catch{}});
  const page=await context.newPage(),errors=[];installErrors(page,errors);
  const loadMs=await load(page);
  await sceneReady(page);
  await sala(page);
  await page.evaluate(()=>{
    document.querySelectorAll('.chapter__card,.roomrail,.belle-pov').forEach(el=>el.style.setProperty('visibility','hidden','important'));
  });
  for(const [name,label] of [
    ['fachada','01_fachada'],['sala','02_sala'],['direita','03_arara_direita'],
    ['provador','04_provador'],['esquerda','05_arara_esquerda'],['portaInterna','06_contracampo']
  ]){
    const success=await page.evaluate(n=>window.__belle?.setView?.(n),name);
    assert(success,'Could not set camera pose '+name);
    await page.waitForTimeout(800);
    await page.locator('#filmStage').screenshot({path:join(OUT,label+'.png'),timeout:30000});
    report.shots.push({name,asset:label+'.png',world:await page.evaluate(()=>window.__belle?.world?.())});
  }
  await page.evaluate(()=>window.__belle?.setView?.(null));
  assert(errors.length===0,'Desktop screenshot errors: '+errors.join(' | '));
  report.results.push({profile:'desktop 1440x810 / forced touch',loadMs,errors});
  await context.close();
  // A real screen recording with the visit UI shown.
  const filming=await browser.newContext({viewport:{width:1280,height:720},recordVideo:{dir:OUT,size:{width:1280,height:720}}});
  await filming.addInitScript(()=>{try{sessionStorage.setItem('belle:v4:intro','1')}catch{}});
  const rec=await filming.newPage(),recErrors=[];installErrors(rec,recErrors);
  await load(rec);
  await sala(rec);
  await rec.waitForTimeout(450);
  await rec.locator('[data-visit-enter]').click({force:true});
  await rec.waitForTimeout(400);
  await rec.locator('[data-dest="direita"]').click({force:true});
  await rec.waitForTimeout(2000);
  await rec.locator('[data-side="1"]').click({force:true});
  await rec.locator('#belleVisitCategory').selectOption('vestidos');
  await rec.locator('.belle-pov__product').first().click({force:true});
  await rec.locator('[data-inspect-selected]').click({force:true});
  await rec.waitForTimeout(700);
  await rec.locator('[data-detail-close]').click({force:true});
  await rec.locator('[data-dest="esquerda"]').click({force:true});
  await rec.waitForTimeout(2000);
  await rec.locator('[data-side="-1"]').click({force:true});
  await rec.locator('#belleVisitCategory').selectOption('calcas');
  await rec.waitForTimeout(650);
  await rec.locator('[data-look="entrance"]').click({force:true});
  await rec.waitForTimeout(1300);
  await rec.locator('[data-visit-exit]').click({force:true});
  await rec.waitForTimeout(500);
  const video=rec.video();
  await filming.close();
  if(video){await copyFile(await video.path(),join(OUT,'percurso-real-da-loja.webm'));}
  assert(recErrors.length===0,'Visit video errors: '+recErrors.join(' | '));
  report.results.push({profile:'video desktop 1280x720',errors:recErrors});
  for(const spec of [{profile:'mobile touch 390x844',width:390,height:844,tier:'touch'},{profile:'essential 390x844',width:390,height:844,tier:'static'}]){
    const ctx=await browser.newContext({viewport:{width:spec.width,height:spec.height},deviceScaleFactor:2,isMobile:true,hasTouch:true});
    await ctx.addInitScript(()=>{try{sessionStorage.setItem('belle:v4:intro','1')}catch{}});
    const p=await ctx.newPage(),e=[];installErrors(p,e);const loadMs=await load(p,spec.tier);await sala(p);
    const before=await p.evaluate(()=>window.__belle?.progress??0);
    await p.locator('[data-visit-enter]').click({force:true});
    const active=await p.evaluate(()=>document.documentElement.classList.contains('belle-visiting'));assert(active,'Visit did not activate');
    await p.locator('[data-side="1"]').click({force:true});
    await p.locator('#belleVisitCategory').selectOption('vestidos');
    const dresses=await p.locator('.belle-pov__product').count();
    await p.locator('[data-side="-1"]').click({force:true});
    await p.locator('#belleVisitCategory').selectOption('calcas');
    await p.locator('[data-side="1"]').click({force:true});
    assert(await p.locator('#belleVisitCategory').inputValue()==='vestidos','Side state lost');
    await p.locator('.belle-pov__product').first().click({force:true});
    await p.locator('[data-inspect-selected]').click({force:true});
    assert(await p.locator('.belle-pov__detail').isVisible(),'Product detail not shown');
    await p.locator('[data-detail-close]').click({force:true});
    await p.locator('[data-visit-exit]').click({force:true});
    const exited=await p.evaluate(()=>!document.documentElement.classList.contains('belle-visiting'));assert(exited,'Visit did not exit');
    await p.evaluate(()=>{
      const film=document.querySelector('#filme');
      const top=film.getBoundingClientRect().top+window.scrollY;
      const range=film.offsetHeight-innerHeight;
      scrollTo({top:top+range*.45,behavior:'instant'});
    });
    await p.waitForTimeout(300);
    const forward=await p.evaluate(()=>window.__belle?.progress??0);
    await p.evaluate(()=>{
      const film=document.querySelector('#filme');
      const top=film.getBoundingClientRect().top+scrollY;
      const range=film.offsetHeight-innerHeight;
      scrollTo({top:top+range*.12,behavior:'instant'});
    });
    await p.waitForTimeout(300);
    const reverse=await p.evaluate(()=>window.__belle?.progress??0);
    assert(forward>reverse,'Reverse scroll not working');
    assert(e.length===0,spec.profile+' JS errors: '+e.join(' | '));
    report.results.push({profile:spec.profile,loadMs,dresses,sideStatePersisted:true,detail:true,exited,progress:{before,forward,reverse},errors:e});
    await ctx.close();
  }
  const comparator=`<!doctype html><html lang="pt-BR"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
  <title>Belle V58 | Comparador de seis ângulos</title>
  <style>body{font:16px/1.5 system-ui;background:#17120f;color:#f4eee4;margin:0;padding:20px}h1{font:400 36px Georgia}p{max-width:950px;color:#dacbb7}.grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(min(100%,460px),1fr));gap:22px}article{background:#2d221c;padding:12px;border:1px solid #87684b;border-radius:12px}img{display:block;width:100%;border-radius:6px}input{width:100%;margin:8px 0 12px;color:#dacbb7}</style>
  <h1>Belle Alencar | V58 · Comparador</h1><p>Os renders abaixo são capturas reais do mesmo ambiente Three.js. Para comparar diretamente com as seis imagens de referência aprovadas, selecione em cada quadro o PNG correspondente da ZIP BELLE_ALENCAR_HERO_POV_SET77. As referências não foram republicadas sem necessidade.</p>
  <div class="grid">${["01_fachada","02_sala","03_arara_direita","04_provador","05_arara_esquerda","06_contracampo"].map((name,i)=>`<article><h2>${i+1}. ${name.slice(3).replaceAll('_',' ')}</h2><label>Referência do kit <input type="file" accept="image/*" onchange="const img=this.nextElementSibling;if(this.files[0]){img.src=URL.createObjectURL(this.files[0]);img.hidden=false}"></label><img hidden alt="Referência enviada" style="margin-bottom:14px"><strong>Render V58</strong><img src="${name}.png" alt="Render da loja"></article>`).join('')}</div></html>`;
  await writeFile(join(OUT,'comparador-seis-angulos.html'),comparator);
  await writeFile(join(OUT,'metricas.json'),JSON.stringify(report,null,2));
  console.log('PASS',JSON.stringify(report));
}catch(error){
  console.error('FAIL',error.stack||String(error));
  await writeFile(join(OUT,'metricas.json'),JSON.stringify({...report,error:String(error)},null,2));
  process.exitCode=1;
}finally{await browser.close();}
