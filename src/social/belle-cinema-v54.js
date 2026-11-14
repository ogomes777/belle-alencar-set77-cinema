/* BELLE V54 — progressive scroll storyboard, actual client-provided media, no scraping. */
const section = document.getElementById('belle-cidades');
const dialog = document.getElementById('belleV54FilmDialog');
const cities = [
 {id:'araxa',name:'Araxá',region:'Minas Gerais',profile:'belle.alencar',count:12},
 {id:'frutal',name:'Frutal',region:'Minas Gerais',profile:'frutal.bellealencar',count:11},
 {id:'catalao',name:'Catalão',region:'Goiás',profile:'catalao.bellealencar',count:12},
 {id:'mineiros',name:'Mineiros',region:'Goiás',profile:'bellealencar.mineiros',count:11},
 {id:'ibia',name:'Ibiá',region:'Minas Gerais',profile:'bellealencar.ibia',count:0},
 {id:'franca',name:'Franca',region:'São Paulo',profile:'bellealencar.franca',count:1}
];
const clamp=(v,a,b)=>Math.min(b,Math.max(a,v));
const profileLink=(city)=>'https://www.instagram.com/'+city.profile+'/';
const source=(city)=>'/belle-v54/phones/'+city.id+'.webp';
if(section && dialog){
 const $=(s,within=section)=>within.querySelector(s);
 const phone=$('[data-v54-phone]'),shards=[...section.querySelectorAll('[data-v54-shard]')];
 const tabs=[...section.querySelectorAll('[data-v54-city]')];
 const serial=$('[data-v54-serial]'),name=$('[data-v54-name]');
 const region=$('[data-v54-region]'),handle=$('[data-v54-handle]'),count=$('[data-v54-count]');
 const cta=$('[data-v54-open]'),instruction=$('[data-v54-instruction]'),fill=$('[data-v54-fill]');
 const phoneButton=$('[data-v54-tap]'),stage=$('[data-v54-stage]');
 const players=$('[data-v54-players]',dialog),dialogCity=$('[data-v54-dialog-city]',dialog),dialogCount=$('[data-v54-dialog-count]',dialog);
 const movieSelect=$('[data-v54-select]'),filmLink=$('[data-v54-instagram]'),rotundaHost=$('[data-v54-rotunda]');
 let current=-1,manifest=null,manifestPromise=null,videoIndex=0,renderReq=0;
 let rotundaUninstall=null,rotundaRequest=0,returnFocus=null;
 let pointer=[0,0],lastScrollIndex=-1;
 const reduced=window.matchMedia('(prefers-reduced-motion: reduce)');
 for(const city of cities){const im=new Image();im.src=source(city);}
 function paintCity(index){
   index=clamp(index,0,cities.length-1);
   if(index===current)return;
   current=index;
   const city=cities[index];
   serial.textContent=String(index+1).padStart(2,'0')+' / 06';
   name.textContent=city.name;region.textContent=city.region;
   handle.textContent='@'+city.profile;
   count.textContent=city.count===0?'ZERO PREVIEWS':city.count+' PREVIEWS';
   if(city.count===0){
    cta.textContent='Abrir Instagram de Ibiá ↗';instruction.textContent='Ibiá: sem vídeos · acesso direto ao Instagram';
   }else{
    cta.textContent='Assistir aos previews · '+city.name+' ↗';instruction.textContent='Toque no iPhone para assistir ao filme';
   }
   phone.src=source(city);phone.alt='Mockup original iPhone 17 Pro Max com Instagram da Belle '+city.name;
   phoneButton.setAttribute('aria-label',city.count===0?'Abrir Instagram Belle Ibiá':'Abrir filme de previews Belle '+city.name);
   shards.forEach(img=>{img.src=source(city)});
   tabs.forEach((tab,i)=>{const on=i===index;tab.setAttribute('aria-pressed',String(on));tab.tabIndex=on?0:-1});
 }
 function assembly(p){
  const t=reduced.matches?1:clamp(p*4.5,0,1);
  const eased=1-Math.pow(1-t,3);
  phone.style.opacity=String(clamp((eased-.3)/.7,0,1));
  const d=[[-185,-145,-35],[160,-140,32],[-200,-42,-19],[195,42,24],[-130,165,-17],[155,160,28]];
  shards.forEach((sh,i)=>{
    const [dx,dy,rotation]=d[i];const v=1-eased;
    sh.style.opacity=String(clamp(1-eased*.98,0,1));
    sh.style.transform=`translate3d(${(dx*v).toFixed(1)}px,${(dy*v).toFixed(1)}px,${(70*v).toFixed(1)}px) rotateZ(${(rotation*v).toFixed(2)}deg) scale(${(1+v*.13).toFixed(3)})`;
  });
 }
 function tickScroll(){
   renderReq=0;
   const rect=section.getBoundingClientRect();
   const travel=Math.max(1,section.offsetHeight-innerHeight);
   const local=clamp(-rect.top/travel,0,1);
   const idx=clamp(Math.floor(local*6),0,5);
   if(idx!==lastScrollIndex){paintCity(idx);lastScrollIndex=idx}
   fill.style.width=(100*local).toFixed(2)+'%';
   assembly(local*6);
   const center=stage.querySelector('.v54-phone-core');
   if(center){center.style.transform=`rotateY(${pointer[0]*7+(local-.5)*5}deg) rotateX(${-pointer[1]*5+2}deg)`}
 }
 const schedule=()=>{if(!renderReq)renderReq=requestAnimationFrame(tickScroll)};
 window.addEventListener('scroll',schedule,{passive:true});window.addEventListener('resize',schedule,{passive:true});
 const moving=window.matchMedia('(pointer:fine)');
 if(moving.matches){stage.addEventListener('pointermove',event=>{const r=stage.getBoundingClientRect();pointer=[clamp((event.clientX-r.left)/Math.max(1,r.width)*2-1,-1,1),clamp((event.clientY-r.top)/Math.max(1,r.height)*2-1,-1,1)];schedule()},{passive:true});stage.addEventListener('pointerleave',()=>{pointer=[0,0];schedule()})}
 tabs.forEach((tab,i)=>{
   const go=()=>{const y=window.scrollY+section.getBoundingClientRect().top;const segment=(section.offsetHeight-innerHeight)/6;window.scrollTo({top:y+(i+.40)*segment,behavior:reduced.matches?'instant':'smooth'})};
   tab.addEventListener('click',go);
   tab.addEventListener('keydown',e=>{if(!['ArrowLeft','ArrowRight','Home','End'].includes(e.key))return;e.preventDefault();const next=e.key==='Home'?0:e.key==='End'?5:(i+(e.key==='ArrowRight'?1:5))%6;tabs[next].focus();tabs[next].click()});
 });
 function allClips(city){return (manifest||[]).filter(item=>item.city===city.id).sort((a,b)=>a.order-b.order)}
 async function getManifest(){
  if(!manifestPromise)manifestPromise=fetch('/belle-v54/manifest.json',{cache:'force-cache'}).then(r=>{if(!r.ok)throw new Error('Pacote de mídia indisponível');return r.json()}).then(data=>{manifest=Array.isArray(data)?data:[];return manifest});
  return manifestPromise;
 }
 function releaseVideos(){players.querySelectorAll('video').forEach(v=>{v.pause();v.removeAttribute('src');v.load()});players.replaceChildren()}
 function updatePlayer(){
  const city=cities.find(x=>x.id===movieSelect.value)||cities[current];
  if(!city||city.count===0){players.innerHTML='<p class="v54-film-empty">Ibiá não possui previews. Acesse o Instagram da unidade diretamente.</p>';return}
  const clips=allClips(city);const n=clips.length;dialogCity.textContent='Belle '+city.name;dialogCount.textContent=n+' PREVIEWS · LOOP CONTÍNUO';
  filmLink.href=profileLink(city);filmLink.textContent='Abrir Instagram Belle '+city.name+' ↗';
  releaseVideos();
  if(!n){players.innerHTML='<p class="v54-film-empty">Os arquivos de vídeo desta cidade não foram encontrados neste deploy.</p>';return}
  for(let s=-1;s<=1;s++){
   const idx=(videoIndex+s+n)%n,clip=clips[idx],tile=document.createElement('div');tile.className='v54-clip';tile.dataset.side=String(s);
   const v=document.createElement('video');v.src=clip.src;v.poster=clip.poster;v.loop=true;v.muted=true;v.autoplay=true;v.playsInline=true;v.preload=s===0?'auto':'metadata';v.disablePictureInPicture=true;v.setAttribute('aria-label',`Vídeo ${idx+1} de ${n} da Belle ${city.name}`);v.setAttribute('playsinline','');v.controls=false;
   const label=document.createElement('div');label.className='v54-clip-number';label.textContent=String(idx+1).padStart(2,'0')+' / '+String(n).padStart(2,'0')+' · LOOP';
   tile.append(v,label);players.append(tile);
   const promise=v.play();if(promise&&typeof promise.catch==='function')promise.catch(()=>{v.muted=true;v.play().catch(()=>{})});
  }
 }
 function shift(delta){const city=cities.find(x=>x.id===movieSelect.value);if(!city)return;const n=allClips(city).length||1;videoIndex=(videoIndex+delta+n)%n;updatePlayer()}
 const prev=$('[data-v54-prev]',dialog),next=$('[data-v54-next]',dialog);
 prev.addEventListener('click',()=>shift(-1));next.addEventListener('click',()=>shift(1));
 let touchX=null,touchY=null;
 players.addEventListener('touchstart',event=>{if(event.touches.length!==1)return;touchX=event.touches[0].clientX;touchY=event.touches[0].clientY},{passive:true});
 players.addEventListener('touchend',event=>{if(touchX===null)return;const pt=event.changedTouches[0],dx=pt.clientX-touchX,dy=pt.clientY-touchY;touchX=touchY=null;if(Math.abs(dx)>45&&Math.abs(dx)>Math.abs(dy)*1.25)shift(dx<0?1:-1)},{passive:true});
 let lastWheel=0;
 players.addEventListener('wheel',event=>{if(Math.abs(event.deltaY)<15&&Math.abs(event.deltaX)<15)return;event.preventDefault();const now=performance.now();if(now-lastWheel>440){shift((event.deltaY||event.deltaX)>0?1:-1);lastWheel=now}},{passive:false});
 dialog.addEventListener('keydown',event=>{const target=event.target;if(target instanceof HTMLSelectElement)return;if(event.key==='ArrowRight')shift(1);if(event.key==='ArrowLeft')shift(-1)});
 movieSelect.addEventListener('change',()=>{
  const city=cities.find(x=>x.id===movieSelect.value);if(!city)return;
  if(city.count===0){dialog.close();window.open(profileLink(city),'_blank','noopener,noreferrer');return}
  videoIndex=0;updatePlayer();mountRotunda(city);
 });
 async function mountRotunda(city){
  const request=++rotundaRequest;
  if(rotundaUninstall){rotundaUninstall();rotundaUninstall=null}
  rotundaHost.replaceChildren();
  const clips=allClips(city);
  try{
    const module=await import('./belle-v54-rotunda-island');
    if(request!==rotundaRequest||!dialog.open)return;
    rotundaUninstall=await module.mountBelleRotunda(rotundaHost,clips.map(x=>x.poster));
  }catch(error){console.warn('V54 Rotunda fallback:',error);rotundaHost.innerHTML='<div class="v54-rotunda-placeholder" aria-hidden="true"></div>'}
 }
 async function openFilm(){
  const city=cities[current]||cities[0];if(city.count===0){window.open(profileLink(city),'_blank','noopener,noreferrer');return}
  returnFocus=document.activeElement;
  try{await getManifest()}catch(error){console.warn('V54 film assets unavailable',error);manifest=[]}
  videoIndex=0;movieSelect.value=city.id;
  dialog.showModal();document.documentElement.classList.add('v54-film-open');
  updatePlayer();void mountRotunda(city);
 }
 function closeFilm(){dialog.close()}
 const back=$('[data-v54-back]',dialog);back.addEventListener('click',closeFilm);
 dialog.addEventListener('click',event=>{if(event.target===dialog)closeFilm()});
 dialog.addEventListener('close',()=>{document.documentElement.classList.remove('v54-film-open');releaseVideos();rotundaRequest++;if(rotundaUninstall){rotundaUninstall();rotundaUninstall=null}rotundaHost.replaceChildren();if(returnFocus&&returnFocus.isConnected)returnFocus.focus({preventScroll:true})});
 cta.addEventListener('click',openFilm);phoneButton.addEventListener('click',openFilm);
 paintCity(0);schedule();
}