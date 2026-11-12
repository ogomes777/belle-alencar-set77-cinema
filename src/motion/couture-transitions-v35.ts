/**
 * BELLE ALENCAR / SET77 LABS · V35 / 22 couture micro-intros
 *
 * Twenty-two distinct surface languages across EIGHT real section boundaries.
 * No new page, artificial spacer, scroll lock, replicated title, duplicated 3D
 * scene or mouse interceptor. The surface is decorative; actual headings
 * reveal by their own masks, and every value tracks native scroll both ways.
 */
import '../styles/couture-transitions-v35.css';

export const MICRO_MOTIFS = [
  'cortina','colunas','digitacao','sobreposicao','rasgo','pixels',
  'varredura','circulo','pilha','moldura','canto','fatias',
  'dobra','cubo','carrossel','tinta','queima','reticula',
  'espiral','veludo','canal','particulas',
] as const;
export type MicroMotif = typeof MICRO_MOTIFS[number];

export type CoutureScene = {
  selector:string;
  motifs:readonly MicroMotif[];
  copy?:string;
  copyStyle?:'curtain'|'type'|'iris'|'fold'|'sweep';
};
export const COUTURE_SCENES:readonly CoutureScene[] = [
  {selector:'#passarela',   motifs:['cortina','fatias','carrossel'],  copy:'.runway__intro h2',copyStyle:'curtain'},
  {selector:'#ocasioes',    motifs:['colunas','pilha','cubo'],         copy:'#ocasioesTitle',copyStyle:'iris'},
  {selector:'#colecao',     motifs:['rasgo','pixels','varredura'],    copy:'.section-head .eyebrow',copyStyle:'sweep'},
  {selector:'#como-comprar',motifs:['digitacao','sobreposicao','tinta'],copy:'.how__intro .eyebrow',copyStyle:'type'},
  {selector:'#lojas',      motifs:['circulo','moldura','canto'],      copy:'.section-head .eyebrow',copyStyle:'iris'},
  {selector:'#atendimento',motifs:['veludo','canal','particulas'],    copy:'#conciergeTitle',copyStyle:'curtain'},
  {selector:'#duvidas',    motifs:['dobra','reticula'],              copy:'#faqTitle',copyStyle:'fold'},
  {selector:'.finale',     motifs:['espiral','queima'],              copy:'#finaleTitle',copyStyle:'sweep'},
];

const clamp=(n:number)=>Math.max(0,Math.min(1,n));
const ease=(p:number)=>p*p*(3-2*p);

/** 0 at 96vh, 1 by 38vh. No artificial page height or pinning. */
export function boundaryProgress(top:number,viewport:number):number{
  const h=Math.max(320,viewport);
  return clamp((h*.96-top)/(h*.58));
}
export function resolveMotif(motifs:readonly MicroMotif[],p:number){
  const t=clamp(p);
  const index=Math.min(motifs.length-1,Math.floor(t*motifs.length));
  const local=clamp(t*motifs.length-index);
  return {motif:motifs[index]!,index,local};
}
type MountedScene={node:HTMLElement;motifs:readonly MicroMotif[];copy:HTMLElement|null};
const copySelectors = ['a','button','input','select','textarea','summary'];

function createSurface(){
  const stage=document.createElement('div');
  stage.id='belleMicroStage';
  stage.className='bm35-stage';
  stage.dataset.active='false';
  stage.setAttribute('aria-hidden','true');
  const slices=document.createElement('div');
  slices.className='bm35-slices';
  for(let i=0;i<16;i++){
    const piece=document.createElement('i');
    piece.className='bm35-piece';
    piece.style.setProperty('--bm-i',String(i));
    piece.style.setProperty('--bm-column',String(i%4));
    piece.style.setProperty('--bm-row',String(Math.floor(i/4)));
    slices.append(piece);
  }
  const frame=document.createElement('i');frame.className='bm35-frame';
  const ray=document.createElement('i');ray.className='bm35-ray';
  stage.append(slices,frame,ray);
  document.body.append(stage);
  return stage;
}

