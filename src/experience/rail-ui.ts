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
    <div class="roomrail__hint">ARRASTE · ESCOLHA · A CÂMERA CONTINUA NA LOJA</div>
    <div class="roomrail__controls">
      <button type="button" class="roomrail__prev" aria-label="Peça anterior">←</button>
      <span class="roomrail__product" aria-live="polite"></span>
      <button type="button" class="roomrail__next" aria-label="Próxima peça">→</button>
      <button type="button" class="roomrail__inspect">Explorar peça ↗</button>
      <button type="button" class="roomrail__bag" aria-label="Abrir sacola de interesse">Sacola <b>0</b></button>
    </div>
    <section class="roomrail__detail" hidden aria-label="Peça selecionada na arara">
      <p class="roomrail__eyebrow">BELLE ALENCAR · REFERÊNCIA EDITORIAL</p>
      <h3 class="roomrail__title"></h3>
      <p class="roomrail__description">Produto demonstrativo. Preço e estoque sujeitos à confirmação na loja.</p>
      <label class="roomrail__size-label">Tamanho
        <select class="roomrail__size" aria-label="Escolha o tamanho"><option value="">Escolha</option></select>
      </label>
      <div class="roomrail__actions">
        <button type="button" class="roomrail__add">Adicionar à sacola</button>
        <button type="button" class="roomrail__close">Voltar à arara ×</button>
      </div>
      <p class="roomrail__error" role="alert" hidden>Selecione o tamanho primeiro.</p>
    </section>`;
  stage.appendChild(ui);
  const $=<T extends HTMLElement>(q:string)=>ui.querySelector<T>(q)!;
  const name=$<HTMLElement>('.roomrail__product'),count=$<HTMLElement>('.roomrail__bag b');
  const bagBtn=$<HTMLButtonElement>('.roomrail__bag');
  const detail=$<HTMLElement>('.roomrail__detail');
  const title=$<HTMLElement>('.roomrail__title');
  const desc=$<HTMLElement>('.roomrail__description');
  const sizeEl=$<HTMLSelectElement>('.roomrail__size');
  const addBtn=$<HTMLButtonElement>('.roomrail__add');
  const error=$<HTMLElement>('.roomrail__error');
  let active=false,selected:Product|null=null,flight=false,hoverRAF=0,hx=0,hy=0;
  let gesture:{x:number;y:number;last:number;id:number;moving:boolean}|null=null;
  const motion=()=>matchMedia('(prefers-reduced-motion: reduce)').matches;

  function refresh(){
    const world=getWorld();ui.classList.toggle('is-on',active&&!!world);
    if(!active||!world)return;
    const p=world.activeRackProduct();if(p&&!selected)name.textContent=p.title;
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
    const p=w.browseRack(delta);if(p)name.textContent=p.title;
  }
  function inspect(p?:Product){
    const w=getWorld(),item=p??w?.activeRackProduct();if(!w||!item||!active||flight)return;
    selected=item;name.textContent=item.title;title.textContent=item.title;desc.textContent=item.description;
    sizeEl.replaceChildren(new Option('Escolha',''),...item.variants.map(v=>new Option(v.size,v.size)));
    error.hidden=true;detail.hidden=false;
    w.selectRack(item.id);
    if(!motion())detail.animate([{opacity:0,transform:'translateY(10px)'},{opacity:1,transform:'none'}],{duration:250,easing:'ease-out'});
    sizeEl.focus({preventScroll:true});
  }
  async function add(){
    const w=getWorld(),p=selected,api=commerceApi();
    if(!w||!p||!api||flight||isFlying())return;
    const size=sizeEl.value as Size;
    if(!size){error.hidden=false;sizeEl.focus();return;}
    error.hidden=true;
    const city=api.storeCity();
    const start=async()=>{
      const bounds=w.projectRackProduct(p.id);
      if(!bounds||!p.cutout){announce('Esta peça está fora do campo de visão. Selecione outra.');return;}
      flight=true;addBtn.disabled=true;addBtn.setAttribute('aria-busy','true');
      const origin=document.createElement('img');
      origin.src=p.cutout;origin.alt='';origin.className='roomrail__origin';
      origin.style.cssText=`position:fixed;left:${bounds.x}px;top:${bounds.y}px;width:${bounds.w}px;height:${bounds.h}px;opacity:0;pointer-events:none;object-fit:contain;z-index:0`;
      document.body.appendChild(origin);
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
  commerceApi()?.onChange(()=>count.textContent=String(commerceApi()?.count()??0));

  const inUi=(e:Event)=>e.target instanceof Element&&!!e.target.closest('.roomrail');
  stage.addEventListener('pointerdown',e=>{
    if(!active||!getWorld()||inUi(e)||(e.pointerType==='mouse'&&e.button!==0)||flight)return;
    gesture={x:e.clientX,y:e.clientY,last:e.clientX,id:e.pointerId,moving:false};
  });
  stage.addEventListener('pointermove',e=>{
    if(!active||!getWorld()||inUi(e))return;
    if(gesture&&gesture.id===e.pointerId){
      const dx=e.clientX-gesture.x,dy=e.clientY-gesture.y;
      if(!gesture.moving&&Math.abs(dx)>12&&Math.abs(dx)>Math.abs(dy)*1.3)gesture.moving=true;
      if(gesture.moving&&Math.abs(e.clientX-gesture.last)>44){browse(e.clientX<gesture.last?1:-1);gesture.last=e.clientX;}
    } else if(e.pointerType==='mouse'&&!selected){
      hx=e.clientX;hy=e.clientY;
      if(!hoverRAF)hoverRAF=requestAnimationFrame(()=>{
        hoverRAF=0;const p=getWorld()?.pickRack(hx,hy);
        if(p)name.textContent=p.title;
        stage.style.cursor=p?'pointer':'';
      });
    }
  },{passive:true});
  const end=(e:PointerEvent)=>{
    const g=gesture;if(!g||g.id!==e.pointerId)return;gesture=null;
    if(g.moving||!active||inUi(e)||flight)return;
    const w=getWorld();if(!w)return;
    if(w.bagHit(e.clientX,e.clientY)){commerceApi()?.openBag(bagBtn);return;}
    const p=w.pickRack(e.clientX,e.clientY);if(p)inspect(p);
  };
  stage.addEventListener('pointerup',end);
  stage.addEventListener('pointercancel',()=>{gesture=null;});
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
  return {setActive(on){active=on;if(!on){gesture=null;stage.style.cursor='';close();}refresh();},refresh};
}
