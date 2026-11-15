/** BELLE V52 · contrast + mobile readability, without layout changes. */
import {createRequire} from 'node:module';
const require=createRequire(import.meta.url);
const {chromium}=require('playwright');
const base=process.env.BASE||'http://127.0.0.1:4173';
const check=(ok,msg)=>{if(!ok)throw new Error(msg)};
const browser=await chromium.launch({headless:true,args:['--use-angle=swiftshader','--enable-unsafe-swiftshader','--disable-dev-shm-usage']});
try {
  for(const width of [320,390,768,1440]) {
    const height=width===320?700:width===390?844:width===768?1024:900;
    const context=await browser.newContext({viewport:{width,height},isMobile:width<=390,hasTouch:width<=390,reducedMotion:'reduce'});
    const page=await context.newPage();
    const errors=[];
    page.on('pageerror',e=>errors.push(e.message));
    await page.addInitScript(()=>{try{sessionStorage.setItem('belle:v4:intro','1')}catch{}});
    await page.goto(base+'/?tier=static#inicio',{waitUntil:'domcontentloaded',timeout:45000});
    await page.locator('#como-comprar .how__intro .display').waitFor({state:'attached',timeout:17000});
    for(const theme of ['light','dark','rose']) {
      const data=await page.evaluate((theme)=>{
        document.documentElement.dataset.belleTheme=theme;
        const css=s=>getComputedStyle(document.querySelector(s));
        const size=s=>parseFloat(css(s).fontSize);
        const getColor=s=>css(s).color;
        const ink=css('#como-comprar .how__intro .display');
        const emphasis=css('#como-comprar .how__intro .display em');
        const cards=[...document.querySelectorAll('#filme .film__chapters .chapter__card')];
        return {
          title:ink.color,titleFill:ink.webkitTextFillColor,
          emph:emphasis.webkitTextFillColor,
          lede:getColor('#como-comprar .how__intro .lede'),
          eyebrow:getColor('#como-comprar .how__intro .eyebrow'),
          cardLede:size('#inicio .chapter__card .lede'),
          cardLabel:size('#inicio .chapter__card .eyebrow'),
          cardBtn:size('#inicio .chapter__card .btn'),
          cardFine:Math.min(...[...document.querySelectorAll('#filme .fineprint')].map(e=>parseFloat(getComputedStyle(e).fontSize))),
          cardWidths:cards.map(e=>e.getBoundingClientRect().width),
          cardHeights:cards.map(e=>e.getBoundingClientRect().height),
          overflow:document.documentElement.scrollWidth-innerWidth,
          count:cards.length,
          allScrollable:cards.every(e=>getComputedStyle(e).overflowY==='auto')
        };
      },theme);
      const label=width+'/'+theme;
      // Fixed dark ink over the scene's light video/poster across all themes.
      check(data.title==='rgb(48, 35, 29)'&&data.titleFill==='rgb(48, 35, 29)','how-film title pale '+label+' '+data.title+' / '+data.titleFill);
      check(data.emph==='rgb(117, 80, 43)','how-film calligraphy pale '+label+' '+data.emph);
      check(data.lede==='rgb(73, 55, 44)','how-film lede pale '+label+' '+data.lede);
      check(data.eyebrow==='rgb(101, 68, 33)','how-film label pale '+label+' '+data.eyebrow);
      check(data.cardLede>=14&&data.cardLabel>=11.95&&data.cardBtn>=12.55,'tiny film text '+label+' '+JSON.stringify([data.cardLede,data.cardLabel,data.cardBtn]));
      check(data.count===7,'missing film cards '+label);
      check(data.overflow<=3,'horizontal overflow '+label+': '+data.overflow);
      if(width<=768) {
        check(data.cardWidths.every(x=>x<=286),'V50 compact width lost '+label);
        check(data.allScrollable,'film card inner scroll lost '+label);
        const max=[.37,.33,.33,.33,.33,.33,.40];
        check(data.cardHeights.every((h,i)=>h<=height*max[i]+3),'film covers background '+label);
      }
      console.log('PASS V52',label,'dark ink + accessible film caption sizes, bounded cards');
    }
    check(errors.length===0,'Page exceptions '+width+errors.join(' | '));
    await context.close();
  }
} finally {await browser.close();}
