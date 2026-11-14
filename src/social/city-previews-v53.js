// BELLE V53 recovery: official city directory, without invented media or profile data.
const cities=[
  {id:'araxa',name:'Araxá',uf:'Minas Gerais',profile:'belle.alencar'},
  {id:'frutal',name:'Frutal',uf:'Minas Gerais',profile:'frutal.bellealencar'},
  {id:'catalao',name:'Catalão',uf:'Goiás',profile:'catalao.bellealencar'},
  {id:'mineiros',name:'Mineiros',uf:'Goiás',profile:'bellealencar.mineiros'},
  {id:'ibia',name:'Ibiá',uf:'Minas Gerais',profile:'bellealencar.ibia',noPreviews:true},
  {id:'franca',name:'Franca',uf:'São Paulo',profile:'bellealencar.franca'}
];
const root=document.querySelector('[data-city-previews]');
if(root){
  const $=s=>root.querySelector(s), tabs=[...root.querySelectorAll('[data-pv-city]')];
  const profileURL=city=>'https://www.instagram.com/'+city.profile+'/';
  let active=0,touchX=null,touchY=null,lastWheel=0;
  function show(index,focus=false){
    active=(index+cities.length)%cities.length;
    const city=cities[active],url=profileURL(city);
    $('[data-pv-state]').textContent=city.uf;
    $('[data-pv-name]').textContent=city.name;
    $('[data-pv-handle]').textContent='@'+city.profile;
    $('[data-pv-phone-handle]').textContent=city.profile;
    $('[data-pv-phone-name]').textContent='Belle Alencar · '+city.name;
    $('[data-pv-phone-place]').textContent=city.uf+' · Brasil';
    $('[data-pv-visual-caption]').textContent=city.name+' · Belle Alencar';
    $('[data-pv-note]').textContent=city.noPreviews?'Ibiá: zero previews disponíveis. Para conhecer a unidade, acesse diretamente o Instagram.':'Conheça o perfil desta unidade. Vídeos e publicações são exibidos no Instagram oficial.';
    $('[data-pv-phone-message]').textContent=city.noPreviews?'Sem vídeos nesta prévia. Acesse o Instagram.':'Conteúdo oficial disponível pelo perfil da unidade.';
    const a=$('[data-pv-profile]');a.href=url;a.setAttribute('aria-label','Abrir Instagram Belle '+city.name);
    const reels=$('[data-pv-reels]');reels.hidden=!!city.noPreviews;
    reels.href='https://www.instagram.com/'+city.profile+'/reels/';
    $('[data-pv-counter]').textContent=String(active+1).padStart(2,'0')+' / 06 · deslize para trocar de cidade';
    for(const tab of tabs){const selected=tab.dataset.pvCity===city.id;tab.setAttribute('aria-pressed',String(selected));tab.tabIndex=selected?0:-1;}
    if(focus)tabs[active].focus({preventScroll:true});
  }
  tabs.forEach((tab,index)=>{
    tab.addEventListener('click',()=>show(index));
    tab.addEventListener('keydown',event=>{
      if(!['ArrowLeft','ArrowRight','Home','End'].includes(event.key))return;
      event.preventDefault();
      if(event.key==='Home')show(0,true);
      else if(event.key==='End')show(cities.length-1,true);
      else show(active+(event.key==='ArrowRight'?1:-1),true);
    });
  });
  const stage=$('[data-pv-stage]');
  stage.addEventListener('touchstart',event=>{if(event.touches.length===1){touchX=event.touches[0].clientX;touchY=event.touches[0].clientY;}},{passive:true});
  stage.addEventListener('touchend',event=>{
    if(touchX===null||touchY===null)return;
    const t=event.changedTouches[0],dx=t.clientX-touchX,dy=t.clientY-touchY;
    touchX=touchY=null;
    if(Math.abs(dx)>45&&Math.abs(dx)>Math.abs(dy)*1.25)show(active+(dx<0?1:-1));
  },{passive:true});
  stage.addEventListener('wheel',event=>{
    const now=performance.now();
    if(Math.abs(event.deltaY)<22||now-lastWheel<650)return;
    lastWheel=now;show(active+(event.deltaY>0?1:-1));
  },{passive:true});
  show(0);
}
