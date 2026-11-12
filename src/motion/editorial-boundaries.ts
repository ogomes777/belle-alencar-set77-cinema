/** V37: bounded editorial entrances. No commercial node or scene camera is owned here. */
import '../styles/editorial-boundaries.css';

/** Complete while the incoming section still occupies only the lower viewport. */
export function boundaryProgress(top:number,height:number):number {
  const vh=Math.max(1,height);
  const p=Math.max(0,Math.min(1,(vh*.98-top)/(vh*.34)));
  return p*p*(3-2*p);
}

export function initEditorialBoundaries():()=>void {
  const root=document.documentElement;
  const reduced=matchMedia('(prefers-reduced-motion: reduce)');
  const sections=Array.from(document.querySelectorAll<HTMLElement>('#passarela,#colecao,#atendimento,#duvidas'));
  let frame=0,disposed=false;
  const values=new WeakMap<HTMLElement,number>();
  const device=navigator as Navigator & {deviceMemory?:number;connection?:{saveData?:boolean}};
  const constrained=device.connection?.saveData===true||(device.deviceMemory!==undefined&&device.deviceMemory<=2);
  const staticMode=()=>constrained||reduced.matches||root.dataset.intensity==='essential';
  function reset(){sections.forEach(section=>{section.classList.remove('v37-boundary');section.style.removeProperty('--v37-entry');section.style.removeProperty('--v37-light');values.delete(section);});}
  function update(){
    frame=0;
    if(disposed||document.hidden)return;
    if(staticMode()){reset();return;}
    // All reads precede writes. The section is never transformed by this module.
    const entries=sections.map(section=>({section,p:section.contains(document.activeElement)?1:boundaryProgress(section.getBoundingClientRect().top,innerHeight)}));
    for(const {section,p} of entries){
      if(Math.abs((values.get(section)??-1)-p)<.001)continue;
      values.set(section,p);section.style.setProperty('--v37-entry',p.toFixed(4));section.style.setProperty('--v37-light',Math.sin(p*Math.PI).toFixed(4));section.classList.add('v37-boundary');
    }
  }
  const schedule=()=>{if(!disposed&&!frame&&!document.hidden)frame=requestAnimationFrame(update);};
  const modes=new MutationObserver(schedule);modes.observe(root,{attributes:true,attributeFilter:['data-intensity']});
  window.addEventListener('scroll',schedule,{passive:true});window.addEventListener('resize',schedule,{passive:true});
  window.addEventListener('pageshow',schedule);window.addEventListener('hashchange',schedule);
  document.addEventListener('visibilitychange',schedule);document.addEventListener('focusin',schedule);
  reduced.addEventListener('change',schedule);
  update();
  const destroy=()=>{
    disposed=true;cancelAnimationFrame(frame);modes.disconnect();
    window.removeEventListener('scroll',schedule);window.removeEventListener('resize',schedule);
    window.removeEventListener('pageshow',schedule);window.removeEventListener('hashchange',schedule);
    document.removeEventListener('visibilitychange',schedule);document.removeEventListener('focusin',schedule);
    reduced.removeEventListener('change',schedule);reset();
  };
  if(import.meta.hot)import.meta.hot.dispose(destroy);
  return destroy;
}
