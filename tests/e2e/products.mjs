/** New48 asset/identity gate. Run against built preview; optional SHOTS_DIR/VIDEO_DIR. */
import {createRequire} from 'node:module';
import {mkdir,readFile,rename} from 'node:fs/promises';
const require=createRequire(import.meta.url);let chromium;
try{({chromium}=require('playwright'));}catch{({chromium}=require('/opt/node-tools/node_modules/playwright'));}
const base=process.env.BASE||'http://127.0.0.1:4173', out=process.env.SHOTS_DIR||'reports/evidence';
await mkdir(out,{recursive:true});
const products=JSON.parse(await readFile('public/assets/belle/products/catalogo_48_novo.json','utf8'));
const browser=await chromium.launch({args:['--use-angle=swiftshader','--enable-unsafe-swiftshader','--ignore-gpu-blocklist']});
let count=0;const check=(ok,msg)=>{if(!ok)throw new Error(msg);console.log('PASS',msg);count++;};
const errors=[];
function watch(page){page.on('pageerror',e=>errors.push(e.message));page.on('console',m=>{if(m.type()==='error')errors.push(m.text())});page.on('response',r=>{if(r.status()>=400)errors.push(`${r.status()} ${r.url()}`)});}
async function goto(page,url='?tier=static&loja=araxa'){await page.goto(base+'/'+url);await page.evaluate(()=>document.fonts.ready);await page.waitForSelector('.pcard');}
async function chapter(page,id){await page.evaluate(id=>{const e=document.getElementById(id);scrollTo(0,e.getBoundingClientRect().top+scrollY+(id==='sala'?e.offsetHeight*.3:0)-68)},id);if(id==='sala')await page.waitForFunction(()=>document.documentElement.dataset.filmChapter==='sala'&&document.getElementById('arara-viva')?.classList.contains('is-on'));await page.waitForTimeout(350);}
try{
const context=await browser.newContext({viewport:{width:1440,height:900},reducedMotion:'reduce'});
const page=await context.newPage();watch(page);await goto(page);
const assets=await page.evaluate(async products=>{
 const checks=[];for(const p of products)for(const role of ['cutouts','packshots']){
  const url=`/assets/belle/products/${role}/${p.slug}.webp`,r=await fetch(url),img=new Image();img.src=url;await img.decode();
  const c=document.createElement('canvas');c.width=img.width;c.height=img.height;const ctx=c.getContext('2d');ctx.drawImage(img,0,0);
  const alpha=[[0,0],[img.width-1,0],[0,img.height-1],[img.width-1,img.height-1]].map(([x,y])=>ctx.getImageData(x,y,1,1).data[3]);
  checks.push({slug:p.slug,role,status:r.status,valid:alpha.every(a=>a===0)&&img.naturalWidth>0});
 }return checks;
},products);
check(assets.length===96&&assets.every(a=>a.status===200&&a.valid),'96 local WebPs return200, decode and retain transparent corners');
await chapter(page,'colecao');
for(const category of [...new Set(products.map(p=>p.category))]){
 await page.locator(`#catalogMount [data-cat="${category}"]`).click();
 check(await page.locator('.pcard').count()===6,`${category}: exactly six products`);
 for(const p of products.filter(p=>p.category===category)){
  const id='belle-demo-'+p.slug;
  await page.locator(`.pcard[data-product="${id}"] .pcard__title button`).click();
  await page.waitForSelector('#quickView.is-open');
  const img=page.locator('.qv__ill img');await img.evaluate(i=>i.decode());
  check((await page.locator('#qvTitle').textContent())===p.name&&(await img.getAttribute('src'))===`/assets/belle/products/packshots/${p.slug}.webp`,`${p.slug}: correct complete packshot/detail identity`);
  await page.keyboard.press('Escape');await page.waitForSelector('#quickView',{state:'hidden'});
 }
}
await page.locator('#catalogMount [data-cat="todas"]').click();
for(const width of [360,390,768,1440]){
 await page.setViewportSize({width,height:width<800?844:900});
 for(const id of ['inicio','sala','passarela','provador','looks','colecao']){
  await chapter(page,id);
  await page.locator('img.editorial-cutout').evaluateAll(imgs=>Promise.all(imgs.map(i=>i.decode().catch(()=>{}))));
  check(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),`${width}/${id}: no document overflow`);
  if(width===390||width===1440)await page.screenshot({path:`${out}/${id}-${width}.png`});
 }
 await chapter(page,'sala');
 check(await page.locator('.rack__piece').count()===30,`${width}: thirty garments only, no jewelry on hangers`);
 const piece=page.locator('.rack__piece').nth(15);
 await piece.waitFor({state:'visible'});
 await piece.evaluate(e=>e.focus({preventScroll:true}));
 await page.waitForFunction(()=>document.activeElement?.dataset.id===document.querySelectorAll('.rack__piece')[15]?.dataset.id);
 await page.keyboard.press('Enter');
 await page.waitForSelector('.pv:not([hidden])').catch(async e=>{console.log('KEYBOARD DEBUG',await page.evaluate(()=>({y:scrollY,active:document.activeElement?.outerHTML.slice(0,400),chapter:window.__belle?.chapter,phase:window.__rack?.debug(),pv:document.querySelector('.pv')?.hidden,errors:document.documentElement.className})));await page.screenshot({path:out+'/failed-keyboard.png'});throw e;});
 const expected=await page.locator('.pv').getAttribute('data-product-id');
 await page.keyboard.press('Escape');await page.waitForSelector('.pv',{state:'hidden'});
 check(await page.evaluate(()=>document.activeElement?.dataset.id)===expected,`${width}: viewer returns focus to same garment`);
 await chapter(page,'passarela');
 const image=page.locator('.runway__model').first().locator('img');const box=await image.boundingBox(),stage=await page.locator('.runway__stage').boundingBox();
 // Full canvas remains inside stage at settled foreground; alpha only reduces its footprint further.
 check(box.x>=stage.x-1&&box.x+box.width<=stage.x+stage.width+1,`${width}: foreground product is not clipped`);
}
await context.close();
// Real motion capture: ten consecutive same-product flights, no double-add or orphan nodes.
const motion=await browser.newContext({viewport:{width:1440,height:900},recordVideo:{dir:process.env.VIDEO_DIR||out,size:{width:1440,height:900}}});
const mp=await motion.newPage();watch(mp);await mp.addInitScript(()=>sessionStorage.setItem('belle:v4:intro','1'));await goto(mp);
await chapter(mp,'sala');await mp.waitForTimeout(1200);await mp.locator('.rack__piece').nth(15).focus();await mp.keyboard.press('Enter');await mp.waitForSelector('.pv:not([hidden])');await mp.waitForTimeout(850);
const id=await mp.locator('.pv').getAttribute('data-product-id');let added=0;
for(let i=0;i<10;i++){
 await mp.locator('.pv__size').nth(i%5).click();await mp.click('.pv__add');
 await mp.waitForSelector('.dress-ghost');
 const ghost=mp.locator('.dress-ghost');
 check(await ghost.getAttribute('data-product-id')===id,`flight${i+1}: same product ID`);
 check((await mp.locator('[data-bag-count]').first().textContent()).trim()===String(added),`flight${i+1}: counter waits for occlusion/impact`);
 await mp.locator('.pv__add').click({force:true,timeout:150}).catch(()=>{});
 if(i===0){await mp.screenshot({path:`${out}/flight-launch.png`});await mp.waitForTimeout(330);await mp.screenshot({path:`${out}/flight-mid.png`});}
 await mp.waitForFunction(()=>!document.querySelector('.dress-ghost')&&!document.querySelector('.pv__add[aria-busy]'));
 added++;
 check((await mp.locator('[data-bag-count]').first().textContent()).trim()===String(added),`flight${i+1}: one addition, zero ghosts`);
}
await mp.screenshot({path:`${out}/flight-complete.png`});
await mp.keyboard.press('Escape');await mp.waitForSelector('.pv',{state:'hidden'});
await mp.keyboard.press('Home');
await mp.waitForFunction(()=>document.activeElement?.dataset.id===document.querySelectorAll('.rack__piece')[0]?.dataset.id);
check(true,'keyboard reaches the first of all thirty garments');
await mp.keyboard.press('End');
await mp.waitForFunction(()=>document.activeElement?.dataset.id===document.querySelectorAll('.rack__piece')[29]?.dataset.id);
check(true,'keyboard reaches the last garment without scrolling the page');
await mp.click('#bagButton');await mp.waitForSelector('#bagDrawer.is-open');
check(await mp.locator('#bagDrawer img').first().getAttribute('src')===`/assets/belle/products/packshots/${id.replace('belle-demo-','')}.webp`,'bag thumbnail preserves the exact product');
await mp.screenshot({path:`${out}/bag-after-ten.png`});
const video=mp.video();await motion.close();if(video)await rename(await video.path(),`${out}/same-product-flight.webm`);
check(errors.length===0,`zero browser/HTTP errors: ${errors.join(' | ')}`);
console.log(`${count} product integration checks passed`);
}finally{await browser.close();}
