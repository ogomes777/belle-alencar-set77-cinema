/**
 * BELLE ALENCAR · SET77 LABS
 * Round occasion carousel (Originkit reference interpreted for the real
 * three commercial cards, not a React component or an extra WebGL canvas).
 *
 * Compositor-only CSS 3D, GSAP tween/snap, GSAP ScrollTrigger for
 * viewport-bound entrance / ambient depth, pointer drag with momentum.
 * No ticker in idle/offscreen. Vertical mobile scroll is ALWAYS native.
 * Every original href and data-filter-occasion remains intact.
 */
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import type { Director } from '../shell/director';
import '../styles/occasions-carousel.css';

gsap.registerPlugin(ScrollTrigger);

const wrap=(n:number,length:number)=>((n%length)+length)%length;
const clamp=(v:number,min:number,max:number)=>Math.max(min,Math.min(max,v));

interface PointerState {
  id:number;
  x:number;
  y:number;
  start:number;
  lastX:number;
  lastAt:number;
  velocity:number;
  moved:boolean;
}

export function initOccasionsCarousel(director:Director):()=>void {
  const section=document.querySelector<HTMLElement>('#ocasioes');
  const shell=section?.querySelector<HTMLElement>('[data-occ-round]');
  const stage=shell?.querySelector<HTMLElement>('.occ-round__stage');
  const aura=shell?.querySelector<HTMLElement>('.occ-round__aura');
  const cards=Array.from(shell?.querySelectorAll<HTMLElement>('.occ-card')??[]);
  const counter=shell?.querySelector<HTMLElement>('[data-occ-counter]');
  if(!section||!shell||!stage||!aura||!counter||cards.length!==3)return ()=>{};

  const labels=cards.map(card=>card.querySelector('h3')?.textContent?.trim()??'Ocasião');
  const links=cards.map(card=>card.querySelector<HTMLAnchorElement>('[data-filter-occasion]'));
  const media=matchMedia('(prefers-reduced-motion: reduce)');
  const desktop=matchMedia('(min-width: 900px)');
  let disposed=false, enabled=false, onscreen=false, hovered=false, focused=false;
  let lastIndex=-1, timer=0, pauseUntil=0, stageWidth=1, pointer:PointerState|null=null;
  let blockClickUntil=0;
  const state={position:0};
  let io:IntersectionObserver|null=null;
  let trigger:ScrollTrigger|null=null;
  let local:AbortController|null=null;
  let ro:ResizeObserver|null=null;
  const tone=['dia','noite','celebrar'] as const;

  function activeIndex():number{return wrap(Math.round(state.position),cards.length);}

  function updateActive(){
    const current=activeIndex();
    if(current===lastIndex)return;
    if(lastIndex>=0&&cards[lastIndex]?.contains(document.activeElement))
      stage!.focus({preventScroll:true});
    lastIndex=current;
    cards.forEach((card,index)=>{
      const selected=index===current;
      card.classList.toggle('is-active',selected);
      card.dataset.roundActive=String(selected);
      const link=links[index];
      if(link){
        link.tabIndex=selected?0:-1;
        if(selected)link.removeAttribute('aria-hidden');
        else link.setAttribute('aria-hidden','true');
      }
    });
    stage!.dataset.occasion=tone[current]!;
    stage!.dataset.activeIndex=String(current);
  }

  function render(){
    if(!enabled)return;
    const isMobile=!desktop.matches;
    const reach=isMobile?Math.max(174,Math.min(stageWidth*.52,340)):Math.min(stageWidth*.32,440);
    const depth=isMobile?130:245;
    const pivot=isMobile?25:36;
    cards.forEach((card,index)=>{
      const angle=(index-state.position)*Math.PI*2/cards.length;
      const cosine=Math.cos(angle);
      const sine=Math.sin(angle);
      // Three real cards distributed on a circular arc. Side cards face
      // forward just enough for their photography to remain identifiable.
      const focus=(cosine+1)/2;
      const x=sine*reach;
      const z=(cosine-1)*depth;
      gsap.set(card,{
        xPercent:-50,yPercent:-50,
        x,y:Math.abs(sine)*(isMobile?9:15),
        z,rotationY:-sine*pivot,
        scale:isMobile?.78+.22*focus:.79+.21*focus,
        opacity:.64+.36*focus,
        force3D:true
      });
      card.style.zIndex=String(Math.round((cosine+1)*50));
      card.style.setProperty('--occ-face',focus.toFixed(3));
    });
    updateActive();
  }

  function announce(){
    const current=activeIndex();
    counter!.textContent=`${String(current+1).padStart(2,'0')} / 03`;
    counter!.setAttribute('aria-label',`Ocasião ${current+1} de 3: ${labels[current]}`);
  }

  function stopAuto(){window.clearTimeout(timer);timer=0;}
  function schedule(){
    stopAuto();
    if(!enabled||!onscreen||hovered||focused||pointer||!desktop.matches||document.hidden)return;
    // A person browsing luxury goods needs a generous reading window.
    const wait=Math.max(7900,pauseUntil-performance.now());
    timer=window.setTimeout(()=>navigate(1,false),wait);
  }
  function markInteraction(){pauseUntil=performance.now()+13500;stopAuto();}

  function settle(next:number,byUser:boolean){
    if(!enabled)return;
    if(byUser)markInteraction();
    gsap.killTweensOf(state);
    gsap.to(state,{
      position:next,
      duration:byUser?.72:1.18,
      ease:byUser?'power3.out':'power2.inOut',
      overwrite:true,
      onUpdate:render,
      onComplete:()=>{render();announce();schedule();}
    });
  }
  function navigate(delta:number,byUser:boolean){
    settle(Math.round(state.position)+delta,byUser);
  }

  function goToCard(index:number){
    const now=activeIndex();
    let distance=index-now;
    if(distance>1)distance-=3;
    if(distance< -1)distance+=3;
    if(distance!==0)navigate(distance,true);
  }

  function down(e:PointerEvent){
    if(!enabled||e.button!==0||pointer)return;
    if((e.target as HTMLElement).closest('button, a')?.closest('.is-active'))return;
    pointer={
      id:e.pointerId,x:e.clientX,y:e.clientY,start:state.position,
      lastX:e.clientX,lastAt:performance.now(),velocity:0,moved:false
    };
    stopAuto();
  }
  function move(e:PointerEvent){
    const p=pointer;
    if(!p||p.id!==e.pointerId)return;
    const dx=e.clientX-p.x,dy=e.clientY-p.y;
    if(!p.moved){
      if(Math.abs(dy)>Math.abs(dx)&&Math.abs(dy)>9){pointer=null;schedule();return;}
      if(Math.abs(dx)<9||Math.abs(dx)<=Math.abs(dy)*1.12)return;
      p.moved=true;
      gsap.killTweensOf(state);
      stage!.classList.add('is-dragging');
      try{stage!.setPointerCapture(e.pointerId);}catch{/* ignore capture failure */}
    }
    if(e.cancelable)e.preventDefault();
    const now=performance.now();
    const dt=now-p.lastAt;
    if(dt>4){p.velocity=(e.clientX-p.lastX)/dt;p.lastX=e.clientX;p.lastAt=now;}
    state.position=p.start-dx/Math.max(170,stageWidth*.31);
    render();
  }
  function release(e:PointerEvent){
    const p=pointer;
    if(!p||p.id!==e.pointerId)return;
    pointer=null;
    stage!.classList.remove('is-dragging');
    if(stage!.hasPointerCapture(e.pointerId))stage!.releasePointerCapture(e.pointerId);
    if(!p.moved){schedule();return;}
    blockClickUntil=performance.now()+350;
    const velocity=performance.now()-p.lastAt<125
      ?clamp(-p.velocity*.12,-.28,.28):0;
    settle(Math.round(state.position+velocity),true);
  }
  function cancel(){
    if(!pointer)return;
    pointer=null;
    stage!.classList.remove('is-dragging');
    settle(Math.round(state.position),true);
  }

  function setup(){
    if(enabled||disposed||media.matches||director.get()==='essential')return;
    enabled=true;
    lastIndex=-1;
    shell!.classList.add('is-round');
    stageWidth=Math.max(1,stage!.clientWidth);
    render();
    announce();

    local=new AbortController();
    const signal=local.signal;
    shell!.querySelector<HTMLElement>('[data-occ-prev]')?.addEventListener('click',()=>navigate(-1,true),{signal});
    shell!.querySelector<HTMLElement>('[data-occ-next]')?.addEventListener('click',()=>navigate(1,true),{signal});
    stage!.addEventListener('pointerdown',down,{signal});
    stage!.addEventListener('pointermove',move,{signal});
    stage!.addEventListener('pointerup',release,{signal});
    stage!.addEventListener('pointercancel',cancel,{signal});
    stage!.addEventListener('lostpointercapture',cancel,{signal});
    stage!.addEventListener('click',event=>{
      if(performance.now()<blockClickUntil){event.preventDefault();event.stopPropagation();return;}
      const card=(event.target as HTMLElement).closest<HTMLElement>('.occ-card');
      if(!card)return;
      const index=cards.indexOf(card);
      if(index<0||index===activeIndex())return;
      event.preventDefault();
      event.stopPropagation();
      goToCard(index);
    },{capture:true,signal});
    stage!.addEventListener('keydown',e=>{
      if((e.target as HTMLElement).closest('a,button,input,textarea,select'))return;
      if(e.key==='ArrowLeft'){e.preventDefault();navigate(-1,true);}
      else if(e.key==='ArrowRight'){e.preventDefault();navigate(1,true);}
      else if(e.key==='Home'){e.preventDefault();settle(Math.round(state.position)-activeIndex(),true);}
      else if(e.key==='End'){e.preventDefault();settle(Math.round(state.position)-activeIndex()+2,true);}
    },{signal});
    shell!.addEventListener('mouseenter',()=>{hovered=true;stopAuto();},{signal});
    shell!.addEventListener('mouseleave',()=>{hovered=false;schedule();},{signal});
    shell!.addEventListener('focusin',()=>{focused=true;stopAuto();},{signal});
    shell!.addEventListener('focusout',()=>{focused=shell!.contains(document.activeElement);schedule();},{signal});
    document.addEventListener('visibilitychange',()=>{
      if(document.hidden){stopAuto();gsap.killTweensOf(state);}
      else{render();schedule();}
    },{signal});
    desktop.addEventListener('change',()=>{render();schedule();},{signal});

    ro=new ResizeObserver(()=>{
      stageWidth=Math.max(1,stage!.clientWidth);
      render();
    });
    ro.observe(stage!);

    // ScrollTrigger controls participation rather than hijacking scroll.
    const setAura=gsap.quickSetter(aura!,'y','px');
    trigger=ScrollTrigger.create({
      trigger:section!,start:'top 85%',end:'bottom 18%',
      onEnter:()=>{
        onscreen=true;
        gsap.fromTo(shell!,{autoAlpha:.2,y:28},{autoAlpha:1,y:0,duration:.86,ease:'power3.out',overwrite:true});
        schedule();
      },
      onEnterBack:()=>{onscreen=true;schedule();},
      onLeave:()=>{onscreen=false;stopAuto();},
      onLeaveBack:()=>{onscreen=false;stopAuto();},
      onUpdate:self=>setAura((self.progress-.5)*26)
    });
    if(section!.getBoundingClientRect().top<innerHeight*.85 &&
       section!.getBoundingClientRect().bottom>0){
      onscreen=true;
      schedule();
    }
  }

  function teardown(){
    if(!enabled)return;
    enabled=false;
    stopAuto();pointer=null;onscreen=false;
    gsap.killTweensOf(state);
    gsap.killTweensOf(shell);
    trigger?.kill();trigger=null;
    ro?.disconnect();ro=null;
    local?.abort();local=null;
    shell!.classList.remove('is-round');
    stage!.classList.remove('is-dragging');
    cards.forEach(card=>{
      gsap.set(card,{clearProps:'all'});
      card.classList.remove('is-active');
      card.removeAttribute('data-round-active');
      card.style.removeProperty('--occ-face');
    });
    links.forEach(link=>{
      if(!link)return;
      link.removeAttribute('tabindex');
      link.removeAttribute('aria-hidden');
    });
    gsap.set(shell!,{clearProps:'all'});
    gsap.set(aura!,{clearProps:'all'});
    delete stage!.dataset.activeIndex;
    delete stage!.dataset.occasion;
  }

  const onReduce=()=>{if(media.matches)teardown();else setup();};
  media.addEventListener('change',onReduce);
  director.onChange(intensity=>{if(disposed)return;if(intensity==='essential')teardown();else setup();});
  setup();
  return ()=>{
    disposed=true;
    media.removeEventListener('change',onReduce);
    teardown();
    io?.disconnect();
  };
}
