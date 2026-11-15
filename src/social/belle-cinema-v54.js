/* BELLE V63 | One focused Instagram journey followed by ALL real cinema previews.
 * Section A: six scroll-driven iPhone mockups with direct Instagram links.
 * Section B: the original Originkit Rotunda WebGL, mounted inline, with the
 * ENTIRE supplied ZIP manifest (47 slots; repeated MP4s intentionally retained).
 * Deliberately NO modal, copy panel, city buttons, video overlays or exploding shards.
 */
const section=document.getElementById('belle-cidades');
const previews=document.getElementById('belle-previews');
const cities=[
 {id:'araxa',name:'Araxá',profile:'belle.alencar'},
 {id:'frutal',name:'Frutal',profile:'frutal.bellealencar'},
 {id:'catalao',name:'Catalão',profile:'catalao.bellealencar'},
 {id:'mineiros',name:'Mineiros',profile:'bellealencar.mineiros'},
 {id:'ibia',name:'Ibiá',profile:'bellealencar.ibia'},
 {id:'franca',name:'Franca',profile:'bellealencar.franca'},
];
const clamp=(v,min,max)=>Math.min(max,Math.max(min,v));
const cityUrl=city=>'https://www.instagram.com/'+city.profile+'/';
const phoneSrc=city=>'/belle-v54/phones/'+city.id+'.webp';
const reduced=matchMedia('(prefers-reduced-motion: reduce)');
if(section){
 const stage=section.querySelector('[data-v54-stage]');
 const main=section.querySelector('[data-v54-tap]');
 const photo=section.querySelector('[data-v54-phone]');
 const announcer=section.querySelector('[data-v63-phone-announcement]');
 const left=section.querySelector('[data-v63-peek-left]');
 const right=section.querySelector('[data-v63-peek-right]');
 const leftImg=section.querySelector('[data-v63-peek-photo-left]');
 const rightImg=section.querySelector('[data-v63-peek-photo-right]');
 let current=-1,frame=0,near=false,gesture=null,preventTap=false;
 const preload=new Set();
 function prewarm(index){
   for(const n of [(index+5)%6,index,(index+1)%6]){
     const src=phoneSrc(cities[n]);
     if(preload.has(src))continue;
     preload.add(src);
     const img=new Image();
     img.decoding='async';
     img.src=src;
   }
 }
 function bindPhone(anchor,image,city,animate=false){
   anchor.href=cityUrl(city);
   anchor.setAttribute('aria-label','Abrir Instagram da Belle '+city.name);
   if(image.src.endsWith(phoneSrc(city)))return;
   image.src=phoneSrc(city);
   if(image===photo){
     image.alt='iPhone 17 Pro Max mostrando o Instagram da Belle '+city.name;
   }
   if(animate&&!reduced.matches && image.animate){
     image.animate([
       {opacity:.28,filter:'blur(8px)',transform:'translate3d(0,15px,-40px) scale(.93)'},
       {opacity:1,filter:'blur(0)',transform:'translate3d(0,0,0) scale(1)'}
     ],{duration:620,easing:'cubic-bezier(.18,.9,.22,1)'});
   }
 }
 function paint(index){
   index=clamp(index,0,5);
   if(index===current)return;
   const city=cities[index];
   prewarm(index);
   bindPhone(main,photo,city,current!==-1);
   bindPhone(left,leftImg,cities[(index+5)%6],current!==-1);
   bindPhone(right,rightImg,cities[(index+1)%6],current!==-1);
   section.dataset.v63City=city.id;
   stage.style.setProperty('--v63-chapter',String(index));
   announcer.textContent=city.name+', '+(index+1)+' de seis lojas. Clique no mockup para abrir o Instagram.';
   current=index;
 }
 function moveTo(index){
   index=(index+6)%6;
   const rect=section.getBoundingClientRect();
   const abs=window.scrollY+rect.top;
   const travel=Math.max(1,section.offsetHeight-window.innerHeight);
   const y=abs+(index+.48)/6*travel;
   window.scrollTo({top:y,behavior:reduced.matches?'instant':'smooth'});
 }
 function tick(){
   frame=0;
   if(!near||document.hidden)return;
   const rect=section.getBoundingClientRect();
   const travel=Math.max(1,section.offsetHeight-innerHeight);
   const p=clamp(-rect.top/travel,0,1);
   const idx=Math.min(5,Math.floor(p*6));
   paint(idx);
   section.style.setProperty('--v63-progress',String(p));
   // Smooth optical assembly: depth, proximity and opacity, never shattered pieces.
   const r=reduced.matches?1:clamp(p*10+.48,0,1);
   const ease=1-Math.pow(1-r,3);
   section.style.setProperty('--v63-reveal',String(ease));
   section.style.setProperty('--v63-entrance-y',((1-ease)*69).toFixed(1)+'px');
   section.style.setProperty('--v63-entrance-z',(-(1-ease)*110).toFixed(1)+'px');
   section.style.setProperty('--v63-entrance-scale',(0.86+ease*.14).toFixed(3));
 }
 const schedule=()=>{if(!frame)frame=requestAnimationFrame(tick)};
 const observer=typeof IntersectionObserver!=='undefined'
   ?new IntersectionObserver(entries=>{
     near=entries.some(x=>x.isIntersecting);
     if(near){paint(Math.max(0,current));schedule();}
   },{rootMargin:'600px 0px'}):null;
 if(observer)observer.observe(section);
 else{near=true;paint(0);}
 stage.addEventListener('pointermove',event=>{
   if(!near)return;
   const r=stage.getBoundingClientRect();
   const x=clamp((event.clientX-r.left)/Math.max(r.width,1)*2-1,-1,1);
   const y=clamp((event.clientY-r.top)/Math.max(r.height,1)*2-1,-1,1);
   stage.style.setProperty('--v63-pointer-x',x.toFixed(3));
   stage.style.setProperty('--v63-pointer-y',y.toFixed(3));
   section.style.setProperty('--v63-shift-x',(x*13).toFixed(1)+'px');
   section.style.setProperty('--v63-shift-y',(y*9).toFixed(1)+'px');
   section.style.setProperty('--v63-pitch',(-y*7.5).toFixed(2)+'deg');
   section.style.setProperty('--v63-yaw',(x*9).toFixed(2)+'deg');
 },{passive:true});
 stage.addEventListener('pointerleave',()=>{
   stage.style.setProperty('--v63-pointer-x','0');
   stage.style.setProperty('--v63-pointer-y','0');
   for(const [key,value] of [['--v63-shift-x','0px'],['--v63-shift-y','0px'],
     ['--v63-pitch','0deg'],['--v63-yaw','0deg']])section.style.setProperty(key,value);
 });
 stage.addEventListener('pointerdown',event=>{
   if(event.pointerType==='touch')gesture={x:event.clientX,y:event.clientY};
 },{passive:true});
 stage.addEventListener('pointerup',event=>{
   if(event.pointerType!=='touch'||!gesture)return;
   const dx=event.clientX-gesture.x,dy=event.clientY-gesture.y;
   gesture=null;
   if(Math.abs(dx)>54 && Math.abs(dx)>Math.abs(dy)*1.4){
     preventTap=true;
     moveTo(current+(dx<0?1:-1));
   }
 },{passive:true});
 for(const link of [main,left,right])link.addEventListener('click',event=>{
   if(preventTap){event.preventDefault();preventTap=false}
 });
 window.addEventListener('scroll',schedule,{passive:true});
 window.addEventListener('resize',schedule,{passive:true});
 paint(0);schedule();
}
if(previews){
 const title=previews.querySelector('[data-v63-previews-title]');
 const theater=previews.querySelector('[data-v63-previews-theater]');
 const host=previews.querySelector('[data-v54-rotunda]');
 const prev=previews.querySelector('[data-v54-prev]');
 const next=previews.querySelector('[data-v54-next]');
 let unmount=null,mounting=false,generation=0,manifestPromise=null,lastWheel=0;
 function allMedia(){
   if(!manifestPromise)manifestPromise=fetch('/belle-v54/manifest.json',{cache:'force-cache'})
     .then(r=>{if(!r.ok)throw Error('Manifest indisponível '+r.status);return r.json()})
     .then(a=>{
       if(!Array.isArray(a))throw Error('Manifest inválido');
       const seen=new Set();
       return a.filter(x=>{
         if(typeof x.src!=='string'||typeof x.poster!=='string')return false;
         if(!x.src.startsWith('/belle-v54/media/')||!x.poster.startsWith('/belle-v54/media/'))return false;
         if(seen.has(x.src))return false;
         seen.add(x.src);
         return true;
       });
     });
   return manifestPromise;
 }
 async function mount(){
   if(unmount||mounting||document.hidden)return;
   const ticket=++generation;
   mounting=true;
   try{
     const [clips,module]=await Promise.all([allMedia(),import('./belle-v54-rotunda-island')]);
     if(ticket!==generation||document.hidden)return;
     if(!clips.length)throw Error('Nenhum vídeo no pacote aprovado');
     // One continuous Rotunda with every DISTINCT MP4 from the client's ZIP.
     // Every unique video remains playing even behind the camera.
     unmount=await module.mountBelleRotunda(host,clips);
     previews.dataset.mediaCount=String(clips.length);
     previews.classList.add('v63-rotunda-ready');
   }catch(error){
     console.warn('BELLE PREVIEWS: componente ou mídia indisponível',error);
     previews.dataset.mediaStatus='error';
   }finally{mounting=false}
 }
 function stop(){
   ++generation;
   if(unmount){unmount();unmount=null}
   previews.classList.remove('v63-rotunda-ready');
 }
 const revealObserver=typeof IntersectionObserver!=='undefined'
   ?new IntersectionObserver(entries=>{
      for(const entry of entries)previews.classList.toggle('v63-in-view',entry.isIntersecting);
   },{threshold:.12}):null;
 revealObserver?.observe(previews);
 // Once started, do NOT unmount when scrolled offscreen.
 // The requested videos keep looping behind the camera and across sections.
 const mountObserver=typeof IntersectionObserver!=='undefined'
  ?new IntersectionObserver(entries=>{
    if(entries.some(e=>e.isIntersecting)){
      void mount();
      mountObserver?.disconnect();
    }
  },{rootMargin:'700px 0px'}):null;
 if(mountObserver)mountObserver.observe(theater);else void mount();
 const spin=delta=>window.dispatchEvent(new CustomEvent('belle:rotunda:step',{detail:{delta}}));
 prev.addEventListener('click',()=>spin(-1));
 next.addEventListener('click',()=>spin(1));
 theater.addEventListener('wheel',event=>{
   // Page scroll must remain native. Horizontal wheel/trackpad rotates the stage.
   if(Math.abs(event.deltaX)<Math.abs(event.deltaY)*1.25)return;
   if(Math.abs(event.deltaX)<12)return;
   event.preventDefault();
   const now=performance.now();
   if(now-lastWheel>320){spin(event.deltaX>0?1:-1);lastWheel=now}
 },{passive:false});
 title?.addEventListener('pointermove',event=>{
   if(reduced.matches)return;
   const b=title.getBoundingClientRect();
   const x=(((event.clientX-b.left)/Math.max(1,b.width)-.5)*2);
   const y=(((event.clientY-b.top)/Math.max(1,b.height)-.5)*2);
   title.style.setProperty('--v63-title-x',x.toFixed(3));
   title.style.setProperty('--v63-title-y',y.toFixed(3));
   title.style.setProperty('--v63-title-shift-x',(x*10).toFixed(2)+'px');
   title.style.setProperty('--v63-title-shift-y',(y*7).toFixed(2)+'px');
   title.style.setProperty('--v63-title-pitch',(-y*2.5).toFixed(2)+'deg');
   title.style.setProperty('--v63-title-yaw',(x*2.5).toFixed(2)+'deg');
 },{passive:true});
 title?.addEventListener('pointerleave',()=>{
   title.style.setProperty('--v63-title-x','0');
   title.style.setProperty('--v63-title-y','0');
   for(const [key,value] of [['--v63-title-shift-x','0px'],['--v63-title-shift-y','0px'],
     ['--v63-title-pitch','0deg'],['--v63-title-yaw','0deg']])title.style.setProperty(key,value);
 });
 // Browser background-tab throttling is managed by the browser, not by us.
 // Never call pause(), recreate the Rotunda, or reset all progress on visibility.
 document.addEventListener('visibilitychange',()=>{
   if(!document.hidden&&!unmount
      &&theater.getBoundingClientRect().top<innerHeight+350
      &&theater.getBoundingClientRect().bottom>-350)void mount();
 });
}

