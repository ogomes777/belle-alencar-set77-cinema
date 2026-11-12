/** V27 browser test: wheel remains local even above markers; shimmer is live.
 * Requires Playwright + a browser already available in the test environment.
 */
const {chromium}=require('playwright'),assert=require('node:assert/strict');
(async()=>{
 const browser=await chromium.launch({headless:true,args:['--no-sandbox']});
 for(const width of [390,1440]){
  const context=await browser.newContext({viewport:{width,height:900},hasTouch:true});
  await context.addInitScript(()=>{try{sessionStorage.setItem('belle:v4:intro','1')}catch{}});
  const page=await context.newPage(),errors=[];
  page.on('pageerror',error=>errors.push(error.message));
  await page.goto((process.env.BASE||'http://127.0.0.1:4173')+'/?tier=rich#lojas');
  const canvas=page.locator('.stores__orbit');
  await canvas.scrollIntoViewIfNeeded();
  await page.waitForTimeout(900);
  const style=await page.locator('#lojasTitle').evaluate(el=>getComputedStyle(el));
  // Evaluate just the computed properties; CSSStyleDeclaration is not serializable.
  const glow=await page.locator('#lojasTitle').evaluate(el=>({
    animation:getComputedStyle(el).animationName,
    state:getComputedStyle(el).animationPlayState,
    background:getComputedStyle(el).backgroundImage
  }));
  assert(glow.animation.includes('belleHeadingTravellingLight')&&glow.state==='running'&&glow.background.includes('gradient'));
  const box=await canvas.boundingBox(),x=box.x+box.width/2,y=box.y+box.height/2;
  await page.evaluate(()=>{
    window.__wheelV27=[];
    document.addEventListener('wheel',event=>window.__wheelV27.push(event.defaultPrevented),false);
  });
  await page.mouse.move(x,y);await page.mouse.wheel(0,-220);await page.waitForTimeout(180);
  const handled=await page.evaluate(()=>window.__wheelV27);
  assert(handled.length&&handled.every(Boolean),'wheel must be consumed over globe/markers');
  const before=await canvas.evaluate(el=>el.toDataURL());
  const cdp=await context.newCDPSession(page);
  const touch=(xx,yy)=>({x:xx,y:yy});
  await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[touch(x-28,y),touch(x+28,y)]});
  for(let n=1;n<=6;n++)await cdp.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[touch(x-28-6*n,y),touch(x+28+6*n,y)]});
  await cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});
  await page.waitForTimeout(320);
  assert.notEqual(before,await canvas.evaluate(el=>el.toDataURL()),'pinch should update rendered globe');
  assert.deepEqual(errors,[],'no page errors');
  console.log(width,'heading shimmer + marker wheel + pinch PASS');
  await context.close();
 }
 await browser.close();
})().catch(e=>{console.error(e);process.exit(1)});
