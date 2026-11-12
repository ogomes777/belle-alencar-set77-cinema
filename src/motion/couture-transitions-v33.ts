/**
 * Belle Alencar V33 · Couture Fullscreen Transitions.
 * Fixes the V32 section-top bands, using one fixed full-viewport overlay.
 * No added document height, scroll pinning, pointer interception, WebGL changes,
 * card remounts, or changes to commerce. Native scroll controls every frame.
 */
import '../styles/couture-transitions-v33.css';
export type TransitionMotif = 'curtain'|'columns'|'prism'|'ribbon'|'iris'|'split'|'shutter'|'fold';

export const COUTURE_TRANSITIONS = [
  {selector:'#passarela',motif:'curtain',headline:'.runway__intro h2'},
  {selector:'#ocasioes',motif:'columns',headline:'#ocasioesTitle'},
  {selector:'#colecao',motif:'prism',headline:''}, // Own scroll reveal.
  {selector:'#como-comprar',motif:'ribbon',headline:''}, // Video owns copy.
  {selector:'#lojas',motif:'iris',headline:''}, // Globe/scroll own copy.
  {selector:'#atendimento',motif:'split',headline:'#conciergeTitle'},
  {selector:'#duvidas',motif:'shutter',headline:'#faqTitle'},
  {selector:'.finale',motif:'fold',headline:'#finaleTitle'},
] as const;

