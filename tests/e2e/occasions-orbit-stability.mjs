/**
 * Belle Ocasiões V11 · extended orbit stability acceptance.
 * Exercises 66s of actual Chromium animation rather than claiming "infinite"
 * because the first tween ran for half a second.
 */
import { createRequire } from 'node:module';
const require=createRequire(import.meta.url);
let chromium;
try{({chromium}=require('playwright'));}
catch{({chromium}=require('/opt/node-tools/node_modules/playwright'));}
const browser=await chromium.launch({args:['--use-angle=swiftshader','--enable-unsafe-swiftshader']});
const base=process.env.BASE||'http://127.0.0.1:4173';
const check=(value,message)=>{
  if(!value)throw new Error('FAIL '+message);
  console.log('PASS '+message);
};
try{
  const ctx=await browser.newContext({viewport:{width:1440,height:900}});
  const page=await ctx.newPage();
  const pageErrors=[];
  page.on('pageerror',error=>pageErrors.push(error.message));
  await page.addInitScript(()=>sessionStorage.setItem('belle:v4:intro','1'));
  await page.goto(base+'/?tier=static',{waitUntil:'domcontentloaded'});
  const round=page.locator('[data-occ-round]');
  await page.locator('#ocasioes').scrollIntoViewIfNeeded();
  await page.waitForFunction(()=>document.querySelector('[data-occ-round]')?.dataset.autoOrbit==='running',null,{timeout:10000});
  const sample=()=>round.evaluate(el=>{
    const cards=[...el.querySelectorAll('.occ-card')];
    return {
      index:Number(el.querySelector('.occ-round__stage')?.dataset.activeIndex),
      status:el.dataset.autoOrbit,
      alpha:cards.map(card=>Number.parseFloat(getComputedStyle(card).opacity)),
      portraitAlpha:cards.map(card=>({
        arrival:Number.parseFloat(getComputedStyle(card.querySelector('.occ-card__arrival')).opacity),
        layer:Number.parseFloat(getComputedStyle(card.querySelector('.occ-card__portrait')).opacity),
        image:Number.parseFloat(getComputedStyle(card.querySelector('.occ-card__model')).opacity)
      })),
      transforms:cards.map(card=>getComputedStyle(card).transform),
      backgrounds:[...el.querySelectorAll('.occ-card__world-depth')].map(layer=>getComputedStyle(layer).animationPlayState),
      ambient:el.dataset.ambient
    };
  });
  const samples=[];
  for(let i=0;i<6;i++){
    // Check every half-second, not only once each 11 seconds: the regression
    // was a short .22-opacity flash on the arrival wrapper at active crossings.
    for(let frame=0;frame<22;frame++){
      await page.waitForTimeout(500);
      const moment=await sample();
      check(moment.alpha.every(a=>a>=.99),'all cards solid at t='+((i*22+frame+1)*.5)+'s');
      check(moment.portraitAlpha.every(p=>p.arrival>=.99&&p.layer>=.99&&p.image>=.99),
        'all three portrait layers solid at t='+((i*22+frame+1)*.5)+'s');
      if(frame===21){
        samples.push(moment);
        check(moment.status==='running','orbit still running after '+((i+1)*11)+' seconds');
        check(moment.backgrounds.every(s=>s==='running'),'all three scene backgrounds animate in view');
      }
    }
  }
  const seen=new Set(samples.map(s=>s.index));
  check(seen.size===3,'all three occasions orbit through the central position');
  check(samples.some((s,i)=>i>0&&s.transforms[0]!==samples[i-1].transforms[0]),'continuous transform changes across full revolutions');
  // Regression for the old bug: hovering the carousel stopped it permanently.
  await round.locator('.occ-round__stage').hover({position:{x:400,y:110}});
  await page.waitForTimeout(1000);
  check((await sample()).status==='running','hovering does not permanently kill automatic rotation');
  // Regression for focus retained by an arrow button.
  await round.locator('[data-occ-next]').focus();
  await page.waitForTimeout(750);
  check((await sample()).status==='running','focused arrow does not freeze orbit');
  const pause=round.locator('[data-occ-pause]');
  await pause.click();
  await page.waitForFunction(()=>document.querySelector('[data-occ-round]')?.dataset.autoOrbit==='paused');
  const before=(await sample()).transforms;
  await page.waitForTimeout(900);
  const after=(await sample()).transforms;
  check(before.every((t,i)=>t===after[i]),'explicit pause truly freezes carousel');
  check(await pause.getAttribute('aria-pressed')==='true','pause state announced accessibly');
  check(await round.locator('.occ-card__model').first().evaluate(el=>getComputedStyle(el).animationPlayState)==='paused','portrait motion also stops on explicit pause');
  await pause.click();
  await page.waitForFunction(()=>document.querySelector('[data-occ-round]')?.dataset.autoOrbit==='running',null,{timeout:3500});
  check(await pause.getAttribute('aria-pressed')==='false','resume state announced accessibly');
  await round.locator('[data-occ-next]').click();
  await page.waitForFunction(()=>document.querySelector('[data-occ-round]')?.dataset.autoOrbit==='paused');
  await page.waitForFunction(()=>document.querySelector('[data-occ-round]')?.dataset.autoOrbit==='running',null,{timeout:6500});
  check(true,'inertia snap resumes itself without requiring mouseleave or blur');
  // Stop spending GPU outside viewport, then restart on re-entry.
  await page.locator('#duvidas').scrollIntoViewIfNeeded();
  await page.waitForFunction(()=>!document.querySelector('[data-occ-round]')?.dataset.autoOrbit,null,{timeout:4000});
  check(!(await sample()).ambient,'offscreen backgrounds and orbit stop together');
  await page.locator('#ocasioes').scrollIntoViewIfNeeded();
  await page.waitForFunction(()=>document.querySelector('[data-occ-round]')?.dataset.autoOrbit==='running',null,{timeout:4000});
  check(true,'returning from another section restarts the orbit');
  check(pageErrors.length===0,'no page runtime errors: '+pageErrors.join('; '));
  await ctx.close();
  console.log('Long-duration orbital choreography validated without color wash or indefinite pause');
}finally{await browser.close();}
