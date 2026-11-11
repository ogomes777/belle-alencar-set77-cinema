import '../styles/runway.css';
import type { Ctx } from '../commerce/ui/context';
import { heart } from '../commerce/ui/icons';
import { RUNWAY_LOOKS, RUNWAY_PRODUCTS, RUNWAY_CARDS_PER_LOOK } from './data';
import { BELLE_APPROVED_LOOK_IMAGES } from './belle-portraits';
import { mountEditorialMedia } from './media';
import { depthAt, railOffset, wrap } from './depth';

export function initRunway(ctx: Ctx): () => void {
  const root = document.getElementById('passarela');
  if (!root) return () => {};
  const stage = root.querySelector<HTMLElement>('.runway__stage')!;
  const line = root.querySelector<HTMLElement>('.runway__line')!;
  const rail = root.querySelector<HTMLElement>('.runway__rail')!;
  const roll = root.querySelector<HTMLElement>('.runway__roll')!;
  const status = root.querySelector<HTMLElement>('.runway__status')!;
  const styling = root.querySelector<HTMLElement>('.runway__styleline')!;
  const ring = root.querySelector<HTMLElement>('.runway__ring')!;
  const abort = new AbortController(), { signal } = abort;
  const calm = matchMedia('(prefers-reduced-motion: reduce)');
  let p = 0, target = 0, raf = 0, last = 0, dirty = true, visible = true, destroyed = false;
  let width = 1, height = 1, base = 1, cardSize = 1, mobile = false;
  let down = false, startX = 0, startY = 0, start = 0, moved = 0, pointer = -1, hitIndex: number | null = null;
  let wheelTimer = 0, mx = 0, my = 0, cx = 0, cy = 0, cursor = false, announced = -1;

  const people = RUNWAY_LOOKS.map((look,i) => {
    const product=look.hero;
    const el=document.createElement('div');el.className='runway__model';el.dataset.look=String(i);el.dataset.productId=product.id;
    const [w,h]=product.cutoutSize ?? [600,900];
    const approvedPortrait=BELLE_APPROVED_LOOK_IMAGES[look.key];
    const pair=product.category==='croppeds' && look.pieces[1].category==='saias';
    if (approvedPortrait) {
      // Real identity-approved editorial photos are supplied per look; never infer the owner's face.
      el.classList.add('runway__model--portrait');
      el.innerHTML=`<img src="${approvedPortrait}" alt="Belle em look ${look.name}" draggable="false">`;
    } else if(pair) {
      // Two genuine demo product cutouts, not a fake model or a simulated try-on photo.
      const bottom=look.pieces[1];
      el.classList.add('runway__model--pair');
      el.innerHTML=`<div class="runway__pair" aria-label="${product.title} e ${bottom.title}, composição demonstrativa">
        <img class="runway__pair-top" src="${product.cutout}" alt="" draggable="false">
        <img class="runway__pair-bottom" src="${bottom.cutout}" alt="" draggable="false">
      </div>`;
    } else {
      el.innerHTML=`<img src="${product.cutout}" alt="${product.title}, recorte demonstrativo" width="${w}" height="${h}" draggable="false">`;
    }
    line.append(el);
    return {el,ratio:(approvedPortrait||pair)?0.67:w/h,product,pair:!!(pair&&!approvedPortrait),portrait:!!approvedPortrait};
  });
  const cards = RUNWAY_PRODUCTS.map((product, i) => {
    const el = document.createElement('article'); el.className = 'runway__card'; el.dataset.product = product.id;
    const look=RUNWAY_LOOKS[Math.floor(i/RUNWAY_CARDS_PER_LOOK)]!;
    const order=i%RUNWAY_CARDS_PER_LOOK+1;
    el.dataset.lookKey=look.key;
    el.setAttribute('aria-label',`Conjunto ${look.name}, peça ${order} de ${RUNWAY_CARDS_PER_LOOK}: ${product.title}`);
    el.innerHTML = `<button class="runway__fav" type="button" aria-label="Favoritar ${product.title}" aria-pressed="false">${heart}</button><button class="runway__shot" type="button" aria-label="Ver ${product.title}"></button><div class="runway__meta"><h3>${product.title}</h3><span>Preço sob consulta</span><button class="runway__add" type="button" aria-label="Escolher tamanho de ${product.title}">+</button></div>`;
    mountEditorialMedia(el.querySelector<HTMLElement>('.runway__shot')!, product);
    el.querySelector('.runway__shot')!.addEventListener('click', () => ctx.openQuickView(product.id, el.querySelector('button.runway__shot')), { signal });
    el.querySelector('.runway__add')!.addEventListener('click', () => ctx.openQuickView(product.id, el.querySelector('button.runway__add')), { signal });
    el.querySelector('.runway__fav')!.addEventListener('click', () => ctx.commerce.toggleWishlist(product.id), { signal });
    rail.append(el);
    el.dataset.slot = String(i);
    return el;
  });
  const syncWish = () => cards.forEach((card,i) => card.querySelector('.runway__fav')!.setAttribute('aria-pressed', String(ctx.commerce.isWished(RUNWAY_PRODUCTS[i]!.id))));
  const unsub = ctx.commerce.subscribe(syncWish); syncWish();
  for (let i=0;i<=6;i++) { const el=document.createElement('b'); el.textContent=String(15+i%6); roll.append(el); }

  function wake() { if (!raf && visible && !document.hidden && !destroyed) { last=performance.now(); raf=requestAnimationFrame(frame); } }
  function size() {
    width=stage.clientWidth; height=stage.clientHeight; base=height*1.2; mobile=innerWidth<=820;
    cardSize=mobile ? Math.max(136,Math.min(160,rail.clientWidth/2.45)) : rail.clientHeight/RUNWAY_CARDS_PER_LOOK;
    people.forEach(m => { m.el.style.width=`${base*m.ratio}px`; m.el.style.height=`${base}px`; });
    cards.forEach(c => { c.style.height=mobile?'100%':`${cardSize}px`; });
    dirty=true; wake();
  }
  function paint() {
    people.forEach((model,i) => {
      const d=depthAt(i,p), category=model.product.category;
      const relative: Record<string,number>={vestidos:1,camisas:.57,croppeds:.35,saias:.58,calcas:.85};
      const h=d.height*height*(model.pair||model.portrait ? 1 : (relative[category] ?? .65)), scale=h/base;
      const modelWidth=h*model.ratio;
      const fitCenter=Math.max(modelWidth/2+12,Math.min(width-modelWidth/2-12,d.x*width));
      const fitWeight=d.depth<0?1-Math.min(1,-d.depth):1;
      const center=d.x*width+(fitCenter-d.x*width)*fitWeight;
      model.el.style.transform=`translate3d(${center-modelWidth/2}px,${d.feet*height-h}px,0) scale(${scale})`;
      model.el.style.filter=d.blur<.2?'none':`blur(${d.blur/scale}px)`;
      model.el.style.opacity=String(d.opacity); model.el.style.zIndex=String(d.z);
    });
    cards.forEach((card,i) => {
      const offset=railOffset(i,p,cardSize);
      card.style.transform=mobile?`translate3d(${offset}px,0,0)`:`translate3d(0,${offset}px,0)`;
      // Only visible cards participate in keyboard navigation and screen-reader order.
      const on=offset>-cardSize+.5 && offset<(mobile?rail.clientWidth:rail.clientHeight)-.5;
      card.inert=!on; card.setAttribute('aria-hidden',String(!on));
    });
    roll.style.transform=`translate3d(0,${-wrap(p,6)*roll.firstElementChild!.getBoundingClientRect().height}px,0)`;
    root!.dataset.position=p.toFixed(4);
    const index=wrap(Math.round(p),RUNWAY_LOOKS.length);
    const currentLook=RUNWAY_LOOKS[index]!;
    styling.textContent=currentLook.styling;
    root!.dataset.currentLook=currentLook.key;
    if (index!==announced && Math.abs(p-target)<.01) {
      announced=index; status.textContent=`Look ${15+index}. ${currentLook.name}, ${currentLook.styling}. Três peças disponíveis para visualizar individualmente.`;
    }
  }
  function frame(now: number) {
    raf=0;
    const dt=Math.min(50,now-last)||16; last=now;
    const before=p;
    p=calm.matches?target:p+(target-p)*(1-Math.exp(-dt*.0072));
    if (Math.abs(target-p)<.0004) p=target;
    if (dirty || before!==p) { paint(); dirty=false; }
    cx+=(mx-cx)*.32; cy+=(my-cy)*.32;
    if (cursor) ring.style.transform=`translate3d(${cx}px,${cy}px,0)`;
    if (p!==target || dirty || (cursor && (Math.abs(mx-cx)+Math.abs(my-cy)>.2))) wake();
  }
  function step(amount: number) { clearTimeout(wheelTimer); target=Math.round(target)+amount; wake(); }
  root.querySelector('[data-runway-prev]')!.addEventListener('click',()=>step(-1),{signal});
  root.querySelector('[data-runway-next]')!.addEventListener('click',()=>step(1),{signal});
  root.querySelector('.runway__shop')!.addEventListener('click',e => ctx.openQuickView(RUNWAY_LOOKS[wrap(Math.round(p),RUNWAY_LOOKS.length)]!.hero.id,e.currentTarget as HTMLElement),{signal});
  stage.addEventListener('keydown',e => {
    if (e.target !== stage) return;
    if (['ArrowRight','ArrowDown','ArrowLeft','ArrowUp'].includes(e.key)) { e.preventDefault(); step(['ArrowRight','ArrowDown'].includes(e.key)?1:-1); }
  },{signal});
  stage.addEventListener('wheel',e => {
    // Keep the landing's vertical scroll native. Shift-wheel / horizontal trackpad walks the runway.
    if (!e.shiftKey && Math.abs(e.deltaX)<=Math.abs(e.deltaY)) return;
    e.preventDefault(); target+=Math.max(-120,Math.min(120,e.deltaX+e.deltaY))/420;
    clearTimeout(wheelTimer); wheelTimer=window.setTimeout(()=>{target=Math.round(target);wake();},150); wake();
  },{passive:false,signal});
  stage.addEventListener('pointerdown',e => {
    if (e.button!==0 || (e.target as HTMLElement).closest('button,a')) return;
    clearTimeout(wheelTimer); down=true; pointer=e.pointerId; startX=e.clientX; startY=e.clientY; start=target; moved=0;
    hitIndex=Number((e.target as HTMLElement).closest<HTMLElement>('[data-look]')?.dataset.look ?? NaN);
    stage.setPointerCapture(pointer); ring.classList.add('is-dragging');
  },{signal});
  stage.addEventListener('pointermove',e => {
    const box=stage.getBoundingClientRect(); mx=e.clientX-box.left; my=e.clientY-box.top;
    if (e.pointerType==='mouse') { cursor=true; ring.classList.add('is-visible'); }
    if (down && e.pointerId===pointer) {
      const dx=e.clientX-startX; moved=Math.max(moved,Math.hypot(dx,e.clientY-startY));
      target=start+dx/Math.max(150,width*.2);
    }
    wake();
  },{signal});
  function release(e: PointerEvent) {
    if (!down || e.pointerId!==pointer) return;
    down=false; ring.classList.remove('is-dragging');
    if (e.type!=='pointercancel' && moved<6 && hitIndex!==null && Number.isFinite(hitIndex)) {
      target=Math.round(target)+wrap(hitIndex-Math.round(target),6);
    } else target=Math.round(target);
    if(stage.hasPointerCapture(pointer))stage.releasePointerCapture(pointer);
    pointer=-1; wake();
  }
  stage.addEventListener('pointerup',release,{signal}); stage.addEventListener('pointercancel',release,{signal});
  stage.addEventListener('lostpointercapture',()=>{ if(down){down=false;target=Math.round(target);ring.classList.remove('is-dragging');wake();} },{signal});
  stage.addEventListener('pointerleave',()=>{cursor=false;ring.classList.remove('is-visible');},{signal});
  calm.addEventListener('change',()=>{dirty=true;wake();},{signal});
  document.addEventListener('visibilitychange',()=>{if(document.hidden){cancelAnimationFrame(raf);raf=0;}else wake();},{signal});
  const ro=typeof ResizeObserver !== 'undefined' ? new ResizeObserver(size) : null; ro?.observe(stage); ro?.observe(rail);
  window.addEventListener('resize',size,{signal});
  document.body.classList.add('is-runway-visible');
  const io=typeof IntersectionObserver !== 'undefined' ? new IntersectionObserver(entries=>{visible=entries.some(e=>e.isIntersecting);document.body.classList.toggle('is-runway-visible',visible);if(visible)wake();else{cancelAnimationFrame(raf);raf=0;} }) : null; io?.observe(root);
  root.dataset.media='products'; // Garments remain demos until Belle identity-approved photo frames exist.
  size(); paint();
  return () => {document.body.classList.remove('is-runway-visible');destroyed=true;abort.abort();unsub();ro?.disconnect();io?.disconnect();cancelAnimationFrame(raf);clearTimeout(wheelTimer);};
}
