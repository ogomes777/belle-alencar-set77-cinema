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
async function chapter(page,id){await page.evaluate(id=>{const e=document.getElementById(id);scrollTo(0,e.getBoundingClientRect().top+scrollY+(id==='sala'?e.offsetHeight*.3:0)-68)},id);if(id==='sala')await page.waitForFunction(()=>document.documentElement.dataset.filmChapter==='sala');await page.waitForTimeout(350);}
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
 check(await page.locator('.rack__piece').count()===0,width+': no duplicate rack HTML');
 await chapter(page,'passarela');
 const image=page.locator('.runway__model').first().locator('img');const box=await image.boundingBox(),stage=await page.locator('.runway__stage').boundingBox();
 // Full canvas remains inside stage at settled foreground; alpha only reduces its footprint further.
 check(box.x>=stage.x-1&&box.x+box.width<=stage.x+stage.width+1,`${width}: foreground product is not clipped`);
}
await context.close();
// Integrated rail product identity gate: one scene, no duplicate DOM rack.
const motion=await browser.newContext({viewport:{width:1440,height:900},reducedMotion:'reduce'});
const mp=await motion.newPage();watch(mp);
await mp.goto(base+'/?tier=touch&loja=araxa');
await chapter(mp,'sala');
await mp.waitForFunction(()=>document.querySelector('.roomrail.is-on')&&window.__belle?.world()?.products.ready>40,null,{timeout:30000});
check(await mp.locator('.rack__piece').count()===0,'3D rail without duplicate HTML objects');
const initial=await mp.locator('.roomrail__product').textContent();
await mp.locator('.roomrail__next').click();
check((await mp.locator('.roomrail__product').textContent())!==initial,'next control selects an in-room product');
await mp.locator('.roomrail__inspect').click();
await mp.waitForSelector('.roomrail__detail:not([hidden])');
await mp.locator('.roomrail__size-choice').first().click();
await mp.locator('.roomrail__add').click();
await mp.waitForFunction(()=>document.querySelector('.roomrail__bag b')?.textContent==='1',null,{timeout:14000});
check(await mp.locator('.dress-ghost').count()===0,'reduced-motion cart without ghost overlay');
await motion.close();
check(errors.length===0,`zero browser/HTTP errors: ${errors.join(' | ')}`);
console.log(`${count} product integration checks passed`);
}finally{await browser.close();}
