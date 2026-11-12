/**
 * BELLE ALENCAR / SET77 · Reversible Collection Couture V18
 *
 * Exactly one ScrollTrigger owns the product-grid render and one owns the
 * section copy. Scrolling down reveals; scrolling up returns the unopened
 * cards to their original state. No duplicate GSAP timelines or scroll hijack.
 * Filtered DOM changes and reduced-motion follow the same fail-open contract.
 */
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import type { Director } from '../shell/director';
import '../styles/collection-reveal.css';

gsap.registerPlugin(ScrollTrigger);
type Entry = {
  element: HTMLElement;
  top: number;
  offset: number;
  direction: number;
  progress: number;
};
const clamp=(x:number)=>Math.max(0,Math.min(1,x));
const ease=(x:number)=>1-Math.pow(1-x,3);
const smooth=(a:number,b:number,x:number)=>{
  const p=clamp((x-a)/(b-a));
  return p*p*(3-2*p);
};

export function initCatalogScrollReveal(director:Director):()=>void {
  const section=document.getElementById('colecao');
  const grid=section?.querySelector<HTMLElement>('.pgrid');
  const handoff=section?.querySelector<HTMLElement>('.collection__handoff');
  const reduced=matchMedia('(prefers-reduced-motion: reduce)');
  if(!section||!grid)return ()=>{};

  let active=false,disposed=false,pending=0;
  let entries:Entry[]=[];
  let trigger:ScrollTrigger|null=null,storyTrigger:ScrollTrigger|null=null;
  let mutation:MutationObserver|null=null,resize:ResizeObserver|null=null;

  function display(entry:Entry, progress:number){
    const el=entry.element;
    if(!el.isConnected || Math.abs(entry.progress-progress)<.003)return;
    entry.progress=progress;
    // Focused cards must always be fully legible and interactive, even after
    // a browser focus jump or keyboard navigation back into the catalog.
    if(progress>=.999){
      el.classList.remove('is-collection-staged');
      el.classList.add('is-collection-revealed');
      el.style.setProperty('--cr-veil','0');
      gsap.set(el,{clearProps:'transform,opacity,willChange'});
      return;
    }
    el.classList.remove('is-collection-revealed');
    el.classList.add('is-collection-staged');
    const p=ease(progress),remaining=1-p;
    const mobile=innerWidth<=820;
    const close=el.getBoundingClientRect().top<innerHeight*1.6;
    gsap.set(el,{
      opacity:.20+.8*p,
      x:entry.direction*(mobile?17:30)*remaining,
      y:(mobile?30:46)*remaining,
      rotationY:entry.direction*(mobile?2.5:5.5)*remaining,
      scale:.945+.055*p,
      willChange:close?'transform,opacity':'auto',
      force3D:close
    });
    el.style.setProperty('--cr-veil',String((.70*remaining).toFixed(3)));
  }

  function update(){
    if(!active||document.hidden)return;
    const viewport=innerHeight;
    const gridY=grid!.getBoundingClientRect().top;
    const travel=Math.max(145,Math.min(viewport*.34,300));
    for(const entry of entries){
      if(!entry.element.isConnected)continue;
      const cardY=gridY+entry.top;
      const focused=entry.element.contains(document.activeElement);
      const p=focused?1:clamp((viewport*.94-cardY-entry.offset)/travel);
      display(entry,p);
    }
  }

  function updateStory(){
    if(!active||document.hidden)return;
    const height=innerHeight;
    const rect=section!.getBoundingClientRect();
    const headline=clamp((height*.94-rect.top)/Math.max(190,height*.48));
    const bridgeRect=handoff?.getBoundingClientRect();
    const bridge=bridgeRect
      ? clamp((height*.88-bridgeRect.top)/Math.max(180,height*.57))
      : 1;
    section!.style.setProperty('--collection-copy',headline.toFixed(4));
    section!.style.setProperty('--collection-bridge',bridge.toFixed(4));
  }

  function measure(){
    if(!active)return;
    const topOfGrid=grid!.getBoundingClientRect().top;
    const cards=Array.from(grid!.querySelectorAll<HTMLElement>('.pcard'));
    // Transform is visual only: subtract current GSAP y before deriving
    // the immutable layout top. Essential for resizing after reveal.
    const rects=cards.map(element=>{
      const y=Number(gsap.getProperty(element,'y'))||0;
      return element.getBoundingClientRect().top-y;
    });
    entries=cards.map((element,index)=>{
      const top=rects[index]!-topOfGrid;
      let rowSibling=0;
      for(let i=index-1;i>=0;i--){
        if(Math.abs(rects[i]!-rects[index]!)>6)break;
        rowSibling++;
      }
      return {element,top,
        offset:rowSibling*(innerWidth<=820?9:21),
        direction:rowSibling%2===0?-1:1,
        progress:-1};
    });
    update();
    updateStory();
  }

  function scheduleMeasure(){
    if(!active||pending)return;
    pending=requestAnimationFrame(()=>{
      pending=0;
      if(!active)return;
      measure();
      ScrollTrigger.refresh();
    });
  }

  function onFocus(event:FocusEvent){
    const card=(event.target as Element)?.closest<HTMLElement>('.pcard');
    if(!card)return;
    const entry=entries.find(item=>item.element===card);
    if(entry)display(entry,1);
  }
  function onVisibility(){if(!document.hidden){update();updateStory();}}
  function onPageShow(){update();updateStory();}
  function setup(){
    if(active||disposed||reduced.matches||director.get()==='essential')return;
    active=true;
    section!.classList.add('is-cine-story');
    grid!.classList.add('is-cine-scroll');
    measure();
    storyTrigger=ScrollTrigger.create({
      trigger:section!,
      start:'top bottom',end:'bottom top',
      onUpdate:updateStory,onEnter:updateStory,onEnterBack:updateStory,
      onLeave:updateStory,onLeaveBack:updateStory,onRefresh:updateStory
    });
    trigger=ScrollTrigger.create({
      trigger:grid!,
      start:'top bottom',end:'bottom top',invalidateOnRefresh:true,
      onUpdate:update,onEnter:update,onEnterBack:update,
      onLeave:update,onLeaveBack:update,onRefresh:update
    });
    mutation=new MutationObserver(scheduleMeasure);
    mutation.observe(grid!,{childList:true});
    resize=new ResizeObserver(scheduleMeasure);
    resize.observe(grid!);
    grid!.addEventListener('focusin',onFocus);
    grid!.addEventListener('focusout',update);
    document.addEventListener('visibilitychange',onVisibility);
    window.addEventListener('pageshow',onPageShow);
    window.addEventListener('resize',scheduleMeasure,{passive:true});
  }
  function teardown(){
    if(!active)return;
    active=false;
    if(pending)cancelAnimationFrame(pending);
    pending=0;
    trigger?.kill();trigger=null;
    storyTrigger?.kill();storyTrigger=null;
    mutation?.disconnect();mutation=null;
    resize?.disconnect();resize=null;
    grid!.removeEventListener('focusin',onFocus);
    grid!.removeEventListener('focusout',update);
    document.removeEventListener('visibilitychange',onVisibility);
    window.removeEventListener('pageshow',onPageShow);
    window.removeEventListener('resize',scheduleMeasure);
    grid!.classList.remove('is-cine-scroll');
    section!.classList.remove('is-cine-story');
    section!.style.removeProperty('--collection-copy');
    section!.style.removeProperty('--collection-bridge');
    for(const entry of entries){
      const el=entry.element;
      el.classList.remove('is-collection-staged','is-collection-revealed');
      el.style.removeProperty('--cr-veil');
      gsap.set(el,{clearProps:'transform,opacity,willChange'});
    }
    entries=[];
  }
  const onReduced=()=>{if(reduced.matches)teardown();else setup();};
  reduced.addEventListener('change',onReduced);
  director.onChange(mode=>{if(disposed)return;if(mode==='essential')teardown();else setup();});
  setup();
  return ()=>{
    disposed=true;
    reduced.removeEventListener('change',onReduced);
    teardown();
  };
}
