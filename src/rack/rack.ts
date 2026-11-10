/**
 * ARARA VIVA — gramática de interação da referência (docs/RAIL_PHYSICS, BEAT_BY_BEAT M003–M010)
 * com identidade Belle. Vestidos independentes em cabides de latão:
 * - foco tipo "dock": a peça sob o cursor cresce ~1,5×, vizinhas abrem espaço, a peça fica sob o cursor;
 * - molas por peça (posição/escala) → atraso e assentamento naturais;
 * - pêndulo no gancho excitado pela aceleração do próprio cabide, pelo roçar do cursor e por rajadas;
 * - drag 1:1 + inércia + snap no item central; trackpad horizontal; teclado; toque; vitrine automática.
 * Estado único da arara; render só quando a camada está ativa e visível.
 */
import { DEMO_CATALOG } from '../commerce/catalog.demo';
import { commerceApi } from '../commerce/api';
import type { Product } from '../commerce/types';
import { createBag, type BagWidget } from './bag';
import { createViewer, type Viewer } from './viewer';
import '../styles/rack.css';

interface Piece {
  p: Product;
  i: number;
  el: HTMLButtonElement;
  img: HTMLImageElement;
  shadow: HTMLElement;
  x: number; vx: number; s: number; vs: number; y: number; vy: number;
  theta: number; omega: number; prevVx: number;
  width: number; height: number; padTop: number; body: number; bodyV: number; hem: number; hemV: number;
  g: number; // magnificação atual (0..1)
  nextGust: number;
  enterAt: number; entered: boolean;
}

export interface RackController {
  setActive(on: boolean): void;
  isActive(): boolean;
  bag: BagWidget;
  /** para QA */
  debug(): { focus: string | null; offset: number; scales: number[]; phase: string };
}

const SPREAD = 0.62; // afastamento extra por unidade de magnificação (em larguras de slot)
const MAG = 0.5; // ganho de escala da peça focada (referência ≈ 1,4–1,6×)
const reduce = () => matchMedia('(prefers-reduced-motion: reduce)').matches;

