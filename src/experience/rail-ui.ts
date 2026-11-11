/**
 * Interação 1:1 com a arara do cômodo Three.js.
 * Nenhuma arara duplicada, nenhuma bolsa fixa falsa: só controles de acesso
 * e uma ficha editorial que preserva câmera e posição na loja.
 */
import type { World } from './world';
import type { Product } from '../commerce/types';
import { commerceApi } from '../commerce/api';
import { createViewer } from '../rack/viewer';
import type { BagWidget } from '../rack/bag';
import '../styles/rack.css';
import '../styles/scene-rail.css';

export interface RoomRailController {
  setActive(on: boolean): void;
  refresh(): void;
}
const reduced = () => matchMedia('(prefers-reduced-motion: reduce)').matches;

export function initRoomRail(stage: HTMLElement, getWorld: () => World | null): RoomRailController {
  const ui = document.createElement('div');
  ui.className = 'roomrail';
  ui.setAttribute('role', 'group');
  ui.setAttribute('aria-label', 'Explorar a arara dentro da boutique');
  ui.innerHTML = \`
    <div class="roomrail__hint">ARRASTE PARA OS LADOS · A ARARA ESTÁ DENTRO DA LOJA</div>
    <div class="roomrail__controls">
      <button type="button" class="roomrail__prev" aria-label="Peça anterior">←</button>
      <span class="roomrail__product" aria-live="polite"></span>
      <button type="button" class="roomrail__next" aria-label="Próxima peça">→</button>
      <button type="button" class="roomrail__inspect">Explorar peça ↗</button>
      <button type="button" class="roomrail__bag" aria-label="Abrir sacola de interesse">Sacola <b>0</b></button>
    </div>\`;
  stage.appendChild(ui);
  const name = ui.querySelector<HTMLElement>('.roomrail__product')!;
  const count = ui.querySelector<HTMLElement>('.roomrail__bag b')!;
  const bagBtn = ui.querySelector<HTMLButtonElement>('.roomrail__bag')!;
  const dummy = document.createElement('button');
  const bag: BagWidget = {
    back: dummy, front: dummy,
    mouth: () => getWorld()?.projectBagMouth() ?? { x: innerWidth/2, y: innerHeight*.72, w: 40 },
    rect: () => new DOMRect(0,0,50,50),
    setCount: n => { count.textContent=String(n); },
    impact: () => { getWorld()?.impactBag(); ui.classList.remove('is-impact'); void ui.offsetWidth; ui.classList.add('is-impact'); },
    place: () => {}, setLayer: () => {}, show: () => {},
  };
  let current: Product | null = null;
  let source: HTMLImageElement | null = null;
  let active = false, opening = false, hoveredRAF = 0, lastHoverX=0, lastHoverY=0;
  let gesture: {x:number;y:number;last:number;id:number;moving:boolean} | null=null;

  const viewer = createViewer({
    bag,
    onClosed: (id) => {
      getWorld()?.hideRackProduct(id,false);
      getWorld()?.selectRack(null);
      source?.remove();source=null;opening=false;
      document.documentElement.classList.remove('scene-rail-viewer');
      ui.querySelector<HTMLButtonElement>('.roomrail__inspect')?.focus({preventScroll:true});
    },
  });

  function refresh(): void {
    const w=getWorld();
    ui.classList.toggle('is-on',active&&!!w);
    if(!w || !active)return;
    const p=w.activeRackProduct();
    if(p){current=p;name.textContent=p.title;}
    bag.setCount(commerceApi()?.count()??0);
  }
  function browse(delta:number): void {
    const w=getWorld();if(!active||!w||opening)return;
    const p=w.browseRack(delta);
    if(p){current=p;name.textContent=p.title;}
  }
  async function inspect(p?:Product): Promise<void> {
    const w=getWorld(),item=p??current??w?.activeRackProduct();
    if(!w||!item||!active||opening)return;
    opening=true;current=item;
    w.selectRack(item.id);name.textContent=item.title;
    if(!reduced())await new Promise<void>(resolve=>setTimeout(resolve,280));
    if(!active||getWorld()!==w){opening=false;return;}
    const box=w.projectRackProduct(item.id);
    if(!box){w.selectRack(null);opening=false;return;}
    source?.remove();
    source=document.createElement('img');
    source.src=item.cutout??'';
    source.alt='';
    source.className='roomrail__source';
    source.style.cssText=\`position:fixed;left:\${box.x}px;top:\${box.y}px;width:\${box.w}px;height:\${box.h}px;opacity:0;pointer-events:none;z-index:0;object-fit:contain\`;
    document.body.appendChild(source);
    document.documentElement.classList.add('scene-rail-viewer');
    viewer.open(item,source,()=>w.hideRackProduct(item.id,true));
  }

  ui.querySelector('.roomrail__prev')!.addEventListener('click',()=>browse(-1));
  ui.querySelector('.roomrail__next')!.addEventListener('click',()=>browse(1));
  ui.querySelector('.roomrail__inspect')!.addEventListener('click',()=>void inspect());
  bagBtn.addEventListener('click',()=>commerceApi()?.openBag(bagBtn));
  commerceApi()?.onChange(()=>bag.setCount(commerceApi()?.count()??0));

  function isUi(e:Event):boolean {return e.target instanceof Element && !!e.target.closest('.roomrail');}
  stage.addEventListener('pointerdown',e=>{
    if(!active||!getWorld()||isUi(e)||(e.pointerType==='mouse'&&e.button!==0)||opening)return;
    gesture={x:e.clientX,y:e.clientY,last:e.clientX,id:e.pointerId,moving:false};
  });
  stage.addEventListener('pointermove',e=>{
    if(!active||!getWorld()||isUi(e))return;
    if(gesture&&gesture.id===e.pointerId){
      const dx=e.clientX-gesture.x,dy=e.clientY-gesture.y;
      if(!gesture.moving&&Math.abs(dx)>12&&Math.abs(dx)>Math.abs(dy)*1.3)gesture.moving=true;
      if(gesture.moving&&Math.abs(e.clientX-gesture.last)>=44){
        browse(e.clientX<gesture.last?1:-1);
        gesture.last=e.clientX;
      }
    } else if(e.pointerType==='mouse'){
      lastHoverX=e.clientX;lastHoverY=e.clientY;
      if(!hoveredRAF)hoveredRAF=requestAnimationFrame(()=>{
        hoveredRAF=0;
        const p=getWorld()?.pickRack(lastHoverX,lastHoverY);
        if(p){current=p;name.textContent=p.title;}
        stage.style.cursor=p?'pointer':'';
      });
    }
  },{passive:true});
  const end=(e:PointerEvent)=>{
    const g=gesture;if(!g||g.id!==e.pointerId)return;
    gesture=null;
    if(g.moving||!active||isUi(e))return;
    const w=getWorld();if(!w)return;
    if(w.bagHit(e.clientX,e.clientY)){commerceApi()?.openBag(bagBtn);return;}
    const p=w.pickRack(e.clientX,e.clientY);
    if(p)void inspect(p);
  };
  stage.addEventListener('pointerup',end);
  stage.addEventListener('pointercancel',()=>{gesture=null;});
  let wheelAccum=0;
  stage.addEventListener('wheel',e=>{
    if(!active||!getWorld()||isUi(e))return;
    if(Math.abs(e.deltaX)>5&&Math.abs(e.deltaX)>Math.abs(e.deltaY)*.8){
      e.preventDefault();wheelAccum+=e.deltaX;
      if(Math.abs(wheelAccum)>48){browse(wheelAccum>0?1:-1);wheelAccum=0;}
    }
  },{passive:false});
  ui.addEventListener('keydown',e=>{
    if(e.key==='ArrowLeft'||e.key==='ArrowRight'){e.preventDefault();browse(e.key==='ArrowLeft'?-1:1);}
  });

  return {
    setActive(on){
      active=on;
      if(!active){gesture=null;stage.style.cursor='';getWorld()?.selectRack(null);}
      refresh();
    },
    refresh,
  };
}