export function initCoutureV35():()=>void {
  const root=document.documentElement;
  if(root.classList.contains('bm35-mounted')||!('requestAnimationFrame' in window))return ()=>{};
  const reduced=matchMedia('(prefers-reduced-motion: reduce)');
  const mounted:MountedScene[]=COUTURE_SCENES.flatMap(scene=>{
    const node=document.querySelector<HTMLElement>(scene.selector);
    if(!node)return [];
    const candidate=scene.copy?node.querySelector<HTMLElement>(scene.copy):null;
    // Never put motion transforms on links, product tiles, native FAQ controls,
    // video/GSAP/WebGL stages or commerce lists.
    const copy=candidate && !copySelectors.some(s=>candidate.matches(s))?candidate:null;
    if(copy){
      copy.classList.add('bm35-copy');
      copy.dataset.bm35Style=scene.copyStyle||'sweep';
      copy.style.setProperty('--bm35-cut','0%');
    }
    return [{node,motifs:scene.motifs,copy}];
  });
  if(!mounted.length)return ()=>{};

  const stage=createSurface();
  root.classList.add('bm35-mounted');
  let disposed=false,frame=0,current:MountedScene|null=null,lastMotif:MicroMotif|null=null;
  const clear=()=>{
    stage.dataset.active='false';
    current=null;
    lastMotif=null;
  };
  const eligible=()=>!document.hidden&&!reduced.matches&&root.dataset.intensity!=='essential';
  const update=()=>{
    frame=0;
    if(disposed)return;
    if(!eligible()){
      clear();
      for(const scene of mounted)scene.copy?.style.setProperty('--bm35-cut','0%');
      return;
    }
    const height=Math.max(320,window.innerHeight);
    let candidate:MountedScene|null=null,progress=0;
    for(const scene of mounted){
      const top=scene.node.getBoundingClientRect().top;
      const p=boundaryProgress(top,height);
      // Only the scene touching the viewport entrance is allowed to paint.
      if(top<=height*.96&&top>=height*.38 && p>.008&&p<.992){
        if(!candidate||Math.abs(p-.5)<Math.abs(progress-.5)){
          candidate=scene;progress=p;
        }
      }
      if(scene.copy){
        const rect=scene.copy.getBoundingClientRect();
        const focused=scene.copy.contains(document.activeElement);
        const reveal=focused?1:clamp((height*.91-rect.top)/(height*.31));
        const cut=((1-ease(reveal))*100).toFixed(2)+'%';
        if(scene.copy.style.getPropertyValue('--bm35-cut')!==cut)
          scene.copy.style.setProperty('--bm35-cut',cut);
      }
    }
    if(!candidate){clear();return;}
    const {motif,local}=resolveMotif(candidate.motifs,progress);
    if(candidate!==current||motif!==lastMotif){
      current=candidate;lastMotif=motif;stage.dataset.motif=motif;
    }
    // Each motif fades in and out within its own scroll-controlled beat.
    // The material is translucent, with no fully opaque 100vh curtain.
    const heartbeat=Math.pow(Math.sin(Math.PI*local),.65);
    stage.style.setProperty('--bm-p',local.toFixed(4));
    stage.style.setProperty('--bm-e',ease(local).toFixed(4));
    stage.style.setProperty('--bm-presence',(heartbeat*.86).toFixed(4));
    stage.style.setProperty('--bm-travel',(-105+210*local).toFixed(2)+'vw');
    stage.style.setProperty('--bm-rise',(-75+150*local).toFixed(2)+'vh');
    stage.style.setProperty('--bm-turn',(-82+164*local).toFixed(2)+'deg');
    stage.style.setProperty('--bm-radius',(local*135).toFixed(1)+'%');
    stage.style.setProperty('--bm-fill',(local*100).toFixed(2)+'%');
    stage.style.setProperty('--bm-cut',((1-local)*100).toFixed(2)+'%');
    stage.style.setProperty('--bm-fade',(1-Math.abs(local*2-1)).toFixed(4));
    stage.dataset.active='true';
  };
  const request=()=>{
    if(!disposed&&!frame)frame=requestAnimationFrame(update);
  };
  const restore=()=>{if(document.hidden)clear();else request();};
  const onReduced=()=>{if(reduced.matches)clear();request();};
  // The motion tier can be changed without scrolling. Watch the real setting.
  const attr=new MutationObserver(request);
  attr.observe(root,{attributes:true,attributeFilter:['data-intensity']});
  window.addEventListener('scroll',request,{passive:true});
  window.addEventListener('resize',request,{passive:true});
  window.addEventListener('pageshow',request);
  window.addEventListener('hashchange',request);
  window.addEventListener('belle:localechange',request);
  document.addEventListener('visibilitychange',restore);
  reduced.addEventListener?.('change',onReduced);
  request();
  return ()=>{
    disposed=true;
    if(frame)cancelAnimationFrame(frame);
    attr.disconnect();clear();stage.remove();
    window.removeEventListener('scroll',request);
    window.removeEventListener('resize',request);
    window.removeEventListener('pageshow',request);
    window.removeEventListener('hashchange',request);
    window.removeEventListener('belle:localechange',request);
    document.removeEventListener('visibilitychange',restore);
    reduced.removeEventListener?.('change',onReduced);
    for(const scene of mounted){
      scene.copy?.classList.remove('bm35-copy');
      scene.copy?.removeAttribute('data-bm35-style');
      scene.copy?.style.removeProperty('--bm35-cut');
    }
    root.classList.remove('bm35-mounted');
  };
}
