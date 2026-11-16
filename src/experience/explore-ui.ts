/**
 * HUD do hero POV 360: "Explorar a loja" (mão), olhar/andar/destinos,
 * "Retomar o filme", araras vivas por categoria (paginação, seletor,
 * ficha com tamanho, "Ver peça" e voo até a sacola). Montada no body para
 * ficar acima do palco WebGL; nunca intercepta a rolagem vertical nativa.
 */
import type { World } from './world';
import type { PickHit } from './scene/boutique';
import type { ChapterId } from './story';
import { HERO_SLOT, RAIL, SHELF, type DestinationId, type Side } from './scene/layout';
import { initialSide, openCategory, planSide, reconcile, selectProduct, setPage, type SideState } from './rack-state';
import { DEMO_CATALOG } from '../commerce/catalog.demo';
import { CATEGORY_LABEL, SHOP_CATEGORIES, type Category, type Product, type Size } from '../commerce/types';
import { commerceApi } from '../commerce/api';
import { announce } from '../core/a11y';
import { flyToBag, isFlying } from '../rack/flight';
import '../styles/rack.css';
import '../styles/pov.css';

export interface PovController {
  setChapter(id: ChapterId, live: boolean): void;
  refresh(): void;
  exitExplore(): void;
  exploring(): boolean;
}

const IN_STORE: ChapterId[] = ['sala', 'vestido', 'detalhe', 'categorias', 'provador'];
const DESTS: { id: DestinationId; label: string }[] = [
  { id: 'entrada', label: 'Entrada' }, { id: 'corredor', label: 'Corredor' },
  { id: 'araraEsquerda', label: 'Arara esquerda' }, { id: 'araraDireita', label: 'Arara direita' },
  { id: 'fundo', label: 'Fundo da loja' }, { id: 'provador', label: 'Provador' },
];
const HAND = '<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="M9 11V4.5a1.5 1.5 0 0 1 3 0V11m0-4.5a1.5 1.5 0 0 1 3 0V12m0-3.5a1.5 1.5 0 0 1 3 0V15a6 6 0 0 1-6 6h-1.2a6 6 0 0 1-5-2.7L3.3 14a1.5 1.5 0 0 1 2.5-1.6L9 15.5"/></svg>';