export function initRack(stage: HTMLElement, card: HTMLElement | null): RackController {
  // Only apparel belongs on hangers; every one of the 30 garments is reachable.
  const products=DEMO_CATALOG.filter(p=>p.cutout&&p.active&&['camisas','croppeds','vestidos','saias','calcas'].includes(p.category));
  const layer = document.createElement('div');
  layer.className = 'rack';
  layer.id = 'arara-viva';
  layer.setAttribute('role', 'region');
  layer.setAttribute('aria-label', 'Arara viva: passe o cursor, arraste para os lados ou use as setas; Enter abre a ficha');
  layer.innerHTML = `
    <div class="rack__room" aria-hidden="true"><div class="rack__track"></div></div>
    <div class="rack__frame" aria-hidden="true"><i class="rack__bar"></i><i class="rack__post rack__post--l"></i><i class="rack__post rack__post--r"></i><i class="rack__base"></i></div>
    <ul class="rack__items" role="list"></ul>
    <p class="rack__label" aria-hidden="true"><b></b><span>Clique para explorar · editorial demonstrativo</span></p>
    <p class="rack__hint" aria-hidden="true"><i></i>Passe o cursor · arraste · clique</p>`;
  stage.appendChild(layer);
  const list = layer.querySelector('ul')!;
  const label = layer.querySelector<HTMLElement>('.rack__label')!;
  const labelName = label.querySelector('b')!;
  const frameEl = layer.querySelector<HTMLElement>('.rack__frame')!;
  const track = layer.querySelector<HTMLElement>('.rack__track')!;

  const pieces: Piece[] = products.map((p, i) => {
    const li = document.createElement('li');
    const el = document.createElement('button');
    el.type = 'button';
    el.className = 'rack__piece';
    el.tabIndex = i === Math.floor(products.length / 2) ? 0 : -1;
    el.dataset.id = p.id;
    el.setAttribute('aria-label', `${p.title}. Packshot sintético demonstrativo. Abrir ficha`);
    const clips = p.category === 'saias' || p.category === 'calcas';
    const hanger = `<svg viewBox="0 0 100 40" aria-hidden="true"><path d="M50 17v-4c0-4 7-3 7-8 0-6-10-6-10 0"/><path d="${clips ? 'M50 17v6M10 25h80M15 24v10m70-10v10' : 'M50 17 8 35q42 5 84 0L50 17'}"/></svg>`;
    el.innerHTML = `<span class="rack__shadow" aria-hidden="true"></span><span class="rack__hanger">${hanger}</span><span class="rack__cloth"><img src="${p.cutout}" alt="" draggable="false" decoding="async"><span class="rack__hem" style="background-image:url('${p.cutout}')"></span></span>`;
    li.appendChild(el);
    list.appendChild(li);
    return {
      p, i, el, img: el.querySelector('img')!, shadow: el.querySelector<HTMLElement>('.rack__shadow')!,
      x: 0, vx: 0, s: 1, vs: 0, y: 0, vy: 0, theta: 0, omega: 0, prevVx: 0, width:0, height:0, padTop:0, body:0, bodyV:0, hem:0, hemV:0, g: 0,
      nextGust: 0, enterAt: 0, entered: false,
    };
  });

  // ---------- estado ----------
  let active = false;
  let raf = 0;
  let last = 0;
  let geo = { w: 0, h: 0, railL: 0, railR: 0, railY: 0, bw: 0, pw: 0, ph: 0, floorY: 0, mobile: false };
  let offset = 0;
  let offsetV = 0;
  let offsetTarget: number | null = null;
  let fx: number | null = null; // foco (x no espaço da camada)
  let pointerX: number | null = null;
  let pointerY = 0;
  let pointerVx = 0;
  let lastInput = 0;
  let touchFocusUntil = 0;
  let kbIndex = -1;
  let keyboardRequest = 0;
  let drag: { x0: number; y0: number; off0: number; lastX: number; lastT: number; v: number; dragging: boolean; id: number } | null = null;
  let phase = 'rack-idle';
  let viewerFor: Piece | null = null;
  let introDone = false;
  let attract = 0;

  const bag = createBag((trigger) => {
    if(viewerFor)void viewer.close(()=>commerceApi()?.openBag(trigger));
    else commerceApi()?.openBag(trigger);
  });
  const syncCount = () => bag.setCount(commerceApi()?.count() ?? 0);
  syncCount();
  commerceApi()?.onChange(syncCount);
  const viewer: Viewer = createViewer({
    bag,
    onClosed: (id) => {
      const pc = pieces.find((x) => x.p.id === id);
      phase = 'rack-return';
      if (pc) {
        pc.el.classList.remove('is-hidden');
        pc.omega += reduce() ? 0 : 1.25; // retorno: balanço amortecido (ref. 2,27–2,50 s)
        fx = pc.x;
        touchFocusUntil = performance.now() + 1600;
        pc.el.focus({ preventScroll: true });
      }
      viewerFor = null;
      bag.setLayer('scene');
      kick();
    },
  });

  // ---------- geometria ----------
  function measure(): void {
    const r = layer.getBoundingClientRect();
    const centerIndex = geo.bw > 0 ? (offset + (geo.railR - geo.railL) / 2) / geo.bw : pieces.length / 2;
    const w = r.width;
    const h = r.height;
    if (w < 100 || h < 100) return;
    const mobile = w < 900;
    if (mobile) {
      const cardTop = card ? Math.min(h, card.getBoundingClientRect().top - r.top) : h * 0.6;
      const railY = Math.max(78, h * 0.12);
      const avail = Math.max(160, Math.min(h * 0.62, cardTop - railY - 28));
      const visible = 4.6;
      const railL = 14;
      const railR = w - 14;
      const bw = (railR - railL) / visible;
      const ph = Math.min(avail / 1.45, bw * 3.2);
      geo = { w, h, railL, railR, railY, bw, pw: ph * 0.6, ph, floorY: railY + ph * 1.5, mobile };
    } else {
      const cardR = card ? card.getBoundingClientRect().right - r.left : w * 0.32;
      const railL = Math.min(w * .64, Math.max(w * 0.36, cardR + 48));
      const railR = w - Math.max(90, w * 0.06);
      const railY = Math.max(120, h * 0.24);
      // densidade da referência: cabides quase encostados, peças se sobrepondo levemente
      const visible = Math.max(6, Math.min(9.5, (railR - railL) / 88));
      const bw = (railR - railL) / visible;
      const ph = Math.max(110, Math.min(bw * 3.35, (h - railY - 70) / 1.6));
      geo = { w, h, railL, railR, railY, bw, pw: ph * 0.6, ph, floorY: railY + ph * 1.55, mobile };
    }
    const content = pieces.length * geo.bw;
    const railW = geo.railR - geo.railL;
    offset = introDone ? centerIndex * geo.bw - railW / 2 : (content - railW) / 2;
    offsetTarget = null; offsetV = 0;
    offset = clampOffset(offset);
    // moldura de latão e trilho de luz
    frameEl.style.left = `${geo.railL - geo.bw * 0.25}px`;
    frameEl.style.width = `${railW + geo.bw * 0.5}px`;
    frameEl.style.top = `${geo.railY}px`;
    frameEl.style.height = `${geo.floorY - geo.railY}px`;
    track.style.left = `${geo.railL - geo.bw * 0.4}px`;
    track.style.width = `${railW + geo.bw * 0.8}px`;
    pieces.forEach((pc) => {
      const relative = { vestidos: 1, camisas: .57, croppeds: .35, saias: .58, calcas: .85 }[pc.p.category as 'vestidos'] ?? .7;
      const dims = pc.p.cutoutSize ?? [720,1200];
      pc.height = geo.ph * relative;
      pc.width = pc.height * dims[0] / dims[1];
      pc.padTop = pc.height * (pc.p.cutoutBounds?.[1] ?? 30) / dims[1];
      pc.el.style.width = `${pc.width}px`;
      pc.el.style.height = `${pc.height}px`;
      pc.el.style.transformOrigin = `50% ${pc.padTop - 28}px`;
      pc.el.style.setProperty('--hanger-top', `${pc.padTop - 28}px`);
    });
    list.style.clipPath = `inset(0 ${Math.max(0,w-geo.railR-geo.bw*.35)}px 0 ${Math.max(0,geo.railL-geo.bw*.35)}px)`;
    placeBag();
  }
  function clampOffset(o: number): number {
    const max = Math.max(0, pieces.length * geo.bw - (geo.railR - geo.railL));
    return Math.max(-geo.bw * 0.15, Math.min(max + geo.bw * 0.15, o));
  }
  function baseX(i: number): number {
    return geo.railL + geo.bw * (i + 0.5) - offset;
  }
  function placeBag(): void {
    const r = layer.getBoundingClientRect();
    const size = geo.mobile ? 76 : Math.max(96, Math.min(132, geo.bw * 1.25));
    let x: number;
    let y: number;
    if (viewerFor) {
      const vr = viewer.bagAnchor(size);
      x = vr.x;
      y = vr.y;
    } else if (geo.mobile) {
      x = r.left + geo.w - size - 12;
      y = r.top + Math.min(geo.floorY, geo.h - size) - size * 0.95;
    } else {
      x = r.left + geo.railL - geo.bw * 0.25 - size * 0.62;
      y = r.top + geo.floorY - size * 0.96;
    }
    bag.place(x, y, size);
  }

  // ---------- loop ----------
  function kick(): void {
    if (!raf && active && !document.hidden) {
      last = performance.now();
      raf = requestAnimationFrame(loop);
    }
  }
  function loop(now: number): void {
    raf = 0;
    if (!active || document.hidden) return;
    const dt = Math.min(0.05, (now - last) / 1000 || 1 / 60);
    last = now;
    step(now, dt);
    raf = requestAnimationFrame(loop);
  }

  function step(now: number, dt: number): void {
    const railW = geo.railR - geo.railL;
    const calm = reduce();
    // The reference responds to a gesture; it does not autoplay through the garments.
    if (pointerX !== null && !drag) {
      fx = pointerX;
    } else if (kbIndex >= 0 && pieces[kbIndex]) {
      fx = baseX(kbIndex);
    } else if (now > touchFocusUntil && !viewerFor) {
      fx = null;
    }

    // inércia/snap da arara
    if (!drag) {
      if (pointerX !== null && !geo.mobile) {
        // perto das pontas, a arara desliza sozinha para revelar mais peças
        const edge = railW * 0.11;
        if (pointerX < geo.railL + edge) offsetV = Math.min(offsetV, -380 * (1 - (pointerX - geo.railL) / edge));
        else if (pointerX > geo.railR - edge) offsetV = Math.max(offsetV, 380 * (1 - (geo.railR - pointerX) / edge));
      }
      if (offsetTarget !== null) {
        offsetV += ((offsetTarget - offset) * 120 - offsetV * 22) * dt;
        if (Math.abs(offsetTarget - offset) < 0.4 && Math.abs(offsetV) < 4) { offset = offsetTarget; offsetTarget = null; offsetV = 0; }
      } else {
        offsetV *= Math.exp(-dt * 3.4);
        if (Math.abs(offsetV) < 26 && phase === 'rack-momentum') {
          phase = 'rack-settle';
          const mid = offset + railW / 2;
          offsetTarget = clampOffset(Math.round((mid - geo.bw / 2) / geo.bw) * geo.bw + geo.bw / 2 - railW / 2);
        }
      }
      offset = clampOffset(offset + offsetV * dt);
      if (phase === 'rack-settle' && offsetTarget === null) phase = 'rack-idle';
    }

    // magnificação tipo dock + afastamento preservando a peça sob o foco
    const sig = geo.bw * (geo.mobile ? 0.9 : 1.08);
    const c0 = pieces.map((pc) => baseX(pc.i));
    const gT = c0.map((c) => (fx === null ? 0 : Math.exp(-(((c - fx) / sig) ** 2))));
    let L = 0;
    if (fx !== null) for (let j = 0; j < pieces.length; j++) L += gT[j]! / (1 + Math.exp(-(fx - c0[j]!) / (geo.bw * 0.32)));
    let cum = 0;
    let best = -1;
    let bestG = 0.3;
    for (let i = 0; i < pieces.length; i++) {
      const pc = pieces[i]!;
      const g = gT[i]!;
      const tx = c0[i]! + geo.bw * SPREAD * (cum + g / 2 - L);
      cum += g;
      const ts = 1 + MAG * g;
      // entrada em cascata: cabides pousam do centro para os lados (~75 ms entre pares)
      if (!pc.entered) {
        if (now < pc.enterAt) { pc.el.style.opacity = '0'; pc.x = tx; continue; }
        pc.entered = true;
        pc.el.style.opacity = '';
        pc.y = -geo.ph * 0.06;
        pc.omega += calm ? 0 : (pc.i % 2 ? 1 : -1) * 0.9;
        pc.x = tx;
      }
      // molas (ligeiramente subamortecidas → assentamento com 1–2% de overshoot)
      const ks = 210;
      const cs = 24;
      pc.vx += ((tx - pc.x) * ks - pc.vx * cs) * dt;
      pc.x += pc.vx * dt;
      pc.vs += ((ts - pc.s) * 180 - pc.vs * 20) * dt;
      pc.s += pc.vs * dt;
      pc.vy += ((0 - pc.y) * 160 - pc.vy * 16) * dt;
      pc.y += pc.vy * dt;
      pc.g += (g - pc.g) * Math.min(1, dt * 10);
      if (calm) { pc.x=tx;pc.s=ts;pc.y=0;pc.theta=0;pc.omega=0;pc.body=0;pc.bodyV=0;pc.hem=0;pc.hemV=0; }
      // pêndulo: aceleração do gancho + roçar do cursor + rajadas irregulares
      if (!calm) {
        const ax = (pc.vx - pc.prevVx) / dt;
        pc.prevVx = pc.vx;
        // em tela, rotação + leva a barra para a esquerda: acelerar → barra atrasa → torque ∝ +ax
        let torque = ax * 0.00042;
        if (pointerX !== null && Math.abs(pointerVx) > 30) {
          const d = Math.abs(pointerX - pc.x) / (geo.pw * pc.s * 0.5);
          const inBody = pointerY > geo.railY && pointerY < geo.railY + geo.ph * pc.s;
          if (d < 1 && inBody) torque -= pointerVx * 0.0011 * (1 - d); // o cursor empurra a saia
        }
        if (now > pc.nextGust) {
          pc.nextGust = now + 3000 + Math.random() * 2600;
          pc.omega += (Math.random() - 0.5) * 0.16;
        }
        const k = 30; // ~0,9 Hz
        const c = 1.7; // ζ ≈ 0,15: 2–3 oscilações visíveis
        pc.omega += (torque - k * pc.theta - c * pc.omega) * dt;
        pc.theta = Math.max(-0.38, Math.min(0.38, pc.theta + pc.omega * dt));
      }
      pc.bodyV += ((pc.theta * .38 - pc.body) * 75 - pc.bodyV * 13) * dt;
      pc.body += pc.bodyV * dt;
      pc.hemV += ((pc.body * .7 - pc.hem) * 58 - pc.hemV * 11) * dt;
      pc.hem += pc.hemV * dt;
      if (g > bestG) { bestG = g; best = i; }
    }

    // render: transform com origem no gancho; z pela magnificação
    for (const pc of pieces) {
      const left = pc.x - pc.width / 2;
      const top = geo.railY + 28 - pc.padTop + pc.y;
      pc.el.style.transform = `translate3d(${left.toFixed(1)}px, ${top.toFixed(1)}px, 0) rotate(${pc.theta.toFixed(4)}rad) scale(${pc.s.toFixed(4)})`;
      pc.el.style.zIndex = String(10 + Math.round(pc.g * 40));
      pc.el.style.setProperty('--g', pc.g.toFixed(3));
      pc.el.style.setProperty('--body-sway', `${pc.body.toFixed(5)}rad`);
      pc.el.style.setProperty('--hem-sway', `${pc.hem.toFixed(5)}rad`);
      pc.el.classList.toggle('is-focus', pieces.indexOf(pc) === best);
    }
    // etiqueta sob a peça em foco
    const focus = best >= 0 ? pieces[best]! : null;
    if (focus && !viewerFor) {
      labelName.textContent = focus.p.title;
      const ly = Math.min(geo.railY + (focus.height - focus.padTop) * focus.s + 42, geo.mobile ? geo.floorY - 4 : geo.h - 60);
      const lx = Math.max(geo.mobile ? 120 : 160, Math.min(geo.w - (geo.mobile ? 120 : 160), focus.x));
      label.style.setProperty('--label-y', `${ly.toFixed(1)}px`);
      label.style.transform = `translate3d(${lx.toFixed(1)}px, ${ly.toFixed(1)}px, 0) translateX(-50%)`;
      label.classList.add('is-on');
    } else label.classList.remove('is-on');
    if (!viewerFor) placeBag();
  }

  // ---------- entrada ----------
  function intro(): void {
    const now = performance.now();
    const mid = (pieces.length - 1) / 2;
    pieces.forEach((pc) => {
      pc.entered = false;
      pc.enterAt = now + 120 + Math.abs(pc.i - mid) * 75;
    });
    lastInput = now;
    introDone = true;
  }

  // ---------- gestos ----------
  const local = (e: PointerEvent | WheelEvent) => {
    const r = layer.getBoundingClientRect();
    return { x: e.clientX - r.left, y: e.clientY - r.top };
  };
  const inBand = (x: number, y: number) =>
    y > geo.railY - 40 && y < geo.floorY + 30 && x > geo.railL - geo.bw * 0.6 && x < geo.railR + geo.bw * 0.6;

  layer.addEventListener('pointermove', (e) => {
    const { x, y } = local(e);
    lastInput = performance.now();
    attract = 0;
    if (drag && e.pointerId === drag.id) {
      const dx = x - drag.x0;
      const dy = y - drag.y0;
      if (!drag.dragging && Math.abs(dx) > 6 && Math.abs(dx) > Math.abs(dy) * 1.2) {
        drag.dragging = true;
        phase = 'rack-drag';
        offsetTarget = null;
        try { layer.setPointerCapture(e.pointerId); } catch { /* ponteiro já liberado */ }
        layer.classList.add('is-dragging');
      }
      if (drag.dragging) {
        offset = clampOffset(drag.off0 - dx); // 1:1 sob o dedo
        const t = performance.now();
        const v = (x - drag.lastX) / Math.max(1, t - drag.lastT) * 1000;
        drag.v = drag.v * 0.6 + v * 0.4;
        drag.lastX = x;
        drag.lastT = t;
        fx = x;
      }
    }
    if (e.pointerType === 'mouse') {
      if (pointerX !== null) pointerVx = pointerVx * 0.5 + ((x - pointerX) / 0.016) * 0.5;
      pointerX = inBand(x, y) ? x : null;
      pointerY = y;
    }
    kick();
  });
  layer.addEventListener('pointerleave', () => { pointerX = null; });
  layer.addEventListener('pointerdown', (e) => {
    const { x, y } = local(e);
    if (!inBand(x, y)) return;
    lastInput = performance.now();
    drag = { x0: x, y0: y, off0: offset, lastX: x, lastT: performance.now(), v: 0, dragging: false, id: e.pointerId };
    offsetV = 0;
    phase = 'piece-anticipate';
  });
  const endDrag = (e: PointerEvent) => {
    if (!drag || e.pointerId !== drag.id) return;
    if (drag.dragging) {
      offsetV = -drag.v; // impulso transferido
      phase = 'rack-momentum';
      suppressClick = performance.now() + 60;
    } else phase = 'rack-idle';
    layer.classList.remove('is-dragging');
    drag = null;
  };
  let suppressClick = 0;
  layer.addEventListener('pointerup', endDrag);
  layer.addEventListener('pointercancel', endDrag);
  layer.addEventListener('wheel', (e) => {
    if (Math.abs(e.deltaX) <= Math.abs(e.deltaY)) return; // rolagem vertical segue para a página
    e.preventDefault();
    lastInput = performance.now();
    offsetTarget = null;
    offset = clampOffset(offset + e.deltaX);
    offsetV = e.deltaX * 8;
    phase = 'rack-momentum';
    kick();
  }, { passive: false });

  // clique / toque / teclado
  pieces.forEach((pc) => {
    pc.el.addEventListener('click', (e) => {
      if (performance.now() < suppressClick) return;
      const touch = (e as PointerEvent).pointerType === 'touch' || matchMedia('(pointer: coarse)').matches;
      const isFocus = pc.el.classList.contains('is-focus') && pc.g > 0.55;
      if (touch && !isFocus) {
        // 1º toque traz a peça para frente; 2º abre a ficha
        fx = pc.x;
        touchFocusUntil = performance.now() + 4000;
        lastInput = performance.now();
        pc.omega += 0.5;
        kick();
        return;
      }
      openPiece(pc);
    });
    pc.el.addEventListener('focus', () => {
      kbIndex = pc.i; pointerX = null;
      pieces.forEach((x) => (x.el.tabIndex = x === pc ? 0 : -1));
      ensureVisible(pc.i);
      lastInput = performance.now();
      kick();
    });
    pc.el.addEventListener('blur', () => { if (kbIndex === pc.i) kbIndex = -1; });
    pc.el.addEventListener('keydown', (e) => {
      const k = e.key;
      if (k === 'Enter' || k === ' ') { e.preventDefault(); openPiece(pc); return; }
      let n = -1;
      const currentIndex = kbIndex >= 0 ? kbIndex : pc.i;
      if (k === 'ArrowRight') n = Math.min(pieces.length - 1, currentIndex + 1);
      else if (k === 'ArrowLeft') n = Math.max(0, currentIndex - 1);
      else if (k === 'Home') n = 0;
      else if (k === 'End') n = pieces.length - 1;
      if (n >= 0) {
        e.preventDefault();
        pieces[n]!.omega += (n > pc.i ? -1 : 1) * 0.35;
        kbIndex=n;pointerX=null;ensureVisible(n);kick();
        const request=++keyboardRequest, start=performance.now();
        const focusWhenVisible=()=>{
          if(request!==keyboardRequest||!active||viewerFor)return;
          pieces[n]!.el.focus({preventScroll:true});
          if(document.activeElement!==pieces[n]!.el&&performance.now()-start<2000)requestAnimationFrame(focusWhenVisible);
        };
        focusWhenVisible();
      }
    });
  });
  function ensureVisible(i: number): void {
    const railW = geo.railR - geo.railL;
    const c = geo.bw * (i + 0.5);
    if (c - offset < geo.bw * 1.2 || c - offset > railW - geo.bw * 1.2) offsetTarget = clampOffset(c - railW / 2);
  }
  function openPiece(pc: Piece): void {
    if (viewerFor) return;
    phase = 'detail-opening';
    viewerFor = pc;
    bag.setLayer('overlay');
    viewer.open(pc.p, pc.img, () => pc.el.classList.add('is-hidden'));
    placeBag();
  }

  // ---------- ciclo de vida ----------
  addEventListener('resize', () => { if (active) { measure(); kick(); } }, { passive: true });
  const layoutObserver = new ResizeObserver(() => { if (active) { measure(); kick(); } });
  layoutObserver.observe(layer); if(card)layoutObserver.observe(card);
  document.addEventListener('visibilitychange', () => { if (!document.hidden) kick(); });

  return {
    bag,
    isActive: () => active,
    setActive(on) {
      if (on === active) return;
      active = on;
      layer.classList.toggle('is-on', on);
      bag.show(on || !!viewerFor);
      if (on) {
        measure();
        if (!introDone) intro();
        kick();
      } else {
        cancelAnimationFrame(raf);
        raf = 0;
        pointerX = null;
      }
    },
    debug: () => ({
      focus: pieces.find((x) => x.el.classList.contains('is-focus'))?.p.id ?? null,
      offset: Math.round(offset),
      scales: pieces.map((x) => Math.round(x.s * 100) / 100),
      phase,
    }),
  };
}
