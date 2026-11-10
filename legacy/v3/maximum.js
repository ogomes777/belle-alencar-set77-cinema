
/* SET77 LABS | BELLE ALENCAR | MAXIMUM CINEMA 03 / camera, portal, type, fabric, tactile. All motion opts out when requested. */
(()=>{'use strict';
const $=q=>document.querySelector(q),$$=q=>Array.from(document.querySelectorAll(q));
const G=window.gsap,ST=window.ScrollTrigger;
const reduce=matchMedia('(prefers-reduced-motion: reduce)').matches,coarse=matchMedia('(pointer:coarse)').matches,small=matchMedia('(max-width:850px)').matches,saveData=!!navigator.connection?.saveData;
const low=reduce||saveData||(navigator.deviceMemory&&navigator.deviceMemory<=2);
let intensity=(()=>{try{return localStorage.getItem('belle:cine-intensity')||'max'}catch{return'max'}})();
if(reduce)intensity='essential';document.body.classList.toggle('ba-essential',intensity==='essential');
const menu=$('#directorMenu'),toggle=$('#directorToggle');
function syncMode(){document.body.classList.toggle('ba-essential',intensity==='essential');$$('[data-cinema-mode]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.cinemaMode===intensity)));if(ST)ST.refresh()}
toggle?.addEventListener('click',()=>{menu.hidden=!menu.hidden;toggle.setAttribute('aria-expanded',String(!menu.hidden))});
$$('[data-cinema-mode]').forEach(b=>b.addEventListener('click',()=>{if(reduce&&b.dataset.cinemaMode==='max'){intensity='essential'}else intensity=b.dataset.cinemaMode;try{localStorage.setItem('belle:cine-intensity',intensity)}catch{}syncMode()}));
document.addEventListener('keydown',e=>{if(e.key==='Escape'&&menu&&!menu.hidden){menu.hidden=true;toggle.setAttribute('aria-expanded','false')}});
document.addEventListener('pointerdown',e=>{if(menu&&!menu.hidden&&!$('#baDirector').contains(e.target)){menu.hidden=true;toggle.setAttribute('aria-expanded','false')}});

/* Portal: one camera trajectory, doors, depth and title in the same coordinate system. */
const scene=$('#portalScene'),portal=$('#portal'),street=$('.ba-portal__street'),title=$('.ba-portal__title'),inside=$('.ba-portal__inside');
function applyPortal(progress){
 let p=Math.max(0,Math.min(1,progress)),doors=Math.max(0,Math.min(1,(p-.08)/.48));
 scene?.style.setProperty('--door',doors.toFixed(3));scene?.style.setProperty('--dolly',Math.max(0,(p-.23)/.77).toFixed(3));
 if(title){title.style.opacity=String(1-Math.min(1,p*3));title.style.transform='translateY(calc(-50% - '+(Math.min(p*60,50)).toFixed(1)+'px)) scale('+(1+p*.1).toFixed(3)+')'}
 if(inside){let a=Math.max(0,Math.min(1,(p-.56)/.18));inside.style.opacity=String(a);inside.style.transform='translateY(calc(-50% + '+(1-a)*30+'px)) scale('+(.9+.1*a)+')'}
 if(scene){const bg=232-Math.round(p*55);scene.style.backgroundColor='rgb('+bg+','+(bg-8)+','+(bg-20)+')'}
}
if(!reduce&&!small&&G&&ST&&portal){
 G.registerPlugin(ST);
 ST.create({trigger:portal,start:'top top',end:'bottom bottom',onUpdate:self=>applyPortal(self.progress),invalidateOnRefresh:true});
 applyPortal(0);
}else if(!reduce&&small&&portal){
 let entered=false;
 const ob=new IntersectionObserver(entries=>{if(entries.some(e=>e.isIntersecting)&&!entered){entered=true;setTimeout(()=>{applyPortal(.77);setTimeout(()=>applyPortal(.98),950)},450)}},{threshold:.35});
 ob.observe(portal);
}

/* Text architecture: own SVG thread animates through the center, not through navigation. */
if(!reduce&&G&&ST){
 const path=$('#baThread');if(path){try{const length=path.getTotalLength();path.style.strokeDasharray=String(length);path.style.strokeDashoffset=String(length);
 G.to(path,{strokeDashoffset:0,scrollTrigger:{trigger:'#assinatura',start:'top 85%',end:'bottom 20%',scrub:1},ease:'none'})}catch(e){}}
 G.to('.ba-break__stage h2',{y:-18,opacity:1,duration:1.25,ease:'power3.out',scrollTrigger:{trigger:'#assinatura',start:'top 80%',once:true}});
 G.fromTo('.ba-break__orbit--one',{rotation:28},{rotation:85,scrollTrigger:{trigger:'#assinatura',start:'top bottom',end:'bottom top',scrub:1.4},ease:'none'});
 G.fromTo('.ba-break__orbit--two',{rotation:-28},{rotation:-96,scrollTrigger:{trigger:'#assinatura',start:'top bottom',end:'bottom top',scrub:1.3},ease:'none'});
 G.to('.ba-break__type',{x:-160,scrollTrigger:{trigger:'#assinatura',start:'top bottom',end:'bottom top',scrub:1},ease:'none'});
 G.to('.ba-break__outline',{x:160,scrollTrigger:{trigger:'#assinatura',start:'top bottom',end:'bottom top',scrub:1},ease:'none'});
 const curtain=$('#interludio');
 if(curtain){ST.create({trigger:curtain,start:'top 85%',end:'bottom 17%',onUpdate:self=>{let p=self.progress;curtain.style.setProperty('--curtain-open',p.toFixed(3));curtain.style.setProperty('--curtain-alpha',Math.max(.15,Math.min(1,p*2.5)).toFixed(3))}})}
 const target=$('.ba-tactile__copy h2');
 if(target)G.fromTo(target,{y:48,opacity:.2},{y:0,opacity:1,ease:'power3.out',duration:1.2,scrollTrigger:{trigger:target,start:'top 85%',once:true}});
 ST.refresh();
}else{
 const curtain=$('#interludio');if(curtain){curtain.style.setProperty('--curtain-open','.86');curtain.style.setProperty('--curtain-alpha','1')}
}

/* Tactile lens / mouse in coarse pointer remains standard accessible photo */
const tactile=$('#tactileVisual');
if(tactile&&!coarse&&!low){
 tactile.addEventListener('pointermove',e=>{let r=tactile.getBoundingClientRect(),x=(e.clientX-r.left)/r.width,y=(e.clientY-r.top)/r.height;
  tactile.style.setProperty('--lens-x',(Math.min(.9,Math.max(.1,x))*100).toFixed(2)+'%');
  tactile.style.setProperty('--lens-y',(Math.min(.9,Math.max(.1,y))*100).toFixed(2)+'%');
  tactile.style.setProperty('--dx',((x-.5)*120).toFixed(1)+'px');tactile.style.setProperty('--dy',((y-.5)*150).toFixed(1)+'px');
 },{passive:true});
}
const photos={
 toque:['https://images.unsplash.com/photo-1539008835657-9e8e9680c956?auto=format&fit=crop&w=1600&q=88','Editorial ilustrativo do toque de vestido'],
 caimento:['https://images.unsplash.com/photo-1490481651871-ab68de25d43d?auto=format&fit=crop&w=1600&q=88','Editorial ilustrativo de caimento de roupa'],
 presenca:['https://images.unsplash.com/photo-1539109136881-3be0616acf4b?auto=format&fit=crop&w=1600&q=88','Editorial ilustrativo de presença e roupa']
};
$$('[data-texture]').forEach(b=>b.addEventListener('click',()=>{const k=b.dataset.texture,src=photos[k];if(!src)return;
 $$('[data-texture]').forEach(q=>{const is=q===b;q.classList.toggle('is-active',is);q.setAttribute('aria-pressed',String(is))});
 const img=$('.ba-tactile__img img'),lens=$('.ba-tactile__lens img');if(!img||!lens)return;
 img.animate?.([{opacity:.55,transform:'scale(1.025)'},{opacity:1,transform:'scale(1)'}],{duration:620,easing:'cubic-bezier(.22,.8,.2,1)'});
 img.src=src[0];img.alt=src[1];lens.src=src[0].replace('w=1600','w=2000');
}));
/* advanced but subtle cursor velocity injection into hero works only fine pointer */
if(!coarse&&!low&&intensity==='max'){
 const hero=$('#heroVisual');let px=0,py=0;
 hero?.addEventListener('pointermove',e=>{const r=hero.getBoundingClientRect();let x=(e.clientX-r.left)/r.width-.5,y=(e.clientY-r.top)/r.height-.5;
  hero.style.setProperty('--hero-x',(x*16).toFixed(2)+'px');hero.style.setProperty('--hero-y',(-y*14).toFixed(2)+'px');px=x;py=y;
 },{passive:true});
 hero?.addEventListener('pointerleave',()=>{hero.style.setProperty('--hero-x','0px');hero.style.setProperty('--hero-y','0px')});
}
})();
