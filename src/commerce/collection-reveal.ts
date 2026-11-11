/**
 * BELLE ALENCAR · SET77 LABS · Collection Scroll Couture V13
 *
 * A single scrubbed ScrollTrigger drives the catalog as it passes through the
 * viewport. No 48 ticking tweens, no extra canvas, no scroll locking.
 * Dynamically filtered products are remeasured after the commerce module
 * replaces their DOM nodes. Already revealed products never fade out again.
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
  finished: boolean;
};

const clamp=(x:number)=>Math.max(0,Math.min(1,x));
const ease=(x:number)=>1-Math.pow(1-x,3);

export function initCatalogScrollReveal(director:Director):()=>void {
  const section=document.getElementById('colecao');
  const grid=section?.querySelector<HTMLElement>('.pgrid');
  const reduced=matchMedia('(prefers-reduced-motion: reduce)');
  if(!section||!grid)return ()=>{};

  let active=false;
  let disposed=false;
  let entries:Entry[]=[];
  let trigger:ScrollTrigger|null=null;
  let mutation:MutationObserver|null=null;
  let resize:ResizeObserver|null=null;
  let pending=0;
  let visibleRescue=0;

  function finish(entry:Entry) {
    if(entry.finished)return;
    entry.finished=true;
    entry.progress=1;
    entry.element.classList.remove('is-collection-staged');
    entry.element.classList.add('is-collection-revealed');
    entry.element.style.setProperty('--cr-veil','0');
    gsap.set(entry.element,{clearProps:'transform,opacity,willChange'});
  }

  function resetCard(el:HTMLElement) {
    el.classList.remove('is-collection-staged','is-collection-revealed');
    el.style.removeProperty('--cr-veil');
    gsap.set(el,{clearProps:'transform,opacity,willChange'});
  }

  function update() {
    if(!active||document.hidden)return;
    const viewportHeight=window.innerHeight;
    const gridY=grid!.getBoundingClientRect().top;
    const mobile=window.innerWidth<=820;
    // 34% of the screen is devoted to a single card's arrival, so the
    // movement is literally synchronized with scrolling rather than timed.
    const travel=Math.max(145,Math.min(viewportHeight*.34,300));
    for(const entry of entries) {
      if(entry.finished||!entry.element.isConnected)continue;
      const y=gridY+entry.top;
      const progress=clamp((viewportHeight*.94-y-entry.offset)/travel);
      if(progress<=entry.progress)continue;
      entry.progress=progress;
      if(progress>=.999){finish(entry);continue;}
      const p=ease(progress),inverse=1-p;
      gsap.set(entry.element,{
        opacity:.20+.80*p,
        x:entry.direction*(mobile?17:30)*inverse,
        y:(mobile?30:46)*inverse,
        rotationY:entry.direction*(mobile?2.5:5.5)*inverse,
        scale:.945+.055*p,
        force3D:true
      });
      entry.element.style.setProperty('--cr-veil',String((.70*inverse).toFixed(3)));
    }
  }

  function measure() {
    if(!active)return;
    const gridRect=grid!.getBoundingClientRect();
    const cards=Array.from(grid!.querySelectorAll<HTMLElement>('.pcard'));
    // Cache rectangles ONCE per filter/resize, never inside scroll callbacks.
    const rects=cards.map(element=>element.getBoundingClientRect());
    // Each card enters once. The initial row already on screen stays fully
    // visible (especially important for deep links and filter updates).
    entries=cards.map((element,index)=>{
      const r=rects[index]!;
      const top=r.top-gridRect.top;
      let rowSibling=0;
      for(let i=index-1;i>=0;i--){
        if(Math.abs(rects[i]!.top-r.top)>6)break;
        rowSibling++;
      }
      const direction=(rowSibling%2===0)?-1:1;
      const entry:Entry={element,top,offset:rowSibling*(window.innerWidth<=820?9:21),
        direction,progress:0,finished:false};
      if(r.top<=window.innerHeight*.73||element.contains(document.activeElement)){
        entry.finished=true;entry.progress=1;
        element.classList.add('is-collection-revealed');
        element.style.setProperty('--cr-veil','0');
        gsap.set(element,{clearProps:'transform,opacity,willChange'});
      }else{
        element.classList.add('is-collection-staged');
        gsap.set(element,{opacity:.20,x:direction*(window.innerWidth<=820?17:30),
          y:window.innerWidth<=820?30:46,rotationY:direction*5.5,scale:.945,
          willChange:'transform,opacity',force3D:true});
        element.style.setProperty('--cr-veil','.70');
      }
      return entry;
    });
    update();
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

  function rescueVisible(){
    if(!active)return;
    const h=window.innerHeight;
    for(const entry of entries){
      if(entry.finished||!entry.element.isConnected)continue;
      const rect=entry.element.getBoundingClientRect();
      if(rect.top<h*.65&&rect.bottom>0)finish(entry);
    }
  }

  function setup(){
    if(active||disposed||reduced.matches||director.get()==='essential')return;
    active=true;
    grid!.classList.add('is-cine-scroll');
    measure();
    trigger=ScrollTrigger.create({
      trigger:grid!,
      start:'top bottom',
      end:'bottom top',
      invalidateOnRefresh:true,
      onUpdate:update,
      onEnter:update,
      onEnterBack:update,
      onRefresh:update,
    });
    mutation=new MutationObserver(scheduleMeasure);
    mutation.observe(grid!,{childList:true});
    resize=new ResizeObserver(scheduleMeasure);
    resize.observe(grid!);
    // Browser-focus rescue: an interactive card must not be invisible
    // while tabbed to, even if the browser jumped directly to its position.
    grid!.addEventListener('focusin',onFocus);
    document.addEventListener('visibilitychange',onVisibility);
    window.addEventListener('pageshow',onPageShow);
    window.addEventListener('resize',scheduleMeasure,{passive:true});
    visibleRescue=window.setTimeout(rescueVisible,3200);
  }

  function onFocus(event:FocusEvent){
    const card=(event.target as Element)?.closest<HTMLElement>('.pcard');
    if(!card)return;
    const entry=entries.find(item=>item.element===card);
    if(entry)finish(entry);
  }
  function onVisibility(){if(!document.hidden){rescueVisible();update();}}
  function onPageShow(e:PageTransitionEvent){if(e.persisted){rescueVisible();update();}}

  function teardown(){
    if(!active)return;
    active=false;
    if(pending)cancelAnimationFrame(pending);
    if(visibleRescue)window.clearTimeout(visibleRescue);
    pending=0;
    trigger?.kill();trigger=null;
    mutation?.disconnect();mutation=null;
    resize?.disconnect();resize=null;
    grid!.removeEventListener('focusin',onFocus);
    document.removeEventListener('visibilitychange',onVisibility);
    window.removeEventListener('pageshow',onPageShow);
    window.removeEventListener('resize',scheduleMeasure);
    grid!.classList.remove('is-cine-scroll');
    entries.forEach(entry=>resetCard(entry.element));
    entries=[];
  }

  const onReduce=()=>{if(reduced.matches)teardown();else setup();};
  reduced.addEventListener('change',onReduce);
  director.onChange(mode=>{if(disposed)return; if(mode==='essential')teardown();else setup();});
  setup();

  return ()=>{
    disposed=true;
    reduced.removeEventListener('change',onReduce);
    teardown();
  };
}
