/** Belle V86 · two real banners, zero scroll capture and gentle automatic rotation. */
export function initBelleOpeningV86(): void {
  const frame=document.querySelector<HTMLElement>('#v86BannerCarousel');
  const mount=document.getElementById('v86CubeMount');
  if(!frame) return;
  const slides=Array.from(frame.querySelectorAll<HTMLElement>('[data-v86-banner]'));
  const dots=Array.from(frame.querySelectorAll<HTMLButtonElement>('[data-v86-dot]'));
  if(slides.length!==2 || dots.length!==2)return;
  let current=0,interval=0,visible=true,hovered=false,focused=false;
  let swipeStart:{x:number;y:number}|null=null;
  let mouseStart:{x:number;y:number}|null=null;
  const reduce=matchMedia('(prefers-reduced-motion: reduce)');
  const scheduleMs=4700;

  function sync(index:number){
    const next=(index+slides.length)%slides.length;
    if(next===current)return;
    current=next;
    slides.forEach((slide,i)=>{
      const active=i===current;
      slide.classList.toggle('is-active',active);
      slide.setAttribute('aria-hidden',String(!active));
      slide.toggleAttribute('inert',!active);
    });
    dots.forEach((dot,i)=>{
      const active=i===current;
      dot.classList.toggle('is-active',active);
      if(active)dot.setAttribute('aria-current','true');
      else dot.removeAttribute('aria-current');
    });
  }
  function pause(){if(interval)window.clearInterval(interval);interval=0;}
  function shouldRun(){return visible&&!document.hidden&&!hovered&&!focused&&!reduce.matches&&document.documentElement.classList.contains('intro-done');}
  function play(){
    pause();
    if(shouldRun())interval=window.setInterval(()=>sync(current+1),scheduleMs);
  }
  function go(n:number){sync(n);play();}
  frame.querySelector('#v86BannerPrev')?.addEventListener('click',()=>go(current-1));
  frame.querySelector('#v86BannerNext')?.addEventListener('click',()=>go(current+1));
  dots.forEach((dot,i)=>dot.addEventListener('click',()=>go(i)));
  frame.addEventListener('keydown',event=>{
    if(event.key==='ArrowLeft'){event.preventDefault();go(current-1);}
    if(event.key==='ArrowRight'){event.preventDefault();go(current+1);}
  });
  frame.addEventListener('pointerenter',event=>{if(event.pointerType==='mouse'){hovered=true;pause();}});
  frame.addEventListener('pointerleave',event=>{if(event.pointerType==='mouse'){hovered=false;play();}});
  frame.addEventListener('focusin',()=>{focused=true;pause();});
  frame.addEventListener('focusout',event=>{
    if(!frame.contains(event.relatedTarget as Node)){focused=false;play();}
  });
  frame.addEventListener('touchstart',event=>{
    const t=event.touches[0];if(t)swipeStart={x:t.clientX,y:t.clientY};
  },{passive:true});
  frame.addEventListener('touchend',event=>{
    const t=event.changedTouches[0],start=swipeStart;swipeStart=null;
    if(!t||!start)return;
    const dx=t.clientX-start.x,dy=t.clientY-start.y;
    if(Math.abs(dx)>42&&Math.abs(dx)>Math.abs(dy)*1.25)go(current+(dx<0?1:-1));
  },{passive:true});
  frame.addEventListener('pointerdown',event=>{
    if(event.pointerType!=='mouse'||event.button!==0||(event.target as HTMLElement).closest('button'))return;
    mouseStart={x:event.clientX,y:event.clientY};
  },{passive:true});
  frame.addEventListener('pointerup',event=>{
    const start=mouseStart;mouseStart=null;
    if(!start||event.pointerType!=='mouse')return;
    const dx=event.clientX-start.x,dy=event.clientY-start.y;
    if(Math.abs(dx)>45&&Math.abs(dx)>Math.abs(dy)*1.2)go(current+(dx<0?1:-1));
  },{passive:true});
  document.addEventListener('visibilitychange',play);
  reduce.addEventListener?.('change',play);
  if('IntersectionObserver' in window){
    new IntersectionObserver(entries=>{
      visible=entries.some(e=>e.isIntersecting);
      play();
    },{threshold:.1}).observe(frame);
  }
  // Autoplay begins only AFTER the one-shot Belle signature loader clears.
  // Otherwise the first banner would already be halfway through its dwell.
  const html=document.documentElement;
  if(!html.classList.contains('intro-done')){
    const observer=new MutationObserver(()=>{
      if(html.classList.contains('intro-done')){observer.disconnect();play();}
    });
    observer.observe(html,{attributes:true,attributeFilter:['class']});
  }
  play();
  // Keep the next original art cached while avoiding duplicate first-frame downloads.
  const warmSecond=()=>{const image=new Image();image.src='/media/banner-v86-travertino.webp';};
  if('requestIdleCallback' in window)window.requestIdleCallback(warmSecond,{timeout:2200});
  else setTimeout(warmSecond,1400);

  // Original Originkit loop is mounted only while in view. Unmounting stops
  // Framer Motion's perpetual 3D animations offscreen and on hidden tabs.
  if(mount&&!reduce.matches){
    let teardown:(()=>void)|null=null;
    let serial=0;
    let inView=true;
    const placeholder='<h2 class="v86-opening__fallback">BELLE ALENCAR</h2>';
    async function syncCube(){
      const token=++serial;
      if(!inView||document.hidden){
        if(teardown){teardown();teardown=null;mount!.innerHTML=placeholder;}
        return;
      }
      if(teardown)return;
      try{
        const mod=await import('./belle-opening-cube-v86');
        if(token!==serial||!inView||document.hidden)return;
        teardown=mod.mountBelleOpeningCube(mount!);
      }catch(err){
        console.warn('[belle] 3D lettering unavailable; using static wordmark',err);
        mount!.innerHTML=placeholder;
      }
    }
    const onCubeVisibility=()=>{void syncCube();};
    document.addEventListener('visibilitychange',onCubeVisibility);
    if('IntersectionObserver' in window){
      new IntersectionObserver(entries=>{
        inView=entries.some(e=>e.isIntersecting);
        void syncCube();
      },{rootMargin:'120px 0px',threshold:0}).observe(mount);
    }else void syncCube();
  }
}
