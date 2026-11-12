/**
 * SET77 LABS · Belle V32 / Cinematic Micro-intros
 *
 * This augments (never replaces) the V8 motion director. Native scroll, CSS
 * compositing and only a tiny, culled rAF pass per visible section.
 *
 * HARD RULES:
 *  - no pinning, wheel prevention, ScrollTrigger replacement or scroll lock
 *  - no parent transforms on three/WebGL canvases, product cards or video
 *  - no semantic changes to live commerce markup (internationalization stays live)
 *  - no opacity:0 traps. Fail open on tab switch, BFCache and reduced motion.
 *  - reverse motion on upward scroll; no missed intersection one-shot.
 */
import '../styles/cinematic-v32.css';

export type CoutureMotif =
  | 'silk-curtain' | 'columns' | 'prism' | 'ribbon'
  | 'iris' | 'split' | 'shutter' | 'fold';

export type CoutureScene = {
  selector: string;
  motif: CoutureMotif;
  title?: string;
  // Existing engines have authority over their content and headings.
  editorialTitle: boolean;
};

export const BELLE_V32_SCENES: readonly CoutureScene[] = [
  {selector:'#passarela',motif:'silk-curtain',title:'.runway__intro h2',editorialTitle:true},
  {selector:'#ocasioes',motif:'columns',title:'#ocasioesTitle',editorialTitle:true},
  {selector:'#colecao',motif:'prism',title:'#colecaoTitle',editorialTitle:false},
  {selector:'#como-comprar',motif:'ribbon',title:'#howTitle',editorialTitle:false},
  {selector:'#lojas',motif:'iris',title:'#lojasTitle',editorialTitle:false},
  {selector:'#atendimento',motif:'split',title:'#conciergeTitle',editorialTitle:true},
  {selector:'#duvidas',motif:'shutter',title:'#faqTitle',editorialTitle:true},
  {selector:'.finale',motif:'fold',title:'#finaleTitle',editorialTitle:true},
] as const;

type Entry = {
  section:HTMLElement;
  heading:HTMLElement|null;
  titleEnabled:boolean;
  progress:number;
  titleProgress:number;
};

const clamp=(v:number)=>Math.min(1,Math.max(0,v));
const media = (query:string)=>window.matchMedia(query).matches;
const visible=(r:DOMRect,vh:number)=>r.bottom> -vh*.3&&r.top<vh*1.35;

function newPortals(section:HTMLElement,motif:CoutureMotif){
  section.dataset.md32Scene=motif;
  section.classList.add('md32-scene');
  // Decorative layers do not change document geometry or pointer hit testing.
  const portal=document.createElement('div');
  portal.className='md32-portal md32-'+motif;
  portal.setAttribute('aria-hidden','true');
  for(let i=0;i<3;i++){
    const blade=document.createElement('i');
    blade.className='md32-blade';
    blade.style.setProperty('--md32-blade',String(i));
    portal.append(blade);
  }
  const seam=document.createElement('i');
  seam.className='md32-seam';
  portal.append(seam);
  // Use prepend without changing the original content order or spacing.
  section.prepend(portal);
  return portal;
}

function startPostLoader():()=>void{
  const root=document.documentElement;
  if(!root.classList.contains('intro-playing'))return ()=>{};
  const stage=document.querySelector<HTMLElement>('#filme .film__stage');
  if(!stage)return ()=>{};

  const exit=document.createElement('div');
  exit.className='md32-postloader';
  exit.setAttribute('aria-hidden','true');
  for(let i=0;i<3;i++){
    const blade=document.createElement('i');
    blade.style.setProperty('--md32-blade',String(i));
    exit.append(blade);
  }
  stage.append(exit);
  let timeout=0;
  const onClass=()=>{
    if(!root.classList.contains('intro-done'))return;
    observer.disconnect();
    exit.classList.add('md32-postloader--exit');
    timeout=window.setTimeout(()=>exit.remove(),1250);
  };
  const observer=new MutationObserver(onClass);
  observer.observe(root,{attributes:true,attributeFilter:['class']});
  onClass();
  // It is a purely decorative transition. Never obstruct delayed boot.
  const failSafe=window.setTimeout(()=>{
    observer.disconnect();
    exit.remove();
  },4100);
  return ()=>{
    observer.disconnect();
    window.clearTimeout(timeout);
    window.clearTimeout(failSafe);
    exit.remove();
  };
}

