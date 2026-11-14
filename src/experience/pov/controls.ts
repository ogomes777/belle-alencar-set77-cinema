/** Belle V58 interactive 360° visit. One WebGL camera, native vertical scroll,
 * canonical category lists (never invent inventory), per-side state.
 */
import type { World } from '../world';
import type { Product, Category, Size } from '../../commerce/types';
import { SHOP_CATEGORIES, CATEGORY_LABEL } from '../../commerce/types';
import { DEMO_CATALOG } from '../../commerce/catalog.demo';
import { commerceApi } from '../../commerce/api';
import { announce } from '../../core/a11y';
import type { VisitDestination } from './walk';
import '../../styles/belle-pov-v58.css';
type Side = -1|1;
type SideState={category:Category|null;selectedId:string|null;page:number};
const PAGE_SIZE=8;
export function filteredProducts(category:Category|null,side:Side=1):Product[]{
  if(category)return DEMO_CATALOG.filter(item=>item.active&&item.category===category);
  // Initial assortment matches the physical rail's stable 15/15 assignment.
  const clothes=DEMO_CATALOG.filter(item=>item.active&&!['bolsas','pulseiras','aneis'].includes(item.category));
  return side===1?clothes.slice(0,15):clothes.slice(15,30);
}
export function categoryPage(items:Product[],page:number,selectedId:string|null=null){
  const selectedIndex=selectedId?items.findIndex(p=>p.id===selectedId):-1;
  const maxPage=Math.max(0,Math.ceil(items.length/PAGE_SIZE)-1);
  const next=selectedIndex>=0?Math.floor(selectedIndex/PAGE_SIZE):Math.min(Math.max(0,page),maxPage);
  return {page:next,totalPages:maxPage+1,visible:items.slice(next*PAGE_SIZE,(next+1)*PAGE_SIZE)};
}
export interface VisitUI{setChapter(id:string):void; exit():void; isActive():boolean;}
export function initBellePOV(stage:HTMLElement,getWorld:()=>World|null,onVisitChange:(active:boolean)=>void=()=>{}):VisitUI{
  const ui=document.createElement('aside');ui.className='belle-pov';
  ui.setAttribute('aria-label','Visita Belle em primeira pessoa');
  ui.innerHTML=`
    <button class="belle-pov__enter" type="button" data-visit-enter>
      <span aria-hidden="true">☞</span> Explorar a loja
    </button>
    <div class="belle-pov__panel" data-visit-panel hidden>
      <header class="belle-pov__head"><strong>BELLE · VISITA 360°</strong>
        <button type="button" data-visit-exit>Retomar o filme ↗</button></header>
      <p class="belle-pov__hint">Arraste para olhar 360°. Role para continuar o filme.</p>
      <nav class="belle-pov__destinations" aria-label="Caminhar na boutique">
        <button data-dest="entrada" type="button">Entrada</button>
        <button data-dest="centro" type="button">Corredor</button>
        <button data-dest="esquerda" type="button">Arara esquerda</button>
        <button data-dest="direita" type="button">Arara direita</button>
        <button data-dest="provador" type="button">Provador</button>
      </nav>
      <div class="belle-pov__look">
        <button type="button" data-look="entrance">Ver a entrada ↶</button>
        <button type="button" data-look="center">Centralizar olhar</button>
        <button type="button" data-look="up" aria-label="Olhar para cima">↑</button>
        <button type="button" data-look="down" aria-label="Olhar para baixo">↓</button>
      </div>
      <div class="belle-pov__sides" role="group" aria-label="Escolher lado da arara">
        <button type="button" data-side="-1">Arara esquerda</button>
        <button type="button" data-side="1">Arara direita</button>
      </div>
      <div class="belle-pov__catalog">
        <label for="belleVisitCategory">Categoria da arara escolhida</label>
        <select id="belleVisitCategory"><option value="">Todas as categorias</option></select>
        <p class="belle-pov__catalog-info" aria-live="polite"></p>
        <div class="belle-pov__products" role="list"></div>
        <button type="button" class="belle-pov__inspect" data-inspect-selected>Ver peça selecionada ↗</button>
        <div class="belle-pov__pages"><button type="button" data-page="-1">Anterior</button><span data-page-status></span><button type="button" data-page="1">Próxima</button></div>
      </div>
      <section class="belle-pov__detail" hidden aria-label="Detalhe da peça">
        <button type="button" data-detail-close>Voltar às peças ×</button>
        <h3 data-detail-title></h3>
        <p data-detail-description></p>
        <p class="belle-pov__demo">Referência demonstrativa · estoque e preço sob consulta.</p>
        <label for="belleVisitSize">Escolha o tamanho</label>
        <select id="belleVisitSize"></select>
        <button type="button" data-add-bag>Adicionar à sacola de interesse</button>
        <button type="button" data-open-bag>Ver sacola</button>
        <p data-detail-error role="alert" aria-live="polite"></p>
      </section>
      <p class="belle-pov__access">Teclado com foco na visita: WASD/setas para andar, Esc para sair. Gestos verticais rolam a página.</p>
    </div>`;
  document.body.appendChild(ui);
  const q=<T extends HTMLElement>(selector:string)=>ui.querySelector<T>(selector)!;
  const enter=q<HTMLButtonElement>('[data-visit-enter]'),exitBtn=q<HTMLButtonElement>('[data-visit-exit]');
  const panel=q<HTMLElement>('[data-visit-panel]'),select=q<HTMLSelectElement>('#belleVisitCategory');
  const list=q<HTMLElement>('.belle-pov__products'),info=q<HTMLElement>('.belle-pov__catalog-info');
  const pages=q<HTMLElement>('[data-page-status]'),detail=q<HTMLElement>('.belle-pov__detail');
  const sizeSelect=q<HTMLSelectElement>('#belleVisitSize'),error=q<HTMLElement>('[data-detail-error]');
  let chapter='vitrine',active=false,currentSide:Side=1, selectedProduct:Product|null=null;
  const states:Record<'left'|'right',SideState>={
    left:{category:null,selectedId:null,page:0},right:{category:null,selectedId:null,page:0}
  };
  const getState=(side:Side)=>side===1?states.right:states.left;
  const current=()=>getState(currentSide);
  const allCategoryOptions=SHOP_CATEGORIES.map(category=>{
    const option=document.createElement('option');option.value=category;
    option.textContent=`${CATEGORY_LABEL[category]} (${filteredProducts(category).length})`;
    return option;
  });
  select.append(...allCategoryOptions);
  const canEnter=()=>chapter==='sala';
  function syncLive(){
    enter.hidden=!canEnter()||active;
    panel.hidden=!active;
    ui.classList.toggle('is-visiting',active);
    ui.classList.toggle('is-in-sala',canEnter());
    document.documentElement.classList.toggle('belle-visiting',active);
    // Keep the stage keyboard-operable without hijacking the native scroll.
    if(active){stage.tabIndex=0;stage.setAttribute('aria-label','Olhar 360 graus pela loja. Arraste ou use os controles.');}
  }
  function viewState(){
    const state=current(),data=filteredProducts(state.category,currentSide);
    const result=categoryPage(data,state.page,state.selectedId);
    state.page=result.page;
    q<HTMLButtonElement>('[data-side="-1"]').setAttribute('aria-pressed',String(currentSide===-1));
    q<HTMLButtonElement>('[data-side="1"]').setAttribute('aria-pressed',String(currentSide===1));
    select.value=state.category??'';
    info.textContent=`${currentSide===1?'Arara direita':'Arara esquerda'} · ${data.length} ${data.length===1?'peça':'peças'}${state.category?' · '+CATEGORY_LABEL[state.category]:''}`;
    pages.textContent=`${result.page+1} / ${result.totalPages}`;
    list.replaceChildren();
    for(const product of result.visible){
      const btn=document.createElement('button');btn.type='button';btn.className='belle-pov__product';btn.dataset.productId=product.id;
      btn.setAttribute('role','listitem');btn.setAttribute('aria-pressed',String(state.selectedId===product.id));
      if(product.cutout){const img=document.createElement('img');img.src=product.cutout;img.loading='lazy';img.alt='';btn.append(img);}
      const name=document.createElement('span');name.textContent=product.title;btn.append(name);list.append(btn);
    }
    if(!data.length)info.textContent+=' · Nenhuma peça nesta categoria';
    q<HTMLButtonElement>('[data-inspect-selected]').disabled=!state.selectedId;
    for(const delta of [-1,1]){
      q<HTMLButtonElement>(`[data-page="${delta}"]`).disabled=delta<0?result.page===0:result.page>=result.totalPages-1;
    }
    getWorld()?.filterVisitSide(currentSide,state.category,state.page,state.selectedId);
    q<HTMLButtonElement>('[data-detail-close]').hidden=detail.hidden;
  }
  function chooseSide(side:Side){
    currentSide=side;detail.hidden=true;
    getWorld()?.destinationVisit(side===1?'direita':'esquerda');
    viewState();
  }
  function selectProduct(product:Product,side:Side,open=false){
    const state=getState(side);currentSide=side;state.category=product.category;
    state.selectedId=product.id;state.page=Math.floor(Math.max(0,filteredProducts(product.category).findIndex(x=>x.id===product.id))/PAGE_SIZE);
    detail.hidden=true;viewState();
    getWorld()?.filterVisitSide(side,state.category,state.page,state.selectedId);
    announce(`${product.title}, ${CATEGORY_LABEL[product.category]}, na arara ${side===1?'direita':'esquerda'}.`);
    if(open)openDetail(product);
  }
  function openDetail(product:Product){
    selectedProduct=product;detail.hidden=false;
    q<HTMLElement>('[data-detail-title]').textContent=product.title;
    q<HTMLElement>('[data-detail-description]').textContent=product.description;
    sizeSelect.replaceChildren(new Option('Escolha um tamanho',''),...product.variants.map(x=>new Option(x.size,x.size)));
    error.textContent='';ui.classList.add('is-detail');q<HTMLButtonElement>('[data-detail-close]').hidden=false;
  }
  function closeDetail(){
    detail.hidden=true;selectedProduct=null;error.textContent='';ui.classList.remove('is-detail');
  }
  function start(){
    if(!canEnter())return;
    active=true;syncLive();onVisitChange(true);
    const world=getWorld();
    if(world){world.enterVisit();world.destinationVisit('centro');}
    viewState();
    exitBtn.focus({preventScroll:true});
    announce('Visita em primeira pessoa. Arraste para olhar. Use os destinos para caminhar.');
  }
  function stop(focus=true){
    if(!active)return;
    active=false;closeDetail();getWorld()?.exitVisit();
    syncLive();onVisitChange(false);if(focus&&canEnter())enter.focus({preventScroll:true});
  }
  enter.addEventListener('click',start);
  exitBtn.addEventListener('click',()=>stop(true));
  q<HTMLButtonElement>('[data-detail-close]').addEventListener('click',closeDetail);
  ui.querySelectorAll<HTMLButtonElement>('[data-dest]').forEach(button=>button.addEventListener('click',()=>{
    const dest=button.dataset.dest as VisitDestination;
    getWorld()?.destinationVisit(dest);announce('Caminhando para '+button.textContent?.trim());
  }));
  ui.querySelectorAll<HTMLButtonElement>('[data-look]').forEach(button=>button.addEventListener('click',()=>{
    const action=button.dataset.look,w=getWorld();if(!w)return;
    if(action==='entrance')w.seeEntrance();
    else if(action==='center')w.resetVisitLook();
    else w.lookVisit(0,action==='up'?.17:-.17);
  }));
  ui.querySelectorAll<HTMLButtonElement>('[data-side]').forEach(button=>button.addEventListener('click',()=>chooseSide(Number(button.dataset.side) as Side)));
  select.addEventListener('change',()=>{
    const state=current();state.category=(select.value||null) as Category|null;state.selectedId=null;state.page=0;closeDetail();viewState();
  });
  ui.querySelectorAll<HTMLButtonElement>('[data-page]').forEach(button=>button.addEventListener('click',()=>{
    const state=current();state.selectedId=null;state.page+=Number(button.dataset.page);closeDetail();viewState();
  }));
  list.addEventListener('click',event=>{
    const target=(event.target as HTMLElement).closest<HTMLButtonElement>('[data-product-id]');
    if(!target)return;
    const product=filteredProducts(current().category,currentSide).find(p=>p.id===target.dataset.productId);
    if(product)selectProduct(product,currentSide,false);
  });
  q<HTMLButtonElement>('[data-inspect-selected]').addEventListener('click',()=>{
    const p=DEMO_CATALOG.find(item=>item.id===current().selectedId&&item.active);
    if(p)openDetail(p);
  });
  q<HTMLButtonElement>('[data-add-bag]').addEventListener('click',()=>{
    const item=selectedProduct,api=commerceApi();if(!item||!api)return;
    if(!sizeSelect.value){error.textContent='Selecione um tamanho.';sizeSelect.focus();return;}
    const add=()=>{const result=api.add(item.id,sizeSelect.value as Size);error.textContent=result.ok?'Peça adicionada à sacola.':result.reason??'Não foi possível adicionar.';if(result.ok)announce(item.title+' adicionada à sacola.');};
    if(!api.hasStore())api.ensureStore(q<HTMLButtonElement>('[data-add-bag]'),add);else add();
  });
  q<HTMLButtonElement>('[data-open-bag]').addEventListener('click',()=>commerceApi()?.openBag(q<HTMLButtonElement>('[data-open-bag]')));
  let gesture:{id:number;x:number;y:number;lastX:number;dragging:boolean}|null=null,suppress=false;
  stage.style.touchAction='pan-y pinch-zoom';
  stage.addEventListener('pointerdown',e=>{
    if(!active||!(e.target instanceof Element)||e.target.closest('button,a,input,select,[role="button"]')||(!getWorld()))return;
    if(e.pointerType==='mouse'&&e.button!==0)return;
    if(gesture){gesture=null;return;}
    gesture={id:e.pointerId,x:e.clientX,y:e.clientY,lastX:e.clientX,dragging:false};
  },{passive:true});
  stage.addEventListener('pointermove',e=>{
    if(!active||!gesture||e.pointerId!==gesture.id)return;
    const dx=e.clientX-gesture.x,dy=e.clientY-gesture.y;
    if(!gesture.dragging && Math.abs(dx)>12 && Math.abs(dx)>Math.abs(dy)*1.25){
      gesture.dragging=true;try{stage.setPointerCapture(e.pointerId);}catch{}
    }
    if(gesture.dragging){
      getWorld()?.lookVisit(-(e.clientX-gesture.lastX)/Math.max(280,stage.clientWidth)*4.8);
      gesture.lastX=e.clientX;
    }
  },{passive:true});
  const endGesture=(e:PointerEvent)=>{
    if(!gesture||e.pointerId!==gesture.id)return;
    const wasDrag=gesture.dragging;
    gesture=null;if(wasDrag){suppress=true;window.setTimeout(()=>suppress=false,80);}
  };
  stage.addEventListener('pointerup',endGesture);
  stage.addEventListener('pointercancel',endGesture);
  stage.addEventListener('lostpointercapture',endGesture);
  stage.addEventListener('click',event=>{
    if(!active||suppress||gesture||!(event.target instanceof Element)||event.target.closest('button,a'))return;
    const w=getWorld(),product=w?.pickRack(event.clientX,event.clientY);
    if(product&&w)selectProduct(product,w.visitLastSide(),false);
  });
  document.addEventListener('keydown',event=>{
    if(!active)return;
    if(event.key==='Escape'){if(!detail.hidden)closeDetail();else stop(true);return;}
    if(!stage.contains(document.activeElement)&&!ui.contains(document.activeElement))return;
    if(document.activeElement instanceof HTMLInputElement||document.activeElement instanceof HTMLSelectElement)return;
    if(getWorld()?.keyVisit(event.key,true))event.preventDefault();
  });
  document.addEventListener('keyup',event=>{if(active)getWorld()?.keyVisit(event.key,false);});
  window.addEventListener('blur',()=>{if(active)for(const key of ['w','a','s','d','ArrowUp','ArrowDown','ArrowLeft','ArrowRight'])getWorld()?.keyVisit(key,false);});
  syncLive();
  return {setChapter(id){chapter=id;if(id!=='sala')stop(false);syncLive();},exit:()=>stop(false),isActive:()=>active};
}

