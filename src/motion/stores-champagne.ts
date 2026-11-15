/** Belle Alencar V22 · reversible scroll copy for stores only. Never touches the globe. */
import '../styles/stores-champagne-v22.css';
import { viewTop, onGeometryChange } from '../core/scroll-geometry';

const clamp=(x:number):number=>Math.max(0,Math.min(1,x));

/** Monotonic reveal, recomputed from scroll geometry so upwards scroll reverses it. */
export function storesRevealAt(top:number,viewportHeight:number,delay=0):number {
  const vh=Math.max(1,viewportHeight), start=vh*(1.04-delay),finish=vh*(.68-delay);
  const t=clamp((start-top)/(start-finish));
  return t*t*(3-2*t);
}
export function initStoresChampagne():()=>void {
  const section=document.querySelector<HTMLElement>('#lojas');
  if(!section)return ()=>{};
  const root=document.documentElement,reduced=matchMedia('(prefers-reduced-motion: reduce)');
  const targets=[
    section.querySelector<HTMLElement>('.section-head .eyebrow'),
    section.querySelector<HTMLElement>('#lojasTitle'),
    section.querySelector<HTMLElement>('.section-head .lede'),
    ...Array.from(section.querySelectorAll<HTMLElement>('.store-card')),
    section.querySelector<HTMLElement>('.stores__note')
  ].filter((node):node is HTMLElement=>!!node);
  if(!targets.length)return ()=>{};
  let frame=0,disposed=false;
  const values=Array<number>(targets.length).fill(-1);
  let offsets:number[]|null=null,offsetsVersion=-1,geometryVersion=0;
  const offGeometry=onGeometryChange(()=>{geometryVersion++;schedule();});
  const staticMode=()=>reduced.matches||root.dataset.intensity==='essential';
  const draw=()=>{
    frame=0;
    if(disposed||document.hidden)return;
    if(staticMode()){section.classList.remove('stores--scrubbed');return;}
    // V24: each heading, paragraph, city and CTA follows its OWN actual
    // vertical position. Unlike V22, the reveal FINISHES as that element
    // reaches ~62-68% viewport height, never near the next chapter.
    // offsetTop is layout-only and immune to the transform being animated.
    // V37 perf: cached geometry (no getBoundingClientRect/offsetTop per frame).
    const sectionTop=viewTop(section);
    const vh=Math.max(1,innerHeight);
    if(!offsets||offsetsVersion!==geometryVersion){
      offsets=targets.map(element=>{
        let offset=0;
        let current:HTMLElement|null=element;
        while(current && current!==section){
          offset+=current.offsetTop;
          current=current.offsetParent as HTMLElement|null;
        }
        return current===section ? offset : element.offsetTop;
      });
      offsetsVersion=geometryVersion;
    }
    const next=targets.map((_node,i)=>{
      const stagger=i<=2?i*.009:.022+(i-3)*.008;
      return storesRevealAt(sectionTop+offsets![i]!,vh,stagger);
    });
    for(let i=0;i<targets.length;i++){
      const value=next[i]!;
      if(Math.abs(value-values[i]!)<.002)continue;
      targets[i]!.style.setProperty('--stores-reveal',value.toFixed(4));
      values[i]=value;
    }
    section.classList.add('stores--scrubbed');
  };
  function schedule(){if(!frame&&!disposed&&!document.hidden)frame=requestAnimationFrame(draw);}
  let observer:IntersectionObserver|null=null;
  if('IntersectionObserver'in window){
    observer=new IntersectionObserver(entries=>{
      const inView=entries.some(entry=>entry.isIntersecting);
      section.classList.toggle('stores--illuminated',inView);
      if(inView)schedule();
    },{rootMargin:'100px 0px'});
    observer.observe(section);
  }else section.classList.add('stores--illuminated');
  const onPageShow=()=>{values.fill(-1);schedule();};
  const onVisible=()=>{if(!document.hidden)schedule();};
  const onModeChange=()=>{values.fill(-1);schedule();};
  const modes=new MutationObserver(onModeChange);
  modes.observe(root,{attributes:true,attributeFilter:['data-intensity']});
  window.addEventListener('scroll',schedule,{passive:true});
  window.addEventListener('resize',schedule,{passive:true});
  window.addEventListener('pageshow',onPageShow);
  document.addEventListener('visibilitychange',onVisible);
  reduced.addEventListener?.('change',onModeChange);
  draw();
  return ()=>{
    disposed=true;offGeometry();if(frame)cancelAnimationFrame(frame);
    observer?.disconnect();modes.disconnect();
    window.removeEventListener('scroll',schedule);
    window.removeEventListener('resize',schedule);
    window.removeEventListener('pageshow',onPageShow);
    document.removeEventListener('visibilitychange',onVisible);
    reduced.removeEventListener?.('change',onModeChange);
    section.classList.remove('stores--scrubbed','stores--illuminated');
    targets.forEach(node=>node.style.removeProperty('--stores-reveal'));
  };
}