export function initCinematicV32():()=>void {
  const root=document.documentElement;
  if(media('(prefers-reduced-motion: reduce)')||root.dataset.intensity==='essential'||!('requestAnimationFrame' in window)){
    return ()=>{};
  }
  if(root.classList.contains('md32-active'))return ()=>{};
  const entries:Entry[]=[];
  for(const scene of BELLE_V32_SCENES){
    const section=document.querySelector<HTMLElement>(scene.selector);
    if(!section)continue;
    newPortals(section,scene.motif);
    const heading=scene.title?section.querySelector<HTMLElement>(scene.title):null;
    const titleEnabled=!!heading && scene.editorialTitle;
    if(heading){
      heading.classList.add('md32-heading');
      if(titleEnabled)heading.classList.add('md32-heading--scrub');
    }
    entries.push({section,heading,titleEnabled,progress:-1,titleProgress:-1});
  }
  if(!entries.length)return ()=>{};

  const teardownPostLoader=startPostLoader();
  let raf=0,dead=false;
  const preferReduced=window.matchMedia('(prefers-reduced-motion: reduce)');
  const onReduced=()=>{
    if(preferReduced.matches){
      root.classList.remove('md32-active');
      entries.forEach(e=>{
        e.section.style.removeProperty('--md32-progress');
        e.heading?.style.removeProperty('--md32-title-progress');
      });
    }else{
      root.classList.add('md32-active');
      request();
    }
  };

  function update(){
    raf=0;
    if(dead||root.dataset.intensity==='essential'||preferReduced.matches)return;
    const vh=Math.max(400,window.innerHeight);
    for(const entry of entries){
      const rect=entry.section.getBoundingClientRect();
      if(!visible(rect,vh))continue;
      // A reversible movement driven by the *incoming* section's proximity.
      // At .90vh top edge it starts; by .38vh all content is unobscured.
      const p=clamp((vh*.90-rect.top)/(vh*.52));
      if(Math.abs(p-entry.progress)>.009){
        entry.section.style.setProperty('--md32-progress',p.toFixed(3));
        entry.progress=p;
      }
      if(!entry.titleEnabled||!entry.heading)continue;
      const tr=entry.heading.getBoundingClientRect();
      // Editorial copy becomes readable EARLY; never depend on leaving
      // the viewport to complete a reveal.
      const hp=clamp((vh*.94-tr.top)/(vh*.32));
      if(Math.abs(hp-entry.titleProgress)>.012){
        entry.heading.style.setProperty('--md32-title-progress',hp.toFixed(3));
        entry.titleProgress=hp;
      }
    }
  }
  function request(){
    if(dead||raf||document.hidden)return;
    raf=window.requestAnimationFrame(update);
  }
  const onShow=()=>{
    if(!document.hidden){
      entries.forEach(e=>{e.progress=-1;e.titleProgress=-1;});
      request();
    }
  };
  const onPageShow=()=>onShow();
  root.classList.add('md32-active');
  window.addEventListener('scroll',request,{passive:true});
  window.addEventListener('resize',request,{passive:true});
  window.addEventListener('hashchange',request,{passive:true});
  window.addEventListener('pageshow',onPageShow);
  document.addEventListener('visibilitychange',onShow);
  if('addEventListener' in preferReduced)preferReduced.addEventListener('change',onReduced);
  request();

  return ()=>{
    dead=true;
    if(raf)window.cancelAnimationFrame(raf);
    teardownPostLoader();
    window.removeEventListener('scroll',request);
    window.removeEventListener('resize',request);
    window.removeEventListener('hashchange',request);
    window.removeEventListener('pageshow',onPageShow);
    document.removeEventListener('visibilitychange',onShow);
    preferReduced.removeEventListener?.('change',onReduced);
    root.classList.remove('md32-active');
    for(const e of entries){
      e.section.classList.remove('md32-scene');
      delete e.section.dataset.md32Scene;
      e.section.style.removeProperty('--md32-progress');
      e.heading?.classList.remove('md32-heading','md32-heading--scrub');
      e.heading?.style.removeProperty('--md32-title-progress');
      e.section.querySelector('.md32-portal')?.remove();
    }
  };
}
