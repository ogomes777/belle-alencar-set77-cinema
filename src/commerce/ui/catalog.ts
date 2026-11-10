/** Catálogo: filtros (categoria/ocasião/tamanho/silhueta), grade e cards. */
import { h } from '../../core/dom';
import { illustrate } from '../../core/illustration';
import { SILHOUETTES, type Silhouette } from '../../core/dress';
import { DEMO_CATALOG } from '../catalog.demo';
import { applyFilters, DEFAULT_FILTERS, isFiltered, type Filters } from '../filters';
import { CATEGORY_LABEL, OCCASION_LABEL, type Category, type Occasion, type Product, type Size } from '../types';
import { formatPrice, plural } from '../format';
import { heart } from './icons';
import type { Ctx } from './context';

const SIZES: Size[] = ['PP', 'P', 'M', 'G', 'GG', 'Único'];

export function productCard(p: Product, wished: boolean, i: number): HTMLElement {
  const media = h('button', {
    type: 'button',
    class: 'pcard__media',
    'data-qv': p.id,
    tabindex: '-1',
    'aria-hidden': 'true',
  });
  media.innerHTML = `<span class="pcard__ill" data-flip-id="ill-${p.id}">${illustrate(p.illustration, `Ilustração demonstrativa: ${p.title}`)}</span>`;
  media.append(h('span', { class: 'badge', 'aria-hidden': 'true', text: 'Ilustração · demonstração' }));
  const wish = h('button', {
    type: 'button',
    class: 'pcard__wish wish-btn',
    'data-wish': p.id,
    'aria-pressed': String(wished),
    'aria-label': `Favoritar ${p.title}`,
    html: heart,
  });
  return h('li', { class: 'pcard', style: `--i:${i}`, 'data-product': p.id },
    h('article', { class: 'pcard__inner' },
      media,
      wish,
      h('div', { class: 'pcard__info' },
        h('p', { class: 'pcard__meta', text: `${CATEGORY_LABEL[p.category]} · ${p.sku}` }),
        h('h3', { class: 'pcard__title' }, h('button', { type: 'button', 'data-qv': p.id }, p.title, h('span', { class: 'sr-only', text: ' — ilustração demonstrativa, ver detalhes' }))),
        h('p', { class: 'pcard__price', text: formatPrice(p.price) }),
      ),
    ),
  );
}

