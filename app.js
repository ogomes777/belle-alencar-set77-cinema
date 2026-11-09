(()=>{'use strict';
const cities={araxa:{name:'Araxá',uf:'MG'},frutal:{name:'Frutal',uf:'MG'},catalao:{name:'Catalão',uf:'GO'},mineiros:{name:'Mineiros',uf:'GO'}};
const storageKey='belle-alencar:preference:v1';const profileKey='belle-alencar:profile:v1';
const get=(key)=>{try{return localStorage.getItem(key)}catch{return null}},put=(key,val)=>{try{localStorage.setItem(key,val)}catch{}};
const $=sel=>document.querySelector(sel),$$=sel=>[...document.querySelectorAll(sel)];
const body=document.body,cityDialog=$('#cityDialog'),profileDialog=$('#profileDialog'),header=$('#siteHeader');
const reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;const lite=reduced||!!navigator.connection?.saveData||!!(navigator.deviceMemory&&navigator.deviceMemory<=2);
if(!reduced)document.documentElement.classList.add('js-motion');
let city=get(storageKey);const urlCity=new URLSearchParams(location.search).get('cidade');if(cities[urlCity])city=urlCity;if(!cities[city])city=null;
function syncCity(){const n=city?cities[city]:null;$$('.city-label').forEach(el=>el.textContent=n?n.name:'Escolher cidade');$$('[data-city]').forEach(el=>el.classList.toggle('is-active',el.dataset.city===city));const p=$('#customerCity');if(p&&city)p.value=city}
function saveCity(next,close=true){if(!cities[next])return;city=next;put(storageKey,next);syncCity();if(close)closeDialogs();const u=new URL(location.href);u.searchParams.set('cidade',next);history.replaceState(null,'',u.pathname+u.search+u.hash)}
function openDialog(dialog){closeDialogs();if(typeof dialog.showModal==='function')dialog.showModal();else dialog.setAttribute('open','');body.classList.add('modal-open')}
function closeDialogs(){[cityDialog,profileDialog].forEach(d=>{if(d.open&&d.close)d.close();else d.removeAttribute('open')});body.classList.remove('modal-open')}
$('#cityButton').addEventListener('click',()=>openDialog(cityDialog));$$('[data-open-city]').forEach(b=>b.addEventListener('click',()=>openDialog(cityDialog)));
$$('[data-city]').forEach(b=>b.addEventListener('click',()=>{saveCity(b.dataset.city);const menu=$('#mobileNav');menu.hidden=true;$('#menuButton').setAttribute('aria-expanded','false')}));
$$('[data-close]').forEach(b=>b.addEventListener('click',closeDialogs));
[cityDialog,profileDialog].forEach(d=>d.addEventListener('click',e=>{if(e.target===d)closeDialogs()}));
document.addEventListener('keydown',e=>{if(e.key==='Escape')closeDialogs()});
const menuBtn=$('#menuButton'),mobileNav=$('#mobileNav');menuBtn.addEventListener('click',()=>{mobileNav.hidden=!mobileNav.hidden;menuBtn.setAttribute('aria-expanded',String(!mobileNav.hidden))});$$('#mobileNav a').forEach(a=>a.addEventListener('click',()=>{mobileNav.hidden=true;menuBtn.setAttribute('aria-expanded','false')}));
$('#profileButton').addEventListener('click',openProfile);function openProfile(){const p=JSON.parse(get(profileKey)||'{}');$('#customerName').value=typeof p.name==='string'?p.name:'';$('#customerCity').value=city||'araxa';$('#profileFeedback').textContent='';openDialog(profileDialog)}
$('#profileForm').addEventListener('submit',e=>{e.preventDefault();let name=$('#customerName').value.trim().slice(0,60),next=$('#customerCity').value;if(!name){$('#profileFeedback').textContent='Informe seu primeiro nome para salvar.';return}put(profileKey,JSON.stringify({name}));saveCity(next,false);$('#profileFeedback').textContent='Preferências salvas neste navegador.';setTimeout(()=>{if(profileDialog.open)closeDialogs()},900)});
syncCity();if(!city){setTimeout(()=>openDialog(cityDialog),1650)}
const opening=$('#opening');if(get('belle:visited')){opening.classList.add('is-gone')}else{setTimeout(()=>{opening.classList.add('is-gone');put('belle:visited','1')},1050)}
const line=$('#scrollLine');let scrollPending=false;function onScroll(){if(scrollPending)return;scrollPending=true;requestAnimationFrame(()=>{const max=document.documentElement.scrollHeight-innerHeight;line.style.width=(max>0?Math.max(0,Math.min(100,scrollY/max*100)):0)+'%';header.classList.toggle('is-compact',scrollY>40);scrollPending=false})}addEventListener('scroll',onScroll,{passive:true});addEventListener('resize',onScroll,{passive:true});onScroll();
if(!reduced&&'IntersectionObserver'in window){const io=new IntersectionObserver(entries=>{entries.forEach(e=>{if(e.isIntersecting){e.target.classList.add('is-visible');io.unobserve(e.target)}})},{threshold:.1,rootMargin:'0px 0px -35px 0px'});$$('.reveal').forEach(el=>io.observe(el))}else $$('.reveal').forEach(el=>el.classList.add('is-visible'));
const room=$('#dressRoom');const figures=$$('.dress-figure');const looks=[{name:'Leve do seu jeito.',body:'Fluidos, com movimento e sem esforço.'},{name:'Para marcar presença.',body:'Uma seleção para quando o vestido é parte do plano.'},{name:'O clássico que fica.',body:'Peças que continuam fazendo sentido depois da ocasião.'}];let active=1;
function choose(i){if(i<0||i>=looks.length)return;active=i;figures.forEach((b,j)=>{const yes=i===j;b.classList.toggle('is-selected',yes);b.setAttribute('aria-pressed',yes)});const cap=$('#lookCaption');cap.querySelector('span').textContent='0'+(i+1)+' / 03';cap.querySelector('h3').textContent=looks[i].name;cap.querySelector('p').textContent=looks[i].body}
figures.forEach((b,i)=>{b.addEventListener('click',()=>choose(i));b.addEventListener('keydown',e=>{if(e.key==='ArrowRight'||e.key==='ArrowLeft'){e.preventDefault();const n=(i+(e.key==='ArrowRight'?1:2))%3;choose(n);figures[n].focus()}})});
let dragStart=null;room.addEventListener('pointerdown',e=>{if(e.pointerType==='mouse'&&e.button!==0)return;dragStart={x:e.clientX,y:e.clientY,t:performance.now()}});room.addEventListener('pointerup',e=>{if(!dragStart)return;const dx=e.clientX-dragStart.x,dy=e.clientY-dragStart.y;dragStart=null;if(Math.abs(dx)>65&&Math.abs(dx)>Math.abs(dy)*1.3)choose((active+(dx<0?1:2))%3)});
if(!lite&&matchMedia('(pointer:fine)').matches){const hero=$('#heroVisual');hero.addEventListener('pointermove',e=>{const r=hero.getBoundingClientRect(),x=(e.clientX-r.left)/r.width-.5,y=(e.clientY-r.top)/r.height-.5;hero.querySelector('.hero__halo').style.transform='translate('+(-x*20)+'px,'+(-y*20)+'px)'});hero.addEventListener('pointerleave',()=>hero.querySelector('.hero__halo').style.transform='');
figures.forEach(b=>{b.addEventListener('pointermove',e=>{if(!b.classList.contains('is-selected'))return;const r=b.getBoundingClientRect();b.style.setProperty('--lean',(((e.clientX-r.left)/r.width-.5)*6).toFixed(1)+'deg')});b.addEventListener('pointerleave',()=>b.style.setProperty('--lean','0deg'))})}
document.addEventListener('visibilitychange',()=>{if(document.hidden)dragStart=null});
})();
/* SET77 / supplementary cinematic interactions / self-contained */
(()=>{'use strict';
if(matchMedia('(prefers-reduced-motion: reduce)').matches)return;
const fine=matchMedia('(pointer:fine)').matches&&!navigator.connection?.saveData;
const hero=document.getElementById('heroVisual'),room=document.getElementById('dressRoom'),manifesto=document.querySelector('.manifesto__light');
if(room&&'IntersectionObserver'in window){const io=new IntersectionObserver(entries=>entries.forEach(e=>room.classList.toggle('is-onstage',e.isIntersecting)),{threshold:.18});io.observe(room)}
if(fine){document.querySelectorAll('.magnetic').forEach(el=>{el.addEventListener('pointermove',e=>{const r=el.getBoundingClientRect();el.style.setProperty('--mx',(((e.clientX-r.left)/r.width-.5)*7).toFixed(1)+'px');el.style.setProperty('--my',(((e.clientY-r.top)/r.height-.5)*7).toFixed(1)+'px')});el.addEventListener('pointerleave',()=>{el.style.setProperty('--mx','0px');el.style.setProperty('--my','0px')})})}
if(!fine)return;
let raf=0;
const update=()=>{raf=0;if(document.hidden)return;const r=hero?.getBoundingClientRect();if(r&&r.bottom>0&&r.top<innerHeight){const y=Math.max(-22,Math.min(28,(innerHeight*.45-r.top-r.height*.5)*.043));hero.style.setProperty('--hero-y',y.toFixed(2)+'px')}if(manifesto){const q=manifesto.parentElement.getBoundingClientRect();if(q.bottom>0&&q.top<innerHeight)manifesto.style.transform='translateY('+Math.max(-50,Math.min(50,((innerHeight-q.top)-q.height/2)*.06)).toFixed(1)+'px)'}};
addEventListener('scroll',()=>{if(!raf)raf=requestAnimationFrame(update)},{passive:true});addEventListener('resize',()=>{if(!raf)raf=requestAnimationFrame(update)},{passive:true});update();
})();
/* Perfil local acessível pelo menu móvel */
document.getElementById("mobileProfileButton")?.addEventListener("click",()=>{const nav=document.getElementById("mobileNav");nav.hidden=true;document.getElementById("menuButton").setAttribute("aria-expanded","false");document.getElementById("profileButton").click()});
