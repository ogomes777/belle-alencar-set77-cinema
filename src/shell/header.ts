/**
 * BELLE ALENCAR · SET77 LABS · Adaptive Glass Atelier V14
 *
 * The actual floating header follows the editorial chapter underneath it.
 * One passive scroll handler, one rAF; no GSAP, repeated timers or canvas.
 * The existing store/search/favorites/bag controls keep their original IDs,
 * event listeners, interactions, focus and persistent commerce state.
 */
type Atmosphere='pearl'|'sand'|'champagne'|'olive'|'wine'|'sky'|'noir';

type Scene = { id:string; element:HTMLElement; tint:Atmosphere; nav:string|null };

const FILM_TONES:Record<string,Atmosphere>={
  vitrine:'pearl',inicio:'pearl',porta:'sand',sala:'sand',arara:'sand',
  vestido:'champagne',detalhe:'wine',categorias:'pearl',provador:'champagne',
};
const OCCASION_TONES:Record<string,Atmosphere>={
  dia:'olive',noite:'wine',celebrar:'sky',
};

export function initHeader():void {
  const headerNode=document.getElementById('siteHeader');
  if(!headerNode)return;
  const header:HTMLElement=headerNode;

  const menuButton=header.querySelector<HTMLButtonElement>('#belleMenuButton');
  const panel=header.querySelector<HTMLElement>('#belleMenuPanel');
  const nav=header.querySelector<HTMLElement>('.site-nav');
  const navLinks=Array.from(header.querySelectorAll<HTMLAnchorElement>('.site-nav a'));
  const mobileLinks=Array.from(header.querySelectorAll<HTMLAnchorElement>('[data-mobile-nav]'));
  const mq=matchMedia('(max-width:1020px)');
  const scenes:Scene[]=([
    {id:'filme',element:document.getElementById('filme')!,tint:'pearl',nav:'#inicio'},
    {id:'passarela',element:document.getElementById('passarela')!,tint:'champagne',nav:'#passarela'},
    {id:'ocasioes',element:document.getElementById('ocasioes')!,tint:'sand',nav:'#ocasioes'},
    {id:'colecao',element:document.getElementById('colecao')!,tint:'pearl',nav:'#colecao'},
    {id:'como-comprar',element:document.getElementById('como-comprar')!,tint:'sand',nav:null},
    {id:'lojas',element:document.getElementById('lojas')!,tint:'noir',nav:'#lojas'},
    {id:'atendimento',element:document.getElementById('atendimento')!,tint:'sand',nav:'#atendimento'},
    {id:'duvidas',element:document.getElementById('duvidas')!,tint:'pearl',nav:null},
  ] as Scene[]).filter(scene=>!!scene.element);
  const finale=document.querySelector<HTMLElement>('.finale');
  if(finale)scenes.push({id:'finale',element:finale,tint:'noir',nav:null});

  const glider=document.createElement('span');
  glider.className='belle-nav-glider';
  glider.setAttribute('aria-hidden','true');
  nav?.prepend(glider);
  const glide=(link:HTMLAnchorElement)=>{
    nav?.style.setProperty('--ba-glide-x',link.offsetLeft+'px');
    nav?.style.setProperty('--ba-glide-width',link.offsetWidth+'px');
    nav?.classList.add('is-gliding');
  };
  nav?.addEventListener('mouseover',event=>{
    const link=(event.target as Element).closest<HTMLAnchorElement>('a[href^="#"]');
    if(link&&nav.contains(link))glide(link);
  });
  nav?.addEventListener('focusin',event=>{
    const link=(event.target as Element).closest<HTMLAnchorElement>('a[href^="#"]');
    if(link&&nav.contains(link))glide(link);
  });
  nav?.addEventListener('mouseleave',()=>nav.classList.remove('is-gliding'));
  nav?.addEventListener('focusout',event=>{
    if(!nav.contains(event.relatedTarget as Node|null))nav.classList.remove('is-gliding');
  });

  function toggleMenu(open:boolean,restoreFocus=false){
    if(!panel||!menuButton)return;
    const next=open&&mq.matches;
    if(next===!panel.hidden)return;
    panel.hidden=!next;
    menuButton.setAttribute('aria-expanded',String(next));
    menuButton.setAttribute('aria-label',next?'Fechar navegação':'Abrir navegação');
    header.classList.toggle('is-menu-open',next);
    if(!next&&restoreFocus)menuButton.focus({preventScroll:true});
  }
  menuButton?.addEventListener('click',()=>toggleMenu(panel?.hasAttribute('hidden')??true));
  mobileLinks.forEach(link=>link.addEventListener('click',()=>toggleMenu(false)));
  document.addEventListener('pointerdown',event=>{
    if(!header.contains(event.target as Node))toggleMenu(false);
    else if(panel&&!panel.hidden){
      const target=event.target as Element;
      if(target.closest('#storeButton,#searchButton,#wishlistButton,#bagButton'))
        toggleMenu(false);
    }
  },{passive:true});
  document.addEventListener('keydown',event=>{
    if(event.key!=='Escape'||!panel||panel.hidden)return;
    event.preventDefault();
    toggleMenu(false,true);
  });
  const onBreakpoint=()=>{if(!mq.matches)toggleMenu(false);schedule();};
  mq.addEventListener('change',onBreakpoint);

  let lastTone='';
  let lastNav='';
  let lastProgress='';
  let raf=0;
  let maxScroll=1;
  const measure=()=>{maxScroll=Math.max(1,document.documentElement.scrollHeight-innerHeight);};

  function getScene():Scene|null{
    if(!scenes.length)return null;
    const probe=Math.min(Math.max(innerHeight*.42,155),410);
    return scenes.find(({element})=>{
      const r=element.getBoundingClientRect();
      return r.top<=probe&&r.bottom>probe;
    })??scenes.find(({element})=>element.getBoundingClientRect().bottom>probe)
      ??scenes[scenes.length-1]!;
  }
  function getTone(scene:Scene|null):Atmosphere{
    if(!scene)return 'pearl';
    if(scene.id==='filme'){
      const chapter=document.documentElement.dataset.filmChapter||'vitrine';
      return FILM_TONES[chapter]??'pearl';
    }
    if(scene.id==='ocasioes'){
      const occasion=document.querySelector<HTMLElement>('#ocasioes .occ-round__stage')?.dataset.occasion||'';
      return OCCASION_TONES[occasion]??'sand';
    }
    return scene.tint;
  }
  function update(){
    raf=0;
    header.classList.toggle('is-compact',scrollY>24);

    const scene=getScene();
    const tone=getTone(scene);
    if(tone!==lastTone){
      header.dataset.atmosphere=tone;
      lastTone=tone;
    }
    const active=scene?.nav??'';
    if(active!==lastNav){
      lastNav=active;
      for(const link of [...navLinks,...mobileLinks]){
        if(active&&link.hash===active)link.setAttribute('aria-current','location');
        else link.removeAttribute('aria-current');
      }
    }
    const progress=Math.max(0,Math.min(1,scrollY/maxScroll)).toFixed(4);
    if(progress!==lastProgress){
      header.style.setProperty('--ba-nav-progress',progress);
      lastProgress=progress;
    }
  }
  function schedule(){
    if(!raf)raf=requestAnimationFrame(update);
  }
  addEventListener('scroll',schedule,{passive:true});
  addEventListener('resize',()=>{measure();schedule();},{passive:true});
  addEventListener('pageshow',()=>{measure();schedule();});
  addEventListener('load',()=>{measure();schedule();},{once:true});
  addEventListener('hashchange',schedule);
  document.addEventListener('visibilitychange',()=>{if(!document.hidden)schedule();});

  const occasionStage=document.querySelector<HTMLElement>('#ocasioes .occ-round__stage');
  if(occasionStage){
    new MutationObserver(schedule).observe(occasionStage,{
      attributes:true,attributeFilter:['data-occasion','data-active-index'],
    });
  }
  // A film chapter can change without a scroll event (navigation or restore).
  const filmChapter=document.documentElement;
  new MutationObserver(schedule).observe(filmChapter,{
    attributes:true,attributeFilter:['data-film-chapter'],
  });
  measure();
  update();
}
