/**
 * SET77 · Belle Alencar / Motion Director V8
 *
 * A single orchestration layer for the existing landing, never a second page
 * router or hijacked scroll engine. Scenes are activated only once, at entry.
 * Native scrolling, film cameras, runway physics, commerce and focus remain
 * independent. No animation dependency is required for these micro-reveals.
 */
import '../styles/motion-director.css';

type Motif = 'curtain'|'columns'|'sweep'|'stack'|'typing'|'iris'|'split'|'fold'|'velvet';
type Scene = { selector:string; motif:Motif; targets:string[]; };

export const BELLE_MOTION_SCENES: readonly Scene[] = [
  {selector:'#passarela', motif:'curtain', targets:['.runway__intro','.runway__tag','.runway__controls']},
  {selector:'#ocasioes', motif:'columns', targets:['.sec-head','.occ-card']},
  {selector:'#colecao', motif:'sweep', targets:['.section-head','.catalog']},
  {selector:'#looks', motif:'stack', targets:['.sec-head','.look']},
  {selector:'#como-comprar', motif:'typing', targets:['.sec-head','.how__steps li','.how__trust','.cta-row']},
  {selector:'#lojas', motif:'iris', targets:['.section-head','.store-card']},
  {selector:'#atendimento', motif:'split', targets:['.concierge__media','.concierge__body']},
  {selector:'#duvidas', motif:'fold', targets:['.sec-head','.faq details']},
  {selector:'.finale', motif:'velvet', targets:['.finale__mark','#finaleTitle','.cta-row']},
] as const;

const visibleNow=(el:Element):boolean=>{
  const r=el.getBoundingClientRect();
  return r.bottom>0 && r.top<innerHeight*.86;
};

export function initMotionDirector():()=>void {
  const root=document.documentElement;
  const reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;
  if(reduced||root.dataset.intensity==='essential'||!('IntersectionObserver' in window))
    return ()=>{};

  const scenes=BELLE_MOTION_SCENES.map(({selector,motif,targets})=>{
    const section=document.querySelector<HTMLElement>(selector);
    if(!section)return null;
    section.dataset.mdScene=motif;
    section.classList.add('md-scene');
    let index=0;
    for(const selector of targets){
      for(const el of section.querySelectorAll<HTMLElement>(selector)){
        el.classList.add('md-reveal');
        el.style.setProperty('--md-index',String(Math.min(index++,8)));
      }
    }
    if(motif==='curtain') {
      const stage=section.querySelector<HTMLElement>('.runway__stage');
      if(stage){
        const veil=document.createElement('div');
        veil.className='md-runway-veil';
        veil.setAttribute('aria-hidden','true');
        stage.append(veil);
      }
    }
    return section;
  }).filter((value):value is HTMLElement=>!!value);

  // Existing 3D chapters already have their own camera timeline.
  // Here only a short, non-invasive gold rule acknowledges chapter entry.
  const chapters=Array.from(document.querySelectorAll<HTMLElement>('.film .chapter'));
  const chapterObserver=new IntersectionObserver(entries=>{
    for(const e of entries){
      if(!e.isIntersecting)continue;
      e.target.classList.add('md-chapter-seen');
      chapterObserver.unobserve(e.target);
    }
  },{rootMargin:'0px 0px -16% 0px',threshold:.09});
  chapters.forEach(chapter=>chapterObserver.observe(chapter));

  const observer=new IntersectionObserver(entries=>{
    for(const entry of entries){
      if(!entry.isIntersecting)continue;
      entry.target.classList.add('md-in');
      observer.unobserve(entry.target);
    }
  },{rootMargin:'0px 0px -10% 0px',threshold:.07});
  for(const section of scenes){
    if(visibleNow(section))section.classList.add('md-in');
    else observer.observe(section);
  }

  // A visual effect must NEVER leave commerce content invisible after a
  // missed observer event, delayed script, BFCache restore or tab switch.
  const revealAll=()=>{
    scenes.forEach(s=>s.classList.add('md-in'));
    chapters.forEach(s=>s.classList.add('md-chapter-seen'));
  };
  let fallback=window.setTimeout(revealAll,6000);
  const onVisible=()=>{if(!document.hidden)revealAll();};
  const onPageShow=(event:PageTransitionEvent)=>{if(event.persisted)revealAll();};
  document.addEventListener('visibilitychange',onVisible);
  window.addEventListener('pageshow',onPageShow);

  // One compositor-friendly ambient shift. No ScrollTrigger duplication,
  // no expensive DOM reads while the user is outside the concierge section.
  const concierge=document.querySelector<HTMLElement>('#atendimento');
  let frame=0;
  const updateShift=()=>{
    frame=0;
    if(!concierge||root.dataset.intensity==='essential')return;
    const rect=concierge.getBoundingClientRect();
    if(rect.bottom<0||rect.top>innerHeight)return;
    const progress=Math.max(0,Math.min(1,(innerHeight-rect.top)/(innerHeight+rect.height)));
    concierge.style.setProperty('--md-shift',Math.round((progress-.5)*24)+'px');
  };
  const scroll=()=>{
    if(!frame)frame=requestAnimationFrame(updateShift);
  };
  window.addEventListener('scroll',scroll,{passive:true});
  window.addEventListener('resize',scroll,{passive:true});
  scroll();

  root.classList.add('md-motion');
  return ()=>{
    window.clearTimeout(fallback);
    if(frame)cancelAnimationFrame(frame);
    observer.disconnect();
    chapterObserver.disconnect();
    document.removeEventListener('visibilitychange',onVisible);
    window.removeEventListener('pageshow',onPageShow);
    window.removeEventListener('scroll',scroll);
    window.removeEventListener('resize',scroll);
    root.classList.remove('md-motion');
    scenes.forEach(section=>{
      section.classList.remove('md-scene','md-in');
      section.querySelector('.md-runway-veil')?.remove();
    });
  };
}