type Scene={section:HTMLElement;motif:TransitionMotif;headline:HTMLElement|null;lastTitle:number};
const clamp=(v:number)=>Math.max(0,Math.min(1,v));
const pct=(v:number)=>Math.round(clamp(v)*10000)/100;
function vertical(p:number,up=true):string{
  const fill=p<=.5?2*p:2*(1-p),n=pct(1-fill);
  if(up)return p<=.5?'inset('+n+'% 0 0 0)':'inset(0 0 '+n+'% 0)';
  return p<=.5?'inset(0 0 '+n+'% 0)':'inset('+n+'% 0 0 0)';
}
function horizontal(p:number,fromRight=false):string{
  const fill=p<=.5?2*p:2*(1-p),n=pct(1-fill);
  if(!fromRight)return p<=.5?'inset(0 '+n+'% 0 0)':'inset(0 0 0 '+n+'%)';
  return p<=.5?'inset(0 0 0 '+n+'%)':'inset(0 '+n+'% 0 0)';
}
function setMask(el:HTMLElement,mask:string){if(el.style.clipPath!==mask)el.style.clipPath=mask;}
function masks(panels:HTMLElement[],motif:TransitionMotif,p:number){
  const [a,b,c]=[panels[0]!,panels[1]!,panels[2]!];
  if(motif==='curtain'){setMask(a,vertical(p));return;}
  if(motif==='iris'){
    const r=p<=.5?p*320:(1-p)*320;
    setMask(a,'circle('+r.toFixed(1)+'% at 50% 50%)');return;
  }
  if(motif==='prism'){setMask(a,horizontal(p));return;}
  if(motif==='ribbon'){
    setMask(a,vertical(clamp(p*1.08)));
    setMask(b,vertical(clamp((p-.045)*1.10),false));
    setMask(c,vertical(clamp((p-.09)*1.12)));return;
  }
  if(motif==='split'){
    setMask(a,horizontal(p));
    setMask(b,horizontal(clamp((p-.045)*1.06),true));
    setMask(c,horizontal(clamp((p-.07)*1.08)));return;
  }
  const delays=motif==='columns'?[0,.042,.084]:motif==='fold'?[.07,0,.045]:[.025,.072,0];
  for(let i=0;i<3;i++){
    const delay=delays[i]??0;
    const shifted=clamp((p-delay)/(1-delay));
    const reverse=motif==='shutter'?i===1:motif==='fold'?i===2:false;
    setMask(panels[i]!,vertical(shifted,!reverse));
  }
}
function createOverlay(){
  const overlay=document.createElement('div');
  overlay.id='belleCoutureWipe';overlay.className='ct33-wipe';
  overlay.setAttribute('aria-hidden','true');overlay.dataset.active='false';
  const panels=Array.from({length:3},(_,i)=>{
    const panel=document.createElement('i');panel.className='ct33-panel';
    panel.style.setProperty('--ct33-i',String(i));overlay.append(panel);return panel;
  });
  const inscription=document.createElement('div');
  inscription.className='ct33-inscription';
  const monogram=document.createElement('span');monogram.className='ct33-monogram';monogram.textContent='BA';
  const title=document.createElement('span');title.className='ct33-name';
  inscription.append(monogram,title);overlay.append(inscription);
  const seam=document.createElement('span');seam.className='ct33-seam';overlay.append(seam);
  document.body.append(overlay);return {overlay,panels,title,inscription};
}
function initPostIntro():()=>void{
  const root=document.documentElement;
  if(!root.classList.contains('intro-playing'))return ()=>{};
  const curtain=document.createElement('div');
  curtain.className='ct33-loader-exit';curtain.setAttribute('aria-hidden','true');
  for(let i=0;i<3;i++){
    const blade=document.createElement('i');
    blade.style.setProperty('--ct33-i',String(i));curtain.append(blade);
  }
  document.body.append(curtain);
  let timer=0,closed=false;
  const remove=()=>{
    if(closed)return;closed=true;observer.disconnect();clearTimeout(timer);curtain.remove();
  };
  const onFinish=()=>{
    if(!root.classList.contains('intro-done'))return;
    observer.disconnect();curtain.classList.add('ct33-loader-exit--opening');
    timer=window.setTimeout(remove,1150);
  };
  const observer=new MutationObserver(onFinish);
  observer.observe(root,{attributes:true,attributeFilter:['class']});
  onFinish();
  const failsafe=window.setTimeout(remove,4500);
  return ()=>{clearTimeout(failsafe);remove();};
}
export function initCoutureTransitions():()=>void{
  const root=document.documentElement,reduced=matchMedia('(prefers-reduced-motion: reduce)');
  if(root.dataset.intensity==='essential'||reduced.matches)return ()=>{};
  if(!('requestAnimationFrame' in window)||root.classList.contains('ct33-motion'))return ()=>{};
  const scenes:Scene[]=COUTURE_TRANSITIONS.flatMap(def=>{
    const section=document.querySelector<HTMLElement>(def.selector);
    if(!section)return [];
    const headline=def.headline?section.querySelector<HTMLElement>(def.headline):null;
    headline?.classList.add('ct33-editorial');
    return [{section,motif:def.motif,headline,lastTitle:-1}];
  });
  if(!scenes.length)return ()=>{};
  const {overlay,panels,title,inscription}=createOverlay();
  const cleanupIntro=initPostIntro();
  let raf=0,dead=false,active:Scene|null=null;
  const clear=()=>{overlay.dataset.active='false';active=null;};
  const update=()=>{
    raf=0;
    if(dead||document.hidden||root.dataset.intensity==='essential'||reduced.matches){clear();return;}
    const vh=Math.max(320,innerHeight);
    let current:Scene|null=null,progress=0;
    for(const scene of scenes){
      const rect=scene.section.getBoundingClientRect();
      if(rect.top<=vh*.98&&rect.top>=vh*.10){
        const p=clamp((vh*.98-rect.top)/(vh*.88));
        if(!current||Math.abs(p-.5)<Math.abs(progress-.5)){current=scene;progress=p;}
      }
      if(scene.headline){
        const hr=scene.headline.getBoundingClientRect();
        if(hr.top<vh*1.06&&hr.bottom> -vh*.1){
          const p=clamp((vh*.92-hr.top)/(vh*.28));
          if(Math.abs(p-scene.lastTitle)>.008){
            scene.headline.style.setProperty('--ct33-title',p.toFixed(3));
            scene.lastTitle=p;
          }
        }
      }
    }
    if(!current||progress<=.012||progress>=.989){clear();return;}
    if(active!==current){
      active=current;overlay.dataset.motif=current.motif;
      title.textContent=current.section.querySelector('h2')?.textContent?.replace(/\s+/g,' ').trim()||'Belle Alencar';
    }
    overlay.dataset.active='true';
    overlay.style.setProperty('--ct33-progress',progress.toFixed(4));
    masks(panels,current.motif,progress);
    inscription.style.opacity=(clamp(4*progress*(1-progress))*.86).toFixed(3);
  };
  const request=()=>{if(!dead&&!raf&&!document.hidden)raf=requestAnimationFrame(update);};
  const restore=()=>{if(document.hidden)clear();else {scenes.forEach(s=>{s.lastTitle=-1;});request();}};
  const reducedChange=()=>{
    if(reduced.matches){clear();root.classList.remove('ct33-motion');}
    else {root.classList.add('ct33-motion');request();}
  };
  root.classList.add('ct33-motion');
  window.addEventListener('scroll',request,{passive:true});
  window.addEventListener('resize',request,{passive:true});
  window.addEventListener('pageshow',restore);
  window.addEventListener('hashchange',request,{passive:true});
  window.addEventListener('belle:localechange',request);
  document.addEventListener('visibilitychange',restore);
  reduced.addEventListener?.('change',reducedChange);
  request();
  return ()=>{
    dead=true;if(raf)cancelAnimationFrame(raf);
    cleanupIntro();clear();overlay.remove();root.classList.remove('ct33-motion');
    window.removeEventListener('scroll',request);
    window.removeEventListener('resize',request);
    window.removeEventListener('pageshow',restore);
    window.removeEventListener('hashchange',request);
    window.removeEventListener('belle:localechange',request);
    document.removeEventListener('visibilitychange',restore);
    reduced.removeEventListener?.('change',reducedChange);
    scenes.forEach(({headline})=>{headline?.classList.remove('ct33-editorial');headline?.style.removeProperty('--ct33-title');});
  };
}