export function initPovUi(stage: HTMLElement, getWorld: () => World | null): PovController {
  const ui = document.createElement('div');
  ui.className = 'pov';
  ui.setAttribute('role', 'group');
  ui.setAttribute('aria-label', 'Visita à boutique Belle Alencar');
  ui.innerHTML = `
    <button type="button" class="pov__enter">${HAND}<span>Explorar a loja</span></button>
    <div class="pov__top">
      <span class="pov__hint pov__hint--film">Arraste para olhar as araras · toque numa peça · role para continuar o filme</span>
      <span class="pov__hint pov__hint--explore">Arraste para olhar em 360° · role para continuar o filme</span>
      <button type="button" class="pov__resume">Retomar o filme</button>
    </div>
    <div class="pov__sides" role="group" aria-label="Olhar para">
      <button type="button" data-side-look="-1">Arara esquerda</button>
      <button type="button" data-side-look="0" aria-pressed="true">Centro</button>
      <button type="button" data-side-look="1">Arara direita</button>
    </div>
    <nav class="pov__go" aria-label="Ir para um ponto da loja">
      ${DESTS.map((d) => `<button type="button" data-go="${d.id}">${d.label}</button>`).join('')}
      <span class="pov__sep" aria-hidden="true"></span>
      <button type="button" class="pov__entrance">Ver a entrada</button>
      <button type="button" class="pov__center">Centralizar visão</button>
    </nav>
    <div class="pov__look" role="application" aria-label="Olhar: arraste para girar e inclinar. Setas do teclado giram e inclinam.">
      <button type="button" data-look="up" aria-label="Olhar para cima">▲</button>
      <button type="button" data-look="left" aria-label="Girar para a esquerda">◀</button>
      <i class="pov__look-core" aria-hidden="true"></i>
      <button type="button" data-look="right" aria-label="Girar para a direita">▶</button>
      <button type="button" data-look="down" aria-label="Olhar para baixo">▼</button>
    </div>
    <section class="pov__rack" hidden aria-label="Arara ativa">
      <header class="pov__rack-head">
        <div><b class="pov__cat"></b><span class="pov__count"></span></div>
        <button type="button" class="pov__all">Todas as categorias</button>
      </header>
      <div class="pov__cats" role="group" aria-label="Trocar categoria nesta arara">
        ${SHOP_CATEGORIES.map((c) => `<button type="button" data-pov-cat="${c}" aria-pressed="false">${CATEGORY_LABEL[c]}</button>`).join('')}
      </div>
      <div class="pov__pager">
        <button type="button" class="pov__prev" aria-label="Página anterior">←</button>
        <span class="pov__page" aria-live="polite"></span>
        <button type="button" class="pov__next" aria-label="Próxima página">→</button>
      </div>
      <ol class="pov__list" aria-label="Peças nesta página"></ol>
      <p class="pov__empty" hidden>Nenhuma peça nesta categoria.</p>
      <div class="pov__product" hidden>
        <p class="pov__eyebrow">REFERÊNCIA VISUAL · CONSULTE SUA UNIDADE</p>
        <h3 class="pov__title"></h3>
        <p class="pov__desc"></p>
        <div class="pov__sizes" role="group" aria-label="Tamanhos disponíveis"></div>
        <div class="pov__actions">
          <button type="button" class="pov__view">Ver detalhes da peça</button>
          <button type="button" class="pov__add">Adicionar à sacola</button>
          <button type="button" class="pov__close" aria-label="Fechar ficha">×</button>
        </div>
        <p class="pov__error" role="alert" hidden>Selecione o tamanho primeiro.</p>
      </div>
      <button type="button" class="pov__bag" aria-label="Abrir sacola de interesse">Sacola <b>0</b></button>
    </section>`;
  document.body.appendChild(ui);
  const $ = <T extends HTMLElement>(q: string) => ui.querySelector<T>(q)!;
  const enterBtn = $<HTMLButtonElement>('.pov__enter');
  const resumeBtn = $<HTMLButtonElement>('.pov__resume');
  const rackPanel = $<HTMLElement>('.pov__rack');
  const catLabel = $<HTMLElement>('.pov__cat');
  const countLabel = $<HTMLElement>('.pov__count');
  const pageLabel = $<HTMLElement>('.pov__page');
  const list = $<HTMLOListElement>('.pov__list');
  const emptyMsg = $<HTMLElement>('.pov__empty');
  const productBox = $<HTMLElement>('.pov__product');
  const title = $<HTMLElement>('.pov__title');
  const desc = $<HTMLElement>('.pov__desc');
  const sizes = $<HTMLElement>('.pov__sizes');
  const addBtn = $<HTMLButtonElement>('.pov__add');
  const viewBtn = $<HTMLButtonElement>('.pov__view');
  const errorMsg = $<HTMLElement>('.pov__error');
  const bagBtn = $<HTMLButtonElement>('.pov__bag');
  const bagCount = $<HTMLElement>('.pov__bag b');
  const motion = () => matchMedia('(prefers-reduced-motion: reduce)').matches;

  let chapter: ChapterId = 'vitrine';
  let live = false;
  let flight = false;
  let selected: Product | null = null;
  let activeSide: Side | null = null;
  let size: Size | '' = '';
  const sides: Record<Side, SideState> = { left: initialSide(), right: initialSide() };
  const cap = (side: Side) => ({ hangers: side === 'right' ? RAIL.slots - 1 : RAIL.slots, shelf: SHELF.slots });
  void HERO_SLOT;

  const inStore = () => IN_STORE.includes(chapter);
  const exploring = () => !!getWorld()?.exploring();

  function applySide(side: Side): void {
    const w = getWorld();
    if (!w) return;
    sides[side] = reconcile(sides[side], DEMO_CATALOG);
    w.applyPlan(side, planSide(DEMO_CATALOG, side, sides[side], cap(side)));
  }
  function applyAll(): void { applySide('left'); applySide('right'); }

  function paintMode(): void {
    const on = live && inStore();
    const ex = on && exploring();
    ui.classList.toggle('is-on', on);
    ui.classList.toggle('is-exploring', ex);
    ui.classList.toggle('is-film', on && !ex);
    ui.classList.toggle('is-sala', on && !ex && chapter === 'sala');
    enterBtn.hidden = !on || ex;
    document.documentElement.classList.toggle('pov-exploring', ex);
    stage.setAttribute('tabindex', on ? '0' : '-1');
    if (!ex) {
      const look = getWorld()?.sideLookValue() ?? 0;
      ui.querySelectorAll<HTMLButtonElement>('[data-side-look]').forEach((b) => {
        const v = Number(b.dataset.sideLook);
        b.setAttribute('aria-pressed', String(Math.abs(look - v) < 0.5));
      });
    }
  }

  function paintRack(): void {
    const side = activeSide;
    if (!side) { rackPanel.hidden = true; return; }
    const plan = planSide(DEMO_CATALOG, side, sides[side], cap(side));
    rackPanel.hidden = false;
    rackPanel.dataset.side = side;
    const sideName = side === 'left' ? 'Arara esquerda' : 'Arara direita';
    catLabel.textContent = plan.category ? CATEGORY_LABEL[plan.category] : 'Seleção da arara';
    countLabel.textContent = `${sideName} · ${plan.total} ${plan.total === 1 ? 'peça' : 'peças'}`;
    pageLabel.textContent = `Página ${plan.page + 1} de ${plan.pages}`;
    ui.classList.toggle('has-pages', plan.pages > 1);
    $<HTMLButtonElement>('.pov__prev').disabled = plan.page === 0;
    $<HTMLButtonElement>('.pov__next').disabled = plan.page >= plan.pages - 1;
    ui.querySelectorAll<HTMLButtonElement>('[data-pov-cat]').forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.povCat === plan.category)));
    emptyMsg.hidden = plan.total > 0;
    const visible = [...plan.hangers, ...plan.shelf].filter((p): p is Product => !!p);
    list.replaceChildren(...visible.map((p, i) => {
      const li = document.createElement('li');
      const b = document.createElement('button');
      b.type = 'button';
      b.dataset.product = p.id;
      b.setAttribute('aria-pressed', String(p.id === plan.selectedId));
      b.innerHTML = `<span>${String(plan.page * plan.pageSize + i + 1).padStart(2, '0')}</span>${p.title}`;
      li.appendChild(b);
      return li;
    }));
    if (selected) {
      productBox.hidden = false;
      title.textContent = selected.title;
      desc.textContent = selected.description;
      sizes.replaceChildren(...selected.variants.map((v) => {
        const b = document.createElement('button');
        b.type = 'button'; b.dataset.size = v.size; b.textContent = v.size;
        b.setAttribute('aria-label', 'Tamanho ' + v.size);
        b.setAttribute('aria-pressed', String(v.size === size));
        return b;
      }));
    } else productBox.hidden = true;
    bagCount.textContent = String(commerceApi()?.count() ?? 0);
  }

  function select(hit: PickHit | null, face = true): void {
    const w = getWorld();
    if (!w || !hit) return;
    const side = hit.side;
    sides[side] = selectProduct(sides[side], hit.product, DEMO_CATALOG, cap(side));
    activeSide = side;
    selected = hit.product;
    size = '';
    errorMsg.hidden = true;
    applySide(side);
    w.selectRack(hit.product.id);
    if (face && !w.exploring()) w.faceSide(side);
    paintRack();
    announce(`${hit.product.title}. ${CATEGORY_LABEL[hit.product.category]} completa na ${side === 'left' ? 'arara esquerda' : 'arara direita'}.`);
    if (!motion()) productBox.animate([{ opacity: 0, transform: 'translateY(8px)' }, { opacity: 1, transform: 'none' }], { duration: 220, easing: 'ease-out' });
  }
  function closeProduct(): void {
    if (flight) return;
    selected = null;
    size = '';
    getWorld()?.selectRack(null);
    paintRack();
  }

  async function add(): Promise<void> {
    const w = getWorld(), p = selected, api = commerceApi();
    if (!w || !p || !api || flight || isFlying()) return;
    if (!size) { errorMsg.hidden = false; (sizes.querySelector<HTMLButtonElement>('button[data-size]') ?? addBtn).focus(); return; }
    errorMsg.hidden = true;
    const chosen = size;
    const start = async () => {
      const city = api.storeCity();
      if (!p.cutout) { announce('Imagem desta peça indisponível.'); return; }
      flight = true; addBtn.disabled = true; addBtn.setAttribute('aria-busy', 'true');
      await new Promise<void>((resolve) => setTimeout(resolve, motion() ? 80 : 360));
      if (getWorld() !== w) { flight = false; addBtn.disabled = false; addBtn.removeAttribute('aria-busy'); return; }
      const physical = w.projectRackProduct(p.id);
      const viewportOk = physical && physical.x + physical.w > 8 && physical.x < innerWidth - 8 && physical.y + physical.h > 8 && physical.y < innerHeight - 8;
      const anchor = title.getBoundingClientRect();
      const bounds = viewportOk ? physical : { x: anchor.left + anchor.width * .35, y: anchor.top - 44, w: Math.max(40, Math.min(100, anchor.width * .55)), h: Math.max(72, Math.min(148, anchor.height * 5)) };
      const origin = document.createElement('img');
      origin.src = p.cutout; origin.alt = ''; origin.className = 'pov__origin';
      origin.style.cssText = `position:fixed;left:${bounds.x}px;top:${bounds.y}px;width:${bounds.w}px;height:${bounds.h}px;opacity:0;pointer-events:none;object-fit:contain;z-index:0`;
      document.body.appendChild(origin);
      try { await origin.decode(); } catch { /* fallback estático do voo */ }
      w.hideRackProduct(p.id, true);
      try {
        await flyToBag({
          from: origin, image: p.cutout, productId: p.id,
          target: { mouth: () => w.projectBagMouth(), ghostZ: 72, impact: () => { w.impactBag(); bagBtn.classList.remove('is-impact'); void bagBtn.offsetWidth; bagBtn.classList.add('is-impact'); } },
          onImpact: () => {
            if (api.storeCity() !== city) { announce('Sua loja mudou. Confirme a peça novamente.'); return; }
            const result = api.add(p.id, chosen);
            if (result.ok) announce(`${p.title}, tamanho ${chosen}, adicionado à sacola.`);
            bagCount.textContent = String(api.count());
          },
        });
      } finally {
        origin.remove(); w.hideRackProduct(p.id, false);
        addBtn.disabled = false; addBtn.removeAttribute('aria-busy'); flight = false;
      }
    };
    if (!api.hasStore()) { announce('Selecione a unidade Belle para continuar.'); api.ensureStore(addBtn, () => void start()); }
    else await start();
  }

  // ---------- botões ----------
  enterBtn.addEventListener('click', () => {
    const w = getWorld(); if (!w) return;
    w.enterExplore(); paintMode();
    announce('Visita livre. Arraste para olhar em 360°, use os destinos para andar e Esc ou Retomar o filme para voltar.');
    stage.focus({ preventScroll: true });
  });
  const exitExplore = () => {
    const w = getWorld(); if (!w || !w.exploring()) return;
    w.exitExplore(); paintMode();
    announce('Filme retomado.');
  };
  resumeBtn.addEventListener('click', () => { exitExplore(); enterBtn.focus({ preventScroll: true }); });
  ui.querySelectorAll<HTMLButtonElement>('[data-side-look]').forEach((b) => b.addEventListener('click', () => {
    getWorld()?.setSideLook(Number(b.dataset.sideLook) as -1 | 0 | 1);
    ui.querySelectorAll<HTMLButtonElement>('[data-side-look]').forEach((x) => x.setAttribute('aria-pressed', String(x === b)));
    announce(b.textContent ?? '');
  }));
  ui.querySelectorAll<HTMLButtonElement>('[data-go]').forEach((b) => b.addEventListener('click', () => {
    getWorld()?.goTo(b.dataset.go as DestinationId);
    announce(`Indo para ${b.textContent}.`);
  }));
  $('.pov__entrance').addEventListener('click', () => { getWorld()?.lookEntrance(); announce('Olhando para a entrada.'); });
  $('.pov__center').addEventListener('click', () => { getWorld()?.lookCenter(); announce('Visão centralizada.'); });
  ui.querySelectorAll<HTMLButtonElement>('[data-look]').forEach((b) => b.addEventListener('click', () => {
    const w = getWorld(); if (!w) return;
    const d = b.dataset.look;
    if (d === 'left') w.lookDelta(-0.11, 0); else if (d === 'right') w.lookDelta(0.11, 0);
    else if (d === 'up') w.lookDelta(0, -0.1); else w.lookDelta(0, 0.1);
  }));
  $('.pov__all').addEventListener('click', () => {
    if (!activeSide) return;
    sides[activeSide] = openCategory(sides[activeSide], null, DEMO_CATALOG);
    selected = null; getWorld()?.selectRack(null); applySide(activeSide); paintRack();
    announce('Seleção inicial da arara.');
  });
  ui.querySelectorAll<HTMLButtonElement>('[data-pov-cat]').forEach((b) => b.addEventListener('click', () => {
    if (!activeSide) return;
    const category = b.dataset.povCat as Category;
    sides[activeSide] = openCategory(sides[activeSide], category, DEMO_CATALOG);
    if (selected && selected.category !== category) { selected = null; getWorld()?.selectRack(null); }
    applySide(activeSide); paintRack();
    const n = planSide(DEMO_CATALOG, activeSide, sides[activeSide], cap(activeSide)).total;
    announce(n ? `${CATEGORY_LABEL[category]}: ${n} peças na arara.` : 'Nenhuma peça nesta categoria.');
  }));
  $('.pov__prev').addEventListener('click', () => page(-1));
  $('.pov__next').addEventListener('click', () => page(1));
  function page(delta: number): void {
    if (!activeSide) return;
    const plan = planSide(DEMO_CATALOG, activeSide, sides[activeSide], cap(activeSide));
    sides[activeSide] = setPage(sides[activeSide], plan.page + delta, plan.pages);
    applySide(activeSide); paintRack();
  }
  list.addEventListener('click', (e) => {
    const b = (e.target as HTMLElement).closest<HTMLButtonElement>('button[data-product]');
    if (!b || !activeSide) return;
    const p = DEMO_CATALOG.find((x) => x.id === b.dataset.product);
    if (p) select({ product: p, side: activeSide, index: 0, kind: 'hanger' }, false);
  });
  sizes.addEventListener('click', (e) => {
    const b = (e.target as HTMLElement).closest<HTMLButtonElement>('button[data-size]');
    if (!b) return;
    size = b.dataset.size as Size;
    errorMsg.hidden = true;
    sizes.querySelectorAll('button').forEach((x) => x.setAttribute('aria-pressed', String(x === b)));
  });
  addBtn.addEventListener('click', () => void add());
  viewBtn.addEventListener('click', () => { if (selected) commerceApi()?.openProduct(selected.id, viewBtn); });
  $('.pov__close').addEventListener('click', closeProduct);
  bagBtn.addEventListener('click', () => commerceApi()?.openBag(bagBtn));
  commerceApi()?.onChange(() => { bagCount.textContent = String(commerceApi()?.count() ?? 0); });

  // ---------- gesto no palco: horizontal gira, vertical continua nativo ----------
  const inUi = (e: Event) => e.target instanceof Element && !!e.target.closest('.pov, a, button, input, select, textarea, [role="dialog"]');
  let gesture: { id: number; x: number; y: number; lx: number; ly: number; moving: boolean; mouse: boolean } | null = null;
  let hoverRaf = 0, hx = 0, hy = 0;
  stage.addEventListener('pointerdown', (e) => {
    if (!live || !inStore() || !getWorld() || inUi(e) || flight) return;
    if (e.pointerType === 'mouse' && e.button !== 0) return;
    if (!e.isPrimary) { gesture = null; return; }
    gesture = { id: e.pointerId, x: e.clientX, y: e.clientY, lx: e.clientX, ly: e.clientY, moving: false, mouse: e.pointerType === 'mouse' };
  });
  stage.addEventListener('pointermove', (e) => {
    const w = getWorld(); if (!w || !live) return;
    if (gesture && gesture.id === e.pointerId) {
      const dx = e.clientX - gesture.x, dy = e.clientY - gesture.y;
      if (!gesture.moving) {
        const horizontal = Math.abs(dx) > 12 && Math.abs(dx) > Math.abs(dy) * 1.25;
        const verticalMouse = gesture.mouse && w.exploring() && Math.abs(dy) > 12;
        if (horizontal || verticalMouse) {
          gesture.moving = true;
          try { stage.setPointerCapture(e.pointerId); } catch { /* captura nem sempre disponível */ }
          stage.classList.add('is-dragging');
        } else if (Math.abs(dy) > 12 && !gesture.mouse) { gesture = null; return; } // swipe vertical → rolagem nativa
      }
      if (gesture.moving) {
        const r = stage.getBoundingClientRect();
        const mx = (e.clientX - gesture.lx) / Math.max(320, r.width);
        const my = gesture.mouse && w.exploring() ? (e.clientY - gesture.ly) / Math.max(320, r.height) : 0;
        w.lookDelta(mx, my);
        gesture.lx = e.clientX; gesture.ly = e.clientY;
        if (!w.exploring()) paintMode();
      }
    } else if (e.pointerType === 'mouse' && !flight && inStore()) {
      hx = e.clientX; hy = e.clientY;
      if (!hoverRaf) hoverRaf = requestAnimationFrame(() => {
        hoverRaf = 0;
        const hit = getWorld()?.hoverRack(hx, hy);
        stage.style.cursor = hit ? 'pointer' : '';
      });
    }
  }, { passive: true });
  const end = (e: PointerEvent) => {
    const g = gesture; if (!g || g.id !== e.pointerId) return;
    gesture = null;
    stage.classList.remove('is-dragging');
    if (stage.hasPointerCapture(e.pointerId)) stage.releasePointerCapture(e.pointerId);
    if (g.moving || !live || inUi(e) || flight) return; // gesto de câmera nunca dispara toque em produto
    const w = getWorld(); if (!w) return;
    if (w.bagHit(e.clientX, e.clientY)) { commerceApi()?.openBag(bagBtn); return; }
    const hit = w.pickRack(e.clientX, e.clientY);
    if (hit) select(hit);
  };
  stage.addEventListener('pointerup', end);
  stage.addEventListener('pointercancel', () => { gesture = null; stage.classList.remove('is-dragging'); });
  stage.addEventListener('lostpointercapture', () => { gesture = null; stage.classList.remove('is-dragging'); });

  // Controle dedicado de olhar: captura desde o início (horizontal e vertical).
  const pad = $<HTMLElement>('.pov__look');
  let padGesture: { id: number; lx: number; ly: number } | null = null;
  pad.addEventListener('pointerdown', (e) => {
    if ((e.target as HTMLElement).closest('button')) return;
    padGesture = { id: e.pointerId, lx: e.clientX, ly: e.clientY };
    try { pad.setPointerCapture(e.pointerId); } catch { /* ignore */ }
  });
  pad.addEventListener('pointermove', (e) => {
    if (!padGesture || padGesture.id !== e.pointerId) return;
    getWorld()?.lookDelta((e.clientX - padGesture.lx) / 260, (e.clientY - padGesture.ly) / 260);
    padGesture.lx = e.clientX; padGesture.ly = e.clientY;
  });
  const padEnd = (e: PointerEvent) => { if (padGesture?.id === e.pointerId) padGesture = null; };
  pad.addEventListener('pointerup', padEnd);
  pad.addEventListener('pointercancel', padEnd);

  // ---------- teclado ----------
  const walkKeys = new Set(['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'KeyW', 'KeyA', 'KeyS', 'KeyD']);
  const stageFocused = () => document.activeElement === stage || (document.activeElement instanceof Element && ui.contains(document.activeElement) && !document.activeElement.closest('.pov__rack, input, select, textarea'));
  document.addEventListener('keydown', (e) => {
    const w = getWorld(); if (!w || !live) return;
    if (e.key === 'Escape') {
      if (selected && !productBox.hidden) { e.preventDefault(); closeProduct(); return; }
      if (w.exploring()) { e.preventDefault(); exitExplore(); enterBtn.focus({ preventScroll: true }); }
      return;
    }
    if (w.exploring() && walkKeys.has(e.code) && stageFocused()) { e.preventDefault(); w.setKey(e.code, true); }
  });
  document.addEventListener('keyup', (e) => { if (walkKeys.has(e.code)) getWorld()?.setKey(e.code, false); });
  window.addEventListener('blur', () => { getWorld()?.explorer.clearKeys(); gesture = null; });

  function setChapter(id: ChapterId, isLive: boolean): void {
    chapter = id; live = isLive;
    if (!inStore() || !live) {
      // sair do capítulo explorável encerra a visita e devolve o trilho
      if (getWorld()?.exploring()) exitExplore();
      if (!live) { activeSide = null; selected = null; paintRack(); }
    }
    getWorld()?.setChapter(id);
    paintMode();
  }
  function refresh(): void {
    const w = getWorld();
    live = live && !!w;
    if (w) { applyAll(); w.selectRack(selected?.id ?? null); }
    paintMode(); paintRack();
  }
  return { setChapter, refresh, exitExplore, exploring };
}
