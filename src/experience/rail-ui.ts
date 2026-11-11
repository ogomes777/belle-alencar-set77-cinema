/** Controles mínimos sobre UMA arara 3D, dentro da boutique. Nenhuma ficha em tela cheia. */
import type { World } from './world';
import type { Product, Size } from '../commerce/types';
import { commerceApi } from '../commerce/api';
import { announce } from '../core/a11y';
import { flyToBag, isFlying } from '../rack/flight';
import '../styles/rack.css';
import '../styles/scene-rail.css';

export interface RoomRailController {setActive(on:boolean):void;refresh():void;}
export function initRoomRail(stage:HTMLElement,getWorld:()=>World|null):RoomRailController {
  const ui=document.createElement('div');ui.className='roomrail';ui.setAttribute('role','group');
  ui.setAttribute('aria-label','Arara interativa dentro da boutique Belle');
  ui.innerHTML=`
    <div class="roomrail__hint"><span>03 / BOUTIQUE · ARARA VIVA</span><span class="roomrail__scroll">ROLE PARA CONTINUAR <span aria-hidden="true">↓</span></span></div>
    <div class="roomrail__controls">
      <button type="button" class="roomrail__prev" aria-label="Peça anterior">←</button>
      <span class="roomrail__name"><span class="roomrail__product" aria-live="polite"></span><span class="roomrail__counter" aria-label="Posição na arara">05 / 30</span></span>
      <button type="button" class="roomrail__next" aria-label="Próxima peça">→</button>
      <button type="button" class="roomrail__inspect">Explorar peça ↗</button>
      <button type="button" class="roomrail__bag" aria-label="Abrir sacola de interesse">Sacola <b>0</b></button>
    </div>
    <div class="roomrail__gesture">
      <span>ARRASTE NA LOJA PARA OLHAR AO REDOR <span aria-hidden="true">·</span> NAS ROUPAS PARA PERCORRER</span>
      <button type="button" class="roomrail__switch" aria-label="Olhar para a outra parede da boutique">OUTRA PAREDE ↔</button>
    </div>
    <section class="roomrail__detail" hidden aria-label="Peça selecionada na arara">
      <p class="roomrail__eyebrow">BELLE ALENCAR · REFERÊNCIA EDITORIAL</p>
      <h3 class="roomrail__title"></h3>
      <p class="roomrail__description">Produto demonstrativo. Preço e estoque sujeitos à confirmação na loja.</p>
      <label class="roomrail__size-label">Tamanho
        <select class="roomrail__size" aria-label="Escolha o tamanho"><option value="">Escolha</option></select>
        <span class="roomrail__size-options" role="group" aria-label="Tamanhos disponíveis"></span>
      </label>
      <div class="roomrail__actions">
        <button type="button" class="roomrail__add">Adicionar à sacola</button>
        <button type="button" class="roomrail__close">Voltar à arara ×</button>
      </div>
      <p class="roomrail__error" role="alert" hidden>Selecione o tamanho primeiro.</p>
    </section>`;
  // Portal: the narration is painted above the WebGL stage. Mounting this HUD
  // on the document layer prevents chapter cards from stealing touch/clicks.
  // Stage pointer handlers remain on the original canvas container.
  document.body.appendChild(ui);
  const $=<T extends HTMLElement>(q:string)=>ui.querySelector<T>(q)!;
  const name=$<HTMLElement>('.roomrail__product'),count=$<HTMLElement>('.roomrail__bag b');
  const posLabel=$<HTMLElement>('.roomrail__counter');
  const bagBtn=$<HTMLButtonElement>('.roomrail__bag');
  const detail=$<HTMLElement>('.roomrail__detail');
  const title=$<HTMLElement>('.roomrail__title');
  const desc=$<HTMLElement>('.roomrail__description');
  const sizeEl=$<HTMLSelectElement>('.roomrail__size');
  const sizes=$<HTMLElement>('.roomrail__size-options');
  const addBtn=$<HTMLButtonElement>('.roomrail__add');
  const error=$<HTMLElement>('.roomrail__error');
  let active=false,selected:Product|null=null,flight=false,hoverRAF=0,hx=0,hy=0;
  let gesture:{x:number;y:number;last:number;id:number;moving:boolean;mode:'rail'|'orbit'}|null=null;
  const motion=()=>matchMedia('(prefers-reduced-motion: reduce)').matches;
  function syncSizeChoices():void{
    sizes.querySelectorAll<HTMLButtonElement>('button[data-size]').forEach(b=>{
      b.setAttribute('aria-pressed',String(b.dataset.size===sizeEl.value));
    });
    error.hidden=true;
  }
  sizeEl.addEventListener('change',syncSizeChoices);
  sizes.addEventListener('click',event=>{
    const target=(event.target as HTMLElement).closest<HTMLButtonElement>('button[data-size]');
    if(!target)return;
    sizeEl.value=target.dataset.size??'';
    sizeEl.dispatchEvent(new Event('change',{bubbles:true}));
  });
  function paintProduct(p:Product|null){
    if(p && name.textContent!==p.title){
      name.textContent=p.title;
      if(!motion())name.animate([{opacity:.45,transform:'translateY(4px)'},{opacity:1,transform:'translateY(0)'}],{duration:210,easing:'ease-out'});
    }
    const position=getWorld()?.railPosition();
    if(position)posLabel.textContent=String(position.index).padStart(2,'0')+' / '+String(position.total).padStart(2,'0');
  }

  function refresh(){
    const world=getWorld();ui.classList.toggle('is-on',active&&!!world);
    if(!active||!world)return;
    const p=world.activeRackProduct();if(p&&!selected)paintProduct(p);
    count.textContent=String(commerceApi()?.count()??0);
  }
  function close(){
    if(flight)return;
    detail.hidden=true;
    selected=null;
    getWorld()?.selectRack(null);
    refresh();
  }
  function browse(delta:number){
    const w=getWorld();if(!active||!w||flight)return;
    if(selected)close();
    const p=w.browseRack(delta);paintProduct(p);
  }
  function inspect(p?:Product){
    const w=getWorld(),item=p??w?.activeRackProduct();if(!w||!item||!active||flight)return;
    selected=item;paintProduct(item);title.textContent=item.title;desc.textContent=item.description;
    sizeEl.replaceChildren(new Option('Escolha',''),...item.variants.map(v=>new Option(v.size,v.size)));
    sizes.replaceChildren(...item.variants.map(v=>{
      const button=document.createElement('button');
      button.type='button';button.className='roomrail__size-choice';
      button.dataset.size=v.size;button.textContent=v.size;
      button.setAttribute('aria-label','Tamanho '+v.size);
      button.setAttribute('aria-pressed','false');
      return button;
    }));
    syncSizeChoices();
    error.hidden=true;detail.hidden=false;
    w.selectRack(item.id);
    if(!motion())detail.animate([{opacity:0,transform:'translateY(10px)'},{opacity:1,transform:'none'}],{duration:250,easing:'ease-out'});
    (sizes.querySelector<HTMLButtonElement>('button[data-size]')??sizeEl).focus({preventScroll:true});
  }
  async function add(){
    const w=getWorld(),p=selected,api=commerceApi();
    if(!w||!p||!api||flight||isFlying())return;
    const size=sizeEl.value as Size;
    if(!size){error.hidden=false;(sizes.querySelector<HTMLButtonElement>('button[data-size]')??sizeEl).focus();return;}
    error.hidden=true;
    const start=async()=>{
      const city=api.storeCity();
      if(!p.cutout){announce('Imagem desta peça indisponível.');return;}
      flight=true;addBtn.disabled=true;addBtn.setAttribute('aria-busy','true');
      w.prepareRackPurchase(p.id);
      // For fast rail scrubs, let the physical camera catch the selected garment.
      // The real piece stays in the room and the selected image leaves from it.
      await new Promise<void>(resolve=>setTimeout(resolve,motion()?80:480));
      if(!active||getWorld()!==w){flight=false;addBtn.disabled=false;addBtn.removeAttribute('aria-busy');return;}
      const physical=w.projectRackProduct(p.id);
      const viewportOk=physical&&physical.x+physical.w>8&&physical.x<innerWidth-8
        &&physical.y+physical.h>8&&physical.y<innerHeight-8;
      const anchor=name.getBoundingClientRect();
      const bounds=viewportOk?physical:{
        x:anchor.left+anchor.width*.35,y:anchor.top-44,
        w:Math.max(40,Math.min(100,anchor.width*.55)),h:Math.max(72,Math.min(148,anchor.height*5))
      };
      const origin=document.createElement('img');
      origin.src=p.cutout;origin.alt='';origin.className='roomrail__origin';
      origin.style.cssText=`position:fixed;left:${bounds.x}px;top:${bounds.y}px;width:${bounds.w}px;height:${bounds.h}px;opacity:0;pointer-events:none;object-fit:contain;z-index:0`;
      document.body.appendChild(origin);
      // Keep the original garment on the rail until the exact alpha image is decoded.
      try{await origin.decode();}catch{/* The flight helper retains the reduced-motion fallback. */}
      w.hideRackProduct(p.id,true);
      try{
        await flyToBag({
          from:origin,image:p.cutout,productId:p.id,
          target:{mouth:()=>w.projectBagMouth(),ghostZ:72,impact:()=>{w.impactBag();ui.classList.remove('is-impact');void ui.offsetWidth;ui.classList.add('is-impact');}},
          onImpact:()=>{
            if(api.storeCity()!==city){announce('Sua loja mudou. Confirme a peça novamente.');return;}
            const result=api.add(p.id,size);
            if(result.ok)announce(`${p.title}, tamanho ${size}, adicionado à sacola.`);
            count.textContent=String(api.count());
          },
        });
      } finally {
        origin.remove();w.hideRackProduct(p.id,false);
        addBtn.disabled=false;addBtn.removeAttribute('aria-busy');flight=false;close();
      }
    };
    if(!api.hasStore()){announce('Selecione a unidade Belle para continuar.');api.ensureStore(addBtn,()=>void start());}
    else await start();
  }
  $('.roomrail__prev').addEventListener('click',()=>browse(-1));
  $('.roomrail__next').addEventListener('click',()=>browse(1));
  $('.roomrail__inspect').addEventListener('click',()=>inspect());
  $('.roomrail__close').addEventListener('click',close);
  addBtn.addEventListener('click',()=>void add());
  bagBtn.addEventListener('click',()=>commerceApi()?.openBag(bagBtn));
  $('.roomrail__switch').addEventListener('click',()=>{
    if(!active)return;
    getWorld()?.lookAcrossRail();
    announce('Vista da parede oposta. Arraste no cômodo para continuar explorando.');
  });
  commerceApi()?.onChange(()=>count.textContent=String(commerceApi()?.count()??0));

  const inUi=(e:Event)=>e.target instanceof Element&&!!e.target.closest('.roomrail');
  stage.addEventListener('pointerdown',e=>{
    if(!active||!getWorld()||inUi(e)||(e.pointerType==='mouse'&&e.button!==0)||flight)return;
    const hit=getWorld()?.hoverRack(e.clientX,e.clientY);
    gesture={x:e.clientX,y:e.clientY,last:e.clientX,id:e.pointerId,
      moving:false,mode:hit?'rail':'orbit'};
  });
  stage.addEventListener('pointermove',e=>{
    const w=getWorld();if(!active||!w)return;
    const r=stage.getBoundingClientRect();
    if(!inUi(e))w.setRailPointer(((e.clientX-r.left)/Math.max(1,r.width))*2-1);
    if(inUi(e))return;
    if(gesture&&gesture.id===e.pointerId){
      const dx=e.clientX-gesture.x,dy=e.clientY-gesture.y;
      if(!gesture.moving&&Math.abs(dx)>11&&Math.abs(dx)>Math.abs(dy)*1.2){
        gesture.moving=true;
        try{stage.setPointerCapture(e.pointerId);}catch{/* Capturing is not supported on every touch browser. */}
      }
      if(gesture.moving){
        const travelled=e.clientX-gesture.last;
        if(gesture.mode==='orbit'){
          w.orbitRail(travelled/Math.max(320,r.width));
          gesture.last=e.clientX;
        } else {
          const steps=Math.min(4,Math.floor(Math.abs(travelled)/34));
          if(steps>0){
            for(let i=0;i<steps;i++)browse(travelled<0?1:-1);
            gesture.last+=Math.sign(travelled)*steps*34;
          }
        }
      }
    } else if(e.pointerType==='mouse'&&!selected&&!flight){
      hx=e.clientX;hy=e.clientY;
      if(!hoverRAF)hoverRAF=requestAnimationFrame(()=>{
        hoverRAF=0;
        const p=getWorld()?.hoverRack(hx,hy);
        stage.style.cursor=p?'pointer':'';
      });
    }
  },{passive:true});

  // Narrative cards sit over the canvas. Horizontal drags beginning on their
  // non-interactive typography must still rotate the camera. We listen in
  // capture phase rather than changing the card's pointer-events or trapping
  // the browser's normal VERTICAL scrolling.
  let overCard:{id:number;startX:number;startY:number;lastX:number;moving:boolean}|null=null;
  const filmRoot=stage.closest('#filme');
  document.addEventListener('pointerdown',e=>{
    if(!active||flight||!getWorld()||!filmRoot)return;
    if(!(e.target instanceof Element)||!filmRoot.contains(e.target)||stage.contains(e.target))return;
    if(e.target.closest('.roomrail,a,button,input,select,textarea,[role="button"]'))return;
    const rect=stage.getBoundingClientRect();
    if(e.clientY<rect.top||e.clientY>rect.bottom)return;
    overCard={id:e.pointerId,startX:e.clientX,startY:e.clientY,lastX:e.clientX,moving:false};
  },{capture:true,passive:true});
  document.addEventListener('pointermove',e=>{
    const g=overCard;if(!g||g.id!==e.pointerId||!active)return;
    const dx=e.clientX-g.startX,dy=e.clientY-g.startY;
    if(!g.moving&&Math.abs(dx)>11&&Math.abs(dx)>Math.abs(dy)*1.2)g.moving=true;
    if(!g.moving)return;
    const step=e.clientX-g.lastX;
    if(Math.abs(step)>0)getWorld()?.orbitRail(step/Math.max(320,stage.getBoundingClientRect().width));
    g.lastX=e.clientX;
  },{passive:true});
  document.addEventListener('pointerup',e=>{
    if(overCard?.id===e.pointerId)overCard=null;
  },{passive:true});
  document.addEventListener('pointercancel',e=>{
    if(overCard?.id===e.pointerId)overCard=null;
  },{passive:true});

  stage.addEventListener('pointerleave',()=>{getWorld()?.setRailPointer(null);stage.style.cursor='';});
  const end=(e:PointerEvent)=>{
    const g=gesture;if(!g||g.id!==e.pointerId)return;gesture=null;
    if(stage.hasPointerCapture(e.pointerId))stage.releasePointerCapture(e.pointerId);
    if(g.moving||!active||inUi(e)||flight)return;
    const w=getWorld();if(!w)return;
    if(w.bagHit(e.clientX,e.clientY)){commerceApi()?.openBag(bagBtn);return;}
    const p=w.pickRack(e.clientX,e.clientY);if(p)inspect(p);
  };
  stage.addEventListener('pointerup',end);
  stage.addEventListener('pointercancel',()=>{gesture=null;getWorld()?.setRailPointer(null);});
  let wheel=0;
  stage.addEventListener('wheel',e=>{
    if(!active||!getWorld()||inUi(e))return;
    if(Math.abs(e.deltaX)>5&&Math.abs(e.deltaX)>Math.abs(e.deltaY)*.8){
      e.preventDefault();wheel+=e.deltaX;
      if(Math.abs(wheel)>48){browse(wheel>0?1:-1);wheel=0;}
    }
  },{passive:false});
  ui.addEventListener('keydown',e=>{
    if(e.key==='ArrowLeft'||e.key==='ArrowRight'){e.preventDefault();browse(e.key==='ArrowLeft'?-1:1);}
    if(e.key==='Escape'&&!detail.hidden){e.preventDefault();close();}
  });
  return {setActive(on){active=on;if(!on){gesture=null;stage.style.cursor='';getWorld()?.setRailPointer(null);close();}refresh();},refresh};
}
