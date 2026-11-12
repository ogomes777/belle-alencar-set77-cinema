/**
 * BELLE ALENCAR / SET77 · Reversible Collection Couture V18
 *
 * Two ScrollTriggers track the grid and chapter. One coalesced rAF handles
 * native scroll in both directions, including browser jumps across boundaries.
 * Cards fracture diagonally into depth, then reassemble in reverse.
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

  let active=false,disposed=false,pending=0,storyFrame=0;
  let entries:Entry[]=[];
  let trigger:ScrollTrigger|null=null,storyTrigger:ScrollTrigger|null=null;
  let mutation:MutationObserver|null=null,resize:ResizeObserver|null=null;

  function display(entry:Entry,progress:number,close=true){
    const el=entry.element;
    if(!el.isConnected||Math.abs(entry.progress-progress)<.003)return;
    entry.progress=progress;
    if(progress>=.999){
      el.classList.remove('is-collection-staged');
      el.classList.add('is-collection-revealed');
      el.style.setProperty('--cr-veil','0');
      el.style.removeProperty('--cr-seam-x');
      el.style.removeProperty('--cr-sheen');
      gsap.set(el,{clearProps:'transform,opacity,clipPath,willChange'});
      return;
    }

    el.classList.remove('is-collection-revealed');
    el.classList.add('is-collection-staged');
    const mobile=innerWidth<=820;
    const open=smooth(0,.96,progress);
    const remaining=1-open;
    const reveal=smooth(0,.83,progress);
    // A jagged diagonal cut follows the incoming edge; scrolling back
    // moves the same cut in reverse rather than re-running a timed entrance.
    const edge=100*reveal;
    const serration=(mobile?5:8)*Math.sin(Math.PI*reveal);
    const at=(v:number)=>Math.min(100,Math.max(0,v)).toFixed(2)+'%';
    const shape=entry.direction<0
      ? `polygon(0 0,${at(edge)} 0,${at(edge-serration)} 24%,${at(edge+serration)} 53%,${at(edge-serration*.7)} 78%,${at(edge)} 100%,0 100%)`
      : `polygon(${at(100-edge)} 0,100% 0,100% 100%,${at(100-edge)} 100%,${at(100-edge+serration*.7)} 78%,${at(100-edge-serration)} 53%,${at(100-edge+serration)} 24%)`;
    const impulse=Math.sin(Math.PI*open);
    const side=entry.direction;
    gsap.set(el,{
      opacity:.035+.965*smooth(0,.57,progress),
      x:side*(mobile?27:66)*remaining,
      y:(mobile?58:102)*remaining,
      rotationY:side*(mobile?13:24)*remaining,
      rotationZ:side*(mobile?5.5:9)*remaining,
      skewX:side*(mobile?2.8:4.5)*remaining,
      scale:(mobile?.84:.77)+(mobile?.16:.23)*open+impulse*(mobile?.022:.039),
      clipPath:shape,
      willChange:close?'transform,opacity,clip-path':'auto',
      force3D:close
    });
    el.style.setProperty('--cr-seam-x',(entry.direction<0?edge:100-edge).toFixed(1)+'%');
    el.style.setProperty('--cr-sheen',(Math.sin(Math.PI*reveal)*.78).toFixed(3));
    el.style.setProperty('--cr-veil',(.77*(1-smooth(0,.88,progress))).toFixed(3));
  }

  function update(){
    if(!active)return;
    const viewport=innerHeight;
    const gridY=grid!.getBoundingClientRect().top;
    // Longer travel makes each incoming slice perceptible, even on a fast
    // touch gesture, and ensures the same path is followed going upward.
    const travel=Math.max(190,Math.min(viewport*(innerWidth<=820?.43:.50),420));
    for(const entry of entries){
      if(!entry.element.isConnected)continue;
      const cardY=gridY+entry.top;
      const focused=entry.element.contains(document.activeElement);
      const p=focused?1:clamp((viewport*.97-cardY-entry.offset)/travel);
      display(entry,p,cardY>-viewport&&cardY<viewport*1.6);
    }
  }

  function updateStory(){
    if(!active)return;
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

  // One native animation frame ensures both the catalog and copy return
  // correctly when scrolling upward or jumping across ScrollTrigger edges.
  function scheduleStory(){
    if(!active||storyFrame)return;
    storyFrame=requestAnimationFrame(()=>{
      storyFrame=0;
      update();
      updateStory();
    });
  }

  function measure(){
    if(!active)return;
    const cards=Array.from(grid!.querySelectorAll<HTMLElement>('.pcard'));
    // offsetTop does not contain the GSAP transform/rotation/clip.
    // The grid is the offset parent (position:relative in companion CSS),
    // so remeasuring on filter/resize cannot accumulate positional drift.
    const tops=cards.map(element=>element.offsetTop);
    entries=cards.map((element,index)=>{
      const top=tops[index]!;
      let rowSibling=0;
      for(let i=index-1;i>=0;i--){
        if(Math.abs(tops[i]!-top)>6)break;
        rowSibling++;
      }
      return {element,top,
        offset:rowSibling*(innerWidth<=820?15:28),
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
    window.addEventListener('scroll',scheduleStory,{passive:true});
  }
  function teardown(){
    if(!active)return;
    active=false;
    if(pending)cancelAnimationFrame(pending);
    if(storyFrame)cancelAnimationFrame(storyFrame);
    pending=0;storyFrame=0;
    trigger?.kill();trigger=null;
    storyTrigger?.kill();storyTrigger=null;
    mutation?.disconnect();mutation=null;
    resize?.disconnect();resize=null;
    grid!.removeEventListener('focusin',onFocus);
    grid!.removeEventListener('focusout',update);
    document.removeEventListener('visibilitychange',onVisibility);
    window.removeEventListener('pageshow',onPageShow);
    window.removeEventListener('resize',scheduleMeasure);
    window.removeEventListener('scroll',scheduleStory);
    grid!.classList.remove('is-cine-scroll');
    section!.classList.remove('is-cine-story');
    section!.style.removeProperty('--collection-copy');
    section!.style.removeProperty('--collection-bridge');
    for(const entry of entries){
      const el=entry.element;
      el.classList.remove('is-collection-staged','is-collection-revealed');
      el.style.removeProperty('--cr-veil');
      el.style.removeProperty('--cr-seam-x');
      el.style.removeProperty('--cr-sheen');
      gsap.set(el,{clearProps:'transform,opacity,clipPath,willChange'});
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
