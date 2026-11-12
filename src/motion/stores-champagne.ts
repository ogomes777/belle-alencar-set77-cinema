/** Belle Alencar V22 · reversible scroll copy for stores only. Never touches the globe. */
import '../styles/stores-champagne-v22.css';

const clamp=(x:number):number=>Math.max(0,Math.min(1,x));

/** Monotonic reveal, recomputed from scroll geometry so upwards scroll reverses it. */
export function storesRevealAt(top:number,viewportHeight:number,delay=0):number {
  const vh=Math.max(1,viewportHeight), start=vh*(.90-delay),finish=vh*(.36-delay);
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
  const staticMode=()=>reduced.matches||root.dataset.intensity==='essential';
  const draw=()=>{
    frame=0;
    if(disposed||document.hidden)return;
    if(staticMode()){section.classList.remove('stores--scrubbed');return;}
    // Read layout geometry without transform feedback; never measure or write the canvas.
    const top=section.getBoundingClientRect().top,vh=Math.max(1,innerHeight);
    const next=targets.map((node,i)=>storesRevealAt(
      top+node.offsetTop,vh,i<=2?i*.026:.078+(i-3)*.044
    ));
    for(let i=0;i<targets.length;i++){
      const value=next[i]!;
      if(Math.abs(value-values[i]!)<.002)continue;
      targets[i]!.style.setProperty('--stores-reveal',value.toFixed(4));
      values[i]=value;
    }
    section.classList.add('stores--scrubbed');
  };
  const schedule=()=>{if(!frame&&!disposed&&!document.hidden)frame=requestAnimationFrame(draw);};
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
    disposed=true;if(frame)cancelAnimationFrame(frame);
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