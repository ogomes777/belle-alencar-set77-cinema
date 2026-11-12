/**
 * Belle Alencar V34 | Boundaries without blocking the storefront.
 *
 * V33 painted near-opaque 100vh panels and copied every incoming h2 into a
 * second fixed title. Pausing halfway through a scroll left a fake page on top
 * of the actual one, including commercial controls and the video chapter.
 *
 * V34 keeps the same eight chapter motifs and native, reversible scroll sync,
 * but paints only a transparent, short-lived light pass. Actual section
 * headings, video, 3D, interactive controls and text remain in their own DOM.
 */
import '../styles/couture-transitions-v33.css';

export type TransitionMotif =
  'curtain'|'columns'|'prism'|'ribbon'|'iris'|'split'|'shutter'|'fold';

export const COUTURE_TRANSITIONS = [
  {selector:'#passarela',motif:'curtain',headline:'.runway__intro h2'},
  {selector:'#ocasioes',motif:'columns',headline:'#ocasioesTitle'},
  {selector:'#colecao',motif:'prism',headline:''},
  {selector:'#como-comprar',motif:'ribbon',headline:''},
  {selector:'#lojas',motif:'iris',headline:''},
  {selector:'#atendimento',motif:'split',headline:'#conciergeTitle'},
  {selector:'#duvidas',motif:'shutter',headline:'#faqTitle'},
  {selector:'.finale',motif:'fold',headline:'#finaleTitle'},
] as const;

type Scene = {section:HTMLElement;motif:TransitionMotif};
const clamp=(n:number)=>Math.min(1,Math.max(0,n));

/**
 * Only the boundary between .89 and .65 viewport heights has any decoration.
 * This is intentionally much shorter than V33's .98->.10 window. A paused
 * visitor never gets a full-height fabricated section over actual content.
 */
export function getBoundaryProgress(top:number,viewport:number):number {
  const height=Math.max(320,viewport);
  return clamp((height*.89-top)/(height*.24));
}

function createOverlay(){
  const overlay=document.createElement('div');
  overlay.id='belleCoutureWipe';
  overlay.className='ct33-wipe';
  overlay.dataset.active='false';
  overlay.setAttribute('aria-hidden','true');
  for(let i=0;i<3;i++){
    const blade=document.createElement('i');
    blade.className='ct33-panel';
    overlay.append(blade);
  }
  document.body.append(overlay);
  return overlay;
}

/** The existing initial intro may finish under a brief three-blade exit. */
function initPostIntro():()=>void{
  const root=document.documentElement;
  if(!root.classList.contains('intro-playing'))return ()=>{};
  const curtain=document.createElement('div');
  curtain.className='ct33-loader-exit';
  curtain.setAttribute('aria-hidden','true');
  for(let i=0;i<3;i++){
    const blade=document.createElement('i');
    blade.style.setProperty('--ct33-i',String(i));
    curtain.append(blade);
  }
  document.body.append(curtain);
  let timer=0,closed=false;
  const remove=()=>{
    if(closed)return;
    closed=true;
    observer.disconnect();
    clearTimeout(timer);
    curtain.remove();
  };
  const onFinish=()=>{
    if(!root.classList.contains('intro-done'))return;
    observer.disconnect();
    curtain.classList.add('ct33-loader-exit--opening');
    timer=window.setTimeout(remove,1150);
  };
  const observer=new MutationObserver(onFinish);
  observer.observe(root,{attributes:true,attributeFilter:['class']});
  onFinish();
  const failsafe=window.setTimeout(remove,4500);
  return ()=>{clearTimeout(failsafe);remove();};
}

export function initCoutureTransitions():()=>void{
  const root=document.documentElement;
  const reduced=matchMedia('(prefers-reduced-motion: reduce)');
  if(root.dataset.intensity==='essential'||reduced.matches)return ()=>{};
  if(!('requestAnimationFrame' in window)||root.classList.contains('ct33-motion'))
    return ()=>{};
  const scenes:Scene[]=COUTURE_TRANSITIONS.flatMap(def=>{
    const section=document.querySelector<HTMLElement>(def.selector);
    return section?[{section,motif:def.motif}]:[];
  });
  if(!scenes.length)return ()=>{};

  const overlay=createOverlay();
  const cleanupIntro=initPostIntro();
  let raf=0,disposed=false,active:Scene|null=null;
  const clear=()=>{
    if(overlay.dataset.active!=='false')overlay.dataset.active='false';
    active=null;
  };
  const update=()=>{
    raf=0;
    if(disposed||document.hidden||root.dataset.intensity==='essential'||reduced.matches){
      clear();return;
    }
    const viewport=Math.max(320,window.innerHeight);
    let candidate:Scene|null=null,progress=0;
    for(const scene of scenes){
      const top=scene.section.getBoundingClientRect().top;
      if(top>viewport*.89||top<viewport*.65)continue;
      const p=getBoundaryProgress(top,viewport);
      if(!candidate||Math.abs(p-.5)<Math.abs(progress-.5)){
        candidate=scene;progress=p;
      }
    }
    if(!candidate||progress<=.025||progress>=.975){clear();return;}
    if(active!==candidate){
      active=candidate;
      overlay.dataset.motif=candidate.motif;
    }
    // Decorative only: no opaque material, duplicate headings or layout clips.
    overlay.style.setProperty('--ct33-shift',(-58+116*progress).toFixed(2)+'vw');
    overlay.style.setProperty('--ct33-strength',(Math.sin(Math.PI*progress)*.58).toFixed(3));
    overlay.dataset.active='true';
  };
  const request=()=>{
    if(!disposed&&!raf&&!document.hidden)raf=requestAnimationFrame(update);
  };
  const restore=()=>{
    if(document.hidden)clear();
    else request();
  };
  const reducedChange=()=>{if(reduced.matches)clear();else request();};
  root.classList.add('ct33-motion');
  window.addEventListener('scroll',request,{passive:true});
  window.addEventListener('resize',request,{passive:true});
  window.addEventListener('pageshow',restore);
  window.addEventListener('hashchange',request);
  window.addEventListener('belle:localechange',request);
  document.addEventListener('visibilitychange',restore);
  reduced.addEventListener?.('change',reducedChange);
  request();
  return ()=>{
    disposed=true;
    if(raf)cancelAnimationFrame(raf);
    cleanupIntro();
    clear();
    overlay.remove();
    root.classList.remove('ct33-motion');
    window.removeEventListener('scroll',request);
    window.removeEventListener('resize',request);
    window.removeEventListener('pageshow',restore);
    window.removeEventListener('hashchange',request);
    window.removeEventListener('belle:localechange',request);
    document.removeEventListener('visibilitychange',restore);
    reduced.removeEventListener?.('change',reducedChange);
  };
}
