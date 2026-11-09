
(()=>{'use strict';
const $=s=>document.querySelector(s),$$=s=>Array.from(document.querySelectorAll(s)),clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
const reduced=matchMedia('(prefers-reduced-motion: reduce)').matches,small=matchMedia('(max-width:850px)').matches;
const G=window.gsap,ST=window.ScrollTrigger;
if(G&&ST&&!reduced)G.registerPlugin(ST);
/* active chapter */
if('IntersectionObserver'in window){
 const chapters=['inicio','colecao','filme','materia','atelier','lookbook','lojas'];
 const ob=new IntersectionObserver(entries=>{entries.forEach(e=>{if(e.isIntersecting)$$('[data-scene]').forEach(a=>a.classList.toggle('is-active',a.dataset.scene===e.target.id))})},{rootMargin:'-36% 0px -53% 0px'});
 chapters.forEach(id=>{const el=document.getElementById(id);if(el)ob.observe(el)});
}
/* four-act scroll film */
const shots=$$('.cinefilm__shot');let scene=0,filmTimeline=null;
function setScene(n){scene=clamp(n,0,3);shots.forEach((el,i)=>{el.classList.toggle('is-active',i===scene);el.setAttribute('aria-hidden',String(i!==scene))});$('#cineCount').textContent=String(scene+1).padStart(2,'0');$('#cineProgress').style.width=((scene+1)*25)+'%'}
setScene(0);
function seekScene(delta){let next=clamp(scene+delta,0,3);
 if(filmTimeline&&filmTimeline.scrollTrigger){let s=filmTimeline.scrollTrigger;window.scrollTo({top:s.start+(s.end-s.start)*(next/3),behavior:'smooth'})}else setScene(next)}
$('#cinePrev')?.addEventListener('click',()=>seekScene(-1));$('#cineNext')?.addEventListener('click',()=>seekScene(1));
let touch=null;$('#cineStage')?.addEventListener('touchstart',e=>touch={x:e.touches[0].clientX,y:e.touches[0].clientY},{passive:true});
$('#cineStage')?.addEventListener('touchend',e=>{if(!touch)return;let dx=e.changedTouches[0].clientX-touch.x,dy=e.changedTouches[0].clientY-touch.y;touch=null;if(Math.abs(dx)>65&&Math.abs(dx)>Math.abs(dy)*1.3)seekScene(dx<0?1:-1)},{passive:true});
if(G&&ST&&!reduced&&!small){filmTimeline=G.timeline({scrollTrigger:{trigger:'#filme',start:'top top',end:'+=310%',pin:true,scrub:1.2,anticipatePin:1,onUpdate:self=>setScene(Math.min(3,Math.floor(self.progress*4.0001)))}});filmTimeline.to('#cineStage',{filter:'brightness(.93)',duration:1,ease:'none'}).to('#cineStage',{filter:'brightness(1)',duration:1,ease:'none'}).to('#cineStage',{filter:'brightness(.96)',duration:1,ease:'none'});}
else if(small&&!reduced){addEventListener('scroll',()=>{const r=$('#filme').getBoundingClientRect();if(r.bottom<0||r.top>innerHeight)return;const p=clamp((innerHeight-r.top)/(innerHeight+r.height),0,1);setScene(Math.min(3,Math.floor(p*4)))},{passive:true})}
/* split typography with nested emphasis still available */
if(G&&ST&&!reduced){
 $$('.split-on-scroll').forEach(root=>{
  const walker=document.createTreeWalker(root,NodeFilter.SHOW_TEXT);let texts=[];while(walker.nextNode())texts.push(walker.currentNode);
  texts.forEach(n=>{if(!n.textContent.trim())return;const frag=document.createDocumentFragment();
   (n.textContent.match(/\s+|[^\s]+/g)||[]).forEach(word=>{if(/^\s+$/.test(word)){frag.appendChild(document.createTextNode(word));return}
    const a=document.createElement('span'),b=document.createElement('span');a.className='motion-word';b.textContent=word;a.appendChild(b);frag.appendChild(a)});
   n.replaceWith(frag)
  });
  const wordEls=Array.from(root.querySelectorAll('.motion-word>span'));
  G.fromTo(wordEls,{yPercent:115,opacity:.2},{yPercent:0,opacity:1,duration:1,ease:'power3.out',stagger:.06,scrollTrigger:{trigger:root,start:'top 86%',once:true}})
 });
}
/* lookbook stage */
const track=$('#runwayTrack'),windowEl=$('#runwayWindow'),panels=$$('.ba-runway__panel');let ix=0;
function show(n){if(!track)return;ix=(n+panels.length)%panels.length;const gap=parseFloat(getComputedStyle(track).gap)||20;
 const width=panels[0].getBoundingClientRect().width;track.style.transform='translate3d('+(-ix*(width+gap))+'px,0,0)';
 $('#runwayCount').textContent=String(ix+1).padStart(2,'0')+' / 03';
 panels.forEach((p,j)=>p.setAttribute('aria-hidden',String(j!==ix)));
}
$('#runwayPrev')?.addEventListener('click',()=>show(ix-1));$('#runwayNext')?.addEventListener('click',()=>show(ix+1));
windowEl?.addEventListener('keydown',e=>{if(e.key==='ArrowRight'||e.key==='ArrowLeft'){e.preventDefault();show(ix+(e.key==='ArrowRight'?1:-1))}});
let start=null;windowEl?.addEventListener('pointerdown',e=>start={x:e.clientX,y:e.clientY});
windowEl?.addEventListener('pointerup',e=>{if(!start)return;let dx=e.clientX-start.x,dy=e.clientY-start.y;start=null;if(Math.abs(dx)>65&&Math.abs(dx)>Math.abs(dy)*1.4)show(ix+(dx<0?1:-1))});
addEventListener('resize',()=>show(ix),{passive:true});show(0);
/* accessible choice of style mood */
const moods={dia:['01','Conforto também tem presença.','Peças para acompanhar o dia sem perder o seu jeito.','1515886657613-9f3515b0c78f','Editorial ilustrativo do dia a dia'],
sair:['02','Para sair e se sentir você.','Da primeira conversa ao último detalhe.','1539109136881-3be0616acf4b','Editorial ilustrativo de moda para sair'],
celebrar:['03','Tem ocasião que pede vestido.','Para guardar o momento, sem se preocupar com o que vestir.','1539008835657-9e8e9680c956','Editorial ilustrativo de vestido']};
let swap=0;
$$('[data-occasion]').forEach(btn=>btn.addEventListener('click',()=>{const m=moods[btn.dataset.occasion];if(!m)return;$$('[data-occasion]').forEach(x=>{let a=x===btn;x.classList.toggle('is-active',a);x.setAttribute('aria-pressed',String(a))});
 const visual=$('#planVisual');visual.classList.add('is-changing');clearTimeout(swap);swap=setTimeout(()=>{$('#planImage').src='https://images.unsplash.com/photo-'+m[3]+'?auto=format&fit=crop&w=1100&q=82';$('#planImage').alt=m[4];$('#planNum').textContent=m[0];$('#planHeading').textContent=m[1];$('#planDescription').textContent=m[2];visual.classList.remove('is-changing')},reduced?0:210)}));
if(G&&ST&&!reduced)ST.refresh();
})();