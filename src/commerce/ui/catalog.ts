/** Catálogo: filtros (categoria/ocasião/tamanho/silhueta), grade e cards. */
import { h } from '../../core/dom';
import { productImage } from '../media';
import { SILHOUETTES, type Silhouette } from '../../core/dress';
import { DEMO_CATALOG } from '../catalog.demo';
import { applyFilters, DEFAULT_FILTERS, isFiltered, type Filters } from '../filters';
import { CATEGORY_LABEL, OCCASION_LABEL, SHOP_CATEGORIES, type Category, type Occasion, type Product, type Size } from '../types';
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
  const image = h('span', { class: 'pcard__ill pcard__ill--cutout', 'data-flip-id': `ill-${p.id}` });
  image.append(productImage(p));
  media.append(image, h('span', { class: 'badge', 'aria-hidden': 'true', text: 'Packshot sintético · demonstração' }));
  const wish = h('button', {
    type: 'button',
    class: 'pcard__wish wish-btn',
    'data-wish': p.id,
    'aria-pressed': String(wished),
    'aria-label': `Favoritar ${p.title}`,
    html: heart,
  });
  return h('li', { class: 'pcard', style: `--i:${i}`, 'data-product': p.id, 'data-category': p.category },
    h('article', { class: 'pcard__inner' },
      media,
      wish,
      h('div', { class: 'pcard__info' },
        h('p', { class: 'pcard__meta', text: `${CATEGORY_LABEL[p.category]} · ${p.sku}` }),
        h('h3', { class: 'pcard__title' }, h('button', { type: 'button', 'data-qv': p.id }, p.title, h('span', { class: 'sr-only', text: ' — ilustração demonstrativa, ver detalhes' }))),
        h('div', { class: 'pcard__foot' },
          h('p', { class: 'pcard__price', text: formatPrice(p.price) }),
          h('span', { class: 'pcard__microcta', 'aria-hidden': 'true', text: 'VER PEÇA ↗' }),
        ),
      ),
    ),
  );
}

export function createCatalog(ctx: Ctx, mount: HTMLElement) {
  let filters: Filters = { ...DEFAULT_FILTERS };
  let filteredProducts: Product[] = [];
  let expanded = false;
  let visibleLimit = 8;
  // Two editorial rows on desktop; a shorter first look on narrow phones.
  const previewLimit = () => matchMedia('(max-width: 640px)').matches ? 4 : 8;

  const segButtons = (['todas', ...SHOP_CATEGORIES] as const).map((c) =>
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
  const grid = h('ul', { id: 'catalogGrid', class: 'pgrid', 'aria-label': 'Peças da coleção' });
  const moreHint = h('p', { class: 'catalog-more__hint', 'aria-live': 'polite' });
  const moreLabel = h('span', { class: 'catalog-more__label', text: 'VER TUDO' });
  const moreButton = h('button', {
    type: 'button', class: 'catalog-more__button', 'data-catalog-toggle': true,
    'aria-controls': 'catalogGrid', 'aria-expanded': 'false',
  }, moreLabel, h('span', { class: 'catalog-more__arrow', 'aria-hidden': 'true', text: '↓' }));
  const moreArea = h('div', { class: 'catalog-more', hidden: true },
    h('span', { class: 'catalog-more__rule', 'aria-hidden': 'true' }),
    moreHint, moreButton,
  );
  const emptyClear = h('button', { type: 'button', class: 'btn btn--line', 'data-clear': true, text: 'Limpar filtros' });
  const empty = h('div', { class: 'cat-empty', hidden: true },
    h('p', { class: 'cat-empty__title', text: 'Nenhuma peça com essa combinação.' }),
    h('p', { text: 'Tente outro tamanho ou ocasião, ou fale com a loja: a seleção real é maior que esta prévia.' }),
    emptyClear,
  );

  const bar = h('div', { class: 'cat-bar' }, seg, h('div', { class: 'cat-bar__row' }, occ, size), h('div', { class: 'cat-bar__meta' }, count, silChip, clear));
  // preserva o <noscript>
  Array.from(mount.children).forEach((c) => { if (c.tagName !== 'NOSCRIPT') c.remove(); });
  mount.append(bar, grid, moreArea, empty);

  function moveInk() {
    const active = segButtons.find((b) => b.getAttribute('aria-pressed') === 'true');
    if (!active) return;
    ink.style.setProperty('--x', `${active.offsetLeft}px`);
    ink.style.setProperty('--w', `${active.offsetWidth}px`);
  }

  function updateMore() {
    const hasMore = filteredProducts.length > visibleLimit;
    moreArea.hidden = !hasMore;
    moreButton.setAttribute('aria-expanded', String(expanded));
    moreLabel.textContent = expanded ? 'VER MENOS' : 'VER TUDO';
    const remaining = filteredProducts.length - visibleLimit;
    moreHint.textContent = expanded
      ? `${plural(filteredProducts.length, 'peça exibida', 'peças exibidas')}`
      : `Explore mais ${plural(remaining, 'peça', 'peças')} da seleção`;
  }

  function render() {
    filteredProducts = applyFilters(DEMO_CATALOG, filters);
    expanded = false;
    visibleLimit = previewLimit();
    const wish = ctx.commerce.get().wishlist;
    grid.replaceChildren(...filteredProducts.slice(0, visibleLimit).map((p, i) => productCard(p, wish.includes(p.id), i)));
    grid.classList.remove('is-entering');
    void grid.offsetWidth;
    grid.classList.add('is-entering');
    empty.hidden = filteredProducts.length > 0;
    count.textContent = `${plural(filteredProducts.length, 'peça', 'peças')} ${isFiltered(filters) ? 'com estes filtros' : 'na prévia'}`;
    updateMore();
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
    if (t.closest('[data-catalog-toggle]')) {
      if (!expanded) {
        // Preserve the first row's nodes, favorites and focus; mount only the
        // remaining images on demand. Collection ScrollTrigger remeasures via
        // its existing MutationObserver and stays reversible.
        const offset = grid.children.length;
        const wished = ctx.commerce.get().wishlist;
        // Move keyboard focus off the button before it travels to the end
        // of the enlarged grid. Otherwise browsers scroll thousands of
        // pixels to keep that moving focused button on screen.
        grid.tabIndex = -1;
        grid.focus({ preventScroll: true });
        grid.append(...filteredProducts.slice(offset).map((p, i) => productCard(p, wished.includes(p.id), offset + i)));
        expanded = true;
      } else {
        // Keep original product DOM for the short preview to avoid rebuilding
        // quick-view and wishlist targets needlessly.
        Array.from(grid.children).slice(visibleLimit).forEach(node => node.remove());
        expanded = false;
      }
      updateMore();
      if (!expanded) requestAnimationFrame(() => moreButton.scrollIntoView({ block: 'end', behavior: 'instant' }));
      return;
    }
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
  addEventListener('resize', () => {
    requestAnimationFrame(moveInk);
    const nextLimit = previewLimit();
    if (nextLimit === visibleLimit) return;
    visibleLimit = nextLimit;
    if (!expanded) {
      const wished = ctx.commerce.get().wishlist;
      grid.replaceChildren(...filteredProducts.slice(0, visibleLimit).map((p, i) => productCard(p, wished.includes(p.id), i)));
    }
    updateMore();
  }, { passive: true });

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