export function createCatalog(ctx: Ctx, mount: HTMLElement) {
  let filters: Filters = { ...DEFAULT_FILTERS };

  const segButtons = (['todas', 'vestidos', 'conjuntos', 'acessorios'] as const).map((c) =>
    h('button', { type: 'button', class: 'seg__btn', 'data-cat': c, 'aria-pressed': String(c === 'todas'), text: c === 'todas' ? 'Todas' : CATEGORY_LABEL[c] }),
  );
  const ink = h('span', { class: 'seg__ink', 'aria-hidden': 'true' });
  const seg = h('div', { class: 'seg', role: 'group', 'aria-label': 'Categoria' }, ...segButtons, ink);

  const occButtons = (['todas', 'dia', 'noite', 'celebrar'] as const).map((o) =>
    h('button', { type: 'button', class: 'chip', 'data-occ': o, 'aria-pressed': String(o === 'todas'), text: o === 'todas' ? 'Toda ocasião' : OCCASION_LABEL[o] }),
  );
  const occ = h('div', { class: 'chips', role: 'group', 'aria-label': 'Ocasião' }, ...occButtons);

  const sizeSelect = h('select', { id: 'filterSize', class: 'select' },
    h('option', { value: 'todos', text: 'Todos' }),
    ...SIZES.map((s) => h('option', { value: s, text: s })),
  );
  const size = h('label', { class: 'size-filter', for: 'filterSize' }, h('span', { text: 'Tamanho' }), sizeSelect);

  const silChip = h('div', { class: 'active-filters' });
  const count = h('p', { class: 'cat-count', 'aria-live': 'polite' });
  const clear = h('button', { type: 'button', class: 'link-btn', 'data-clear': true, text: 'Limpar filtros' });
  const grid = h('ul', { class: 'pgrid', 'aria-label': 'Peças da coleção' });
  const emptyClear = h('button', { type: 'button', class: 'btn btn--line', 'data-clear': true, text: 'Limpar filtros' });
  const empty = h('div', { class: 'cat-empty', hidden: true },
    h('p', { class: 'cat-empty__title', text: 'Nenhuma peça com essa combinação.' }),
    h('p', { text: 'Tente outro tamanho ou ocasião, ou fale com a loja: a seleção real é maior que esta prévia.' }),
    emptyClear,
  );

  const bar = h('div', { class: 'cat-bar' }, seg, h('div', { class: 'cat-bar__row' }, occ, size), h('div', { class: 'cat-bar__meta' }, count, silChip, clear));
  // preserva o <noscript>
  Array.from(mount.children).forEach((c) => { if (c.tagName !== 'NOSCRIPT') c.remove(); });
  mount.append(bar, grid, empty);

  function moveInk() {
    const active = segButtons.find((b) => b.getAttribute('aria-pressed') === 'true');
    if (!active) return;
    ink.style.setProperty('--x', `${active.offsetLeft}px`);
    ink.style.setProperty('--w', `${active.offsetWidth}px`);
  }

  function render() {
    const list = applyFilters(DEMO_CATALOG, filters);
    const wish = ctx.commerce.get().wishlist;
    grid.replaceChildren(...list.map((p, i) => productCard(p, wish.includes(p.id), i)));
    grid.classList.remove('is-entering');
    void grid.offsetWidth;
    grid.classList.add('is-entering');
    empty.hidden = list.length > 0;
    count.textContent = `${plural(list.length, 'peça', 'peças')} ${isFiltered(filters) ? 'com estes filtros' : 'na prévia'}`;
    clear.hidden = !isFiltered(filters);
    segButtons.forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.cat === filters.category)));
    occButtons.forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.occ === filters.occasion)));
    sizeSelect.value = filters.size;
    silChip.replaceChildren();
    if (filters.silhouette) {
      silChip.append(h('button', { type: 'button', class: 'chip chip--removable', 'data-clear-sil': true, 'aria-label': `Remover filtro silhueta ${SILHOUETTES[filters.silhouette].name}` },
        `Silhueta: ${SILHOUETTES[filters.silhouette].name}`, h('span', { 'aria-hidden': 'true', text: ' ×' })));
    }
    requestAnimationFrame(moveInk);
  }

  mount.addEventListener('click', (e) => {
    const t = e.target as HTMLElement;
    const cat = t.closest<HTMLElement>('[data-cat]');
    if (cat) { filters = { ...filters, category: cat.dataset.cat as Category | 'todas', silhouette: cat.dataset.cat === 'vestidos' ? filters.silhouette : null }; render(); return; }
    const oc = t.closest<HTMLElement>('[data-occ]');
    if (oc) { filters = { ...filters, occasion: oc.dataset.occ as Occasion | 'todas' }; render(); return; }
    if (t.closest('[data-clear]')) { filters = { ...DEFAULT_FILTERS }; render(); segButtons[0]?.focus(); return; }
    if (t.closest('[data-clear-sil]')) { filters = { ...filters, silhouette: null }; render(); return; }
    const w = t.closest<HTMLElement>('[data-wish]');
    if (w) {
      const on = ctx.commerce.toggleWishlist(w.dataset.wish!);
      w.setAttribute('aria-pressed', String(on));
      if (on && !ctx.reduced()) { w.classList.remove('is-burst'); void w.offsetWidth; w.classList.add('is-burst'); }
      return;
    }
    const qv = t.closest<HTMLElement>('[data-qv]');
    if (qv) {
      const card = qv.closest('.pcard');
      ctx.openQuickView(qv.dataset.qv!, qv, card?.querySelector<HTMLElement>('.pcard__ill') ?? null);
    }
  });
  sizeSelect.addEventListener('change', () => { filters = { ...filters, size: sizeSelect.value as Size | 'todos' }; render(); });
  addEventListener('resize', () => requestAnimationFrame(moveInk), { passive: true });

  // mantém corações em sincronia (quick view e drawer de favoritos também alternam)
  ctx.commerce.subscribe((s, prev) => {
    if (s.wishlist === prev.wishlist) return;
    grid.querySelectorAll<HTMLElement>('[data-wish]').forEach((b) => b.setAttribute('aria-pressed', String(s.wishlist.includes(b.dataset.wish!))));
  });

  render();

  return {
    setCategory(category: Category | 'todas', silhouette: Silhouette | null = null, occasion: Occasion | 'todas' = 'todas') {
      filters = { ...DEFAULT_FILTERS, category, silhouette, occasion };
      render();
    },
    onFirstHover(fn: () => void) {
      mount.addEventListener('pointerover', fn, { once: true });
      mount.addEventListener('focusin', fn, { once: true });
    },
  };
}
