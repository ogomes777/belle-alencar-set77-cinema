import { createRequire } from 'node:module';
import { mkdir } from 'node:fs/promises';
const require=createRequire(import.meta.url);
let chromium;
try { ({ chromium }=require('playwright')); } catch { ({ chromium }=require('/opt/node-tools/node_modules/playwright')); }
const out=process.env.SHOTS_DIR || 'docs/qa';
if(process.env.SHOTS)await mkdir(out,{recursive:true});
const browser=await chromium.launch({args:['--use-angle=swiftshader','--enable-unsafe-swiftshader']});
const base=process.env.BASE||'http://127.0.0.1:4173';
let passed=0;
function check(ok,name) {if(!ok)throw new Error(name);console.log('PASS',name);passed++;}
try {
for(const width of [360,390,768,1440]) {
 const context=await browser.newContext({viewport:{width,height:900},reducedMotion:'reduce',isMobile:width<821,hasTouch:width<821});
 const page=await context.newPage();const errors=[];
 page.on('pageerror',e=>errors.push(e.message));page.on('console',m=>{if(m.type()==='error')errors.push(m.text())});
 await page.goto(`${base}/?tier=static&loja=araxa`);
 await page.locator('#passarela').scrollIntoViewIfNeeded();
 await page.waitForSelector('.runway__model');
 check(await page.locator('.runway__card').count()===18,`${width}: six curated looks with three pieces each`);
 await page.waitForFunction(()=>document.body.classList.contains('is-runway-visible'));
 check(await page.locator('#floatCta').isHidden(),`${width}: contact CTA does not obscure product rail`);
 check(await page.locator('.runway__model').count()===6,`${width}: six depth layers`);
 check(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),`${width}: no horizontal overflow`);
 check(await page.evaluate(()=>['storeButton','searchButton','bagButton'].every(id=>{const r=document.getElementById(id).getBoundingClientRect();return r.width>=40&&r.right<=innerWidth})),`${width}: store/search/bag usable`);
 await page.click('[data-runway-next]');
 await page.waitForFunction(()=>document.getElementById('passarela').dataset.position==='1.0000');
 check((await page.locator('.runway__status').textContent()).includes('16'),`${width}: next look and live announcement synchronized`);
 const second=await page.locator('.runway__card').nth(3).boundingBox(), rail=await page.locator('.runway__rail').boundingBox();
 check(Math.abs((width<=820?second.x-rail.x:second.y-rail.y))<2,`${width}: three-piece outfit rail synchronized`);
 check((await page.locator('.runway__card').nth(3).getAttribute('data-look-key'))==='vinho',`${width}: grouped editorial metadata travels with the rail`);
 await page.click('[data-runway-prev]');
 await page.waitForFunction(()=>document.getElementById('passarela').dataset.position==='0.0000');
 await page.locator('.runway__stage').focus();await page.keyboard.press('ArrowLeft');
 await page.waitForFunction(()=>document.getElementById('passarela').dataset.position==='-1.0000');
 check((await page.locator('.runway__status').textContent()).includes('20'),`${width}: reverse loop`);
 await page.keyboard.press('ArrowRight');
 await page.waitForFunction(()=>document.getElementById('passarela').dataset.position==='0.0000');
 const fav=page.locator('.runway__card').first().locator('.runway__fav');
 await fav.click();check(await fav.getAttribute('aria-pressed')==='true',`${width}: real commerce wishlist`);
 await page.reload();await page.locator('#passarela').scrollIntoViewIfNeeded();await page.waitForSelector('.runway__card');
 check(await page.locator('.runway__card').first().locator('.runway__fav').getAttribute('aria-pressed')==='true',`${width}: wishlist persists`);
 await page.locator('.runway__card').first().locator('.runway__add').click();
 await page.waitForSelector('.qv');
 check((await page.locator('#qvTitle').textContent()).includes('Vestido'),`${width}: correct editorial product detail`);
 await page.locator('.qv .size').nth(1).click();await page.click('.qv [data-add]');
 await page.waitForFunction(()=>document.querySelector('[data-bag-count]').textContent==='1');
 check(true,`${width}: chosen variant enters store bag`);
 await page.keyboard.press('Escape');
 await page.waitForSelector('.toast', { state: 'detached' });
 if(process.env.SHOTS)await page.screenshot({path:`${out}/runway-${width}.png`});
 check(errors.length===0,`${width}: zero console errors (${errors.join(';')})`);
 await context.close();
}
// Animated pointer interaction and native vertical scroll on a normal-motion desktop.
const page=await browser.newPage({viewport:{width:1440,height:900}});
await page.addInitScript(()=>sessionStorage.setItem('belle:v4:intro','1'));
await page.goto(`${base}/?tier=static`);await page.locator('#passarela').scrollIntoViewIfNeeded();await page.waitForSelector('.runway__model');
const bounds=await page.locator('.runway__stage').boundingBox();
await page.mouse.move(bounds.x+200,bounds.y+bounds.height*.65);await page.mouse.down();
await page.mouse.move(bounds.x+200+bounds.width*.21,bounds.y+bounds.height*.65,{steps:10});
// Deliberate held drag tests one-look snap. A quick release legitimately adds kinetic momentum.
await page.waitForTimeout(180);await page.mouse.up();
await page.waitForFunction(()=>document.getElementById('passarela').dataset.position==='1.0000');
check(true,'pointer drag eases and snaps to next look');
const beforeY=await page.evaluate(()=>scrollY);await page.mouse.wheel(0,600);await page.waitForFunction(y=>scrollY>y+100,beforeY);
check(true,'vertical wheel keeps native landing scroll');
await page.close();
const touchContext=await browser.newContext({viewport:{width:390,height:844},isMobile:true,hasTouch:true,reducedMotion:'reduce'});
const touchPage=await touchContext.newPage();
await touchPage.goto(`${base}/?tier=static`);await touchPage.locator('#passarela').scrollIntoViewIfNeeded();await touchPage.waitForSelector('.runway__model');
const touchBox=await touchPage.locator('.runway__stage').boundingBox();
const cdp=await touchContext.newCDPSession(touchPage), y=touchBox.y+touchBox.height*.65;
await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x:40,y}]});
for(let x=70;x<=220;x+=30)await cdp.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{x,y}]});
await cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});
await touchPage.waitForFunction(()=>document.getElementById('passarela').dataset.position==='1.0000');
check(true,'mobile touch gesture changes look and snaps');
await touchContext.close();
console.log(`${passed} runway checks passed`);
} finally {await browser.close();}
