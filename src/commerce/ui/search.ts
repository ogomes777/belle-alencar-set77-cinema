/** Busca: peças demo, lojas e capítulos do filme. */
import { h } from '../../core/dom';
import { DEMO_CATALOG } from '../catalog.demo';
import { STORE_LIST } from '../stores';
import { normalize, searchProducts } from '../filters';
import { CATEGORY_LABEL, type StoreId } from '../types';
import { createOverlay } from './overlay';
import { plural } from '../format';
import type { Ctx } from './context';

const CHAPTERS = [
  { id: 'inicio', label: 'A vitrine', k: 'inicio vitrine fachada shopping' },
  { id: 'porta', label: 'A porta', k: 'porta entrada' },
  { id: 'sala', label: 'Sala viva · araras', k: 'sala arara cabide' },
  { id: 'vestido', label: 'O vestido desperta', k: 'vestido 3d' },
  { id: 'detalhe', label: 'Fio e caimento', k: 'detalhe tecido trama' },
  { id: 'categorias', label: 'Categorias', k: 'categorias vestidos conjuntos acessorios' },
  { id: 'provador', label: 'Provador', k: 'provador silhueta tom' },
  { id: 'colecao', label: 'Coleção', k: 'colecao catalogo pecas' },
  { id: 'lojas', label: 'Lojas', k: 'lojas cidades endereco' },
];

export function createSearch(ctx: Ctx) {
  const ov = createOverlay({ id: 'searchDialog', labelledBy: 'searchTitle', variant: 'search', className: 'ov--search' });
  const input = h('input', { type: 'search', id: 'searchInput', class: 'search-input', placeholder: 'Vestido, conjunto, Araxá…', autocomplete: 'off', 'aria-describedby': 'searchCount' }) as HTMLInputElement;
  const count = h('p', { class: 'search-count', id: 'searchCount', 'aria-live': 'polite' });
  const results = h('div', { class: 'search-results' });
  ov.body.append(
    h('h2', { class: 'sr-only', id: 'searchTitle', text: 'Buscar na Belle' }),
    h('label', { class: 'search-label', for: 'searchInput', text: 'Buscar' }),
    input, count, results,
  );

  function group(title: string, items: HTMLElement[]) {
    return items.length ? h('section', { class: 'search-group' }, h('h3', { text: title }), h('ul', {}, ...items.map((i) => h('li', {}, i)))) : null;
  }

  function render() {
    const q = input.value;
    const n = normalize(q);
    const prods = n ? searchProducts(DEMO_CATALOG, q) : DEMO_CATALOG.slice(0, 4);
    const stores = STORE_LIST.filter((s) => !n || normalize(`${s.city} ${s.state}`).includes(n));
    const chapters = CHAPTERS.filter((c) => n && normalize(`${c.label} ${c.k}`).includes(n));
    results.replaceChildren(
      ...[
        group(n ? 'Peças (demonstrativas)' : 'Sugestões', prods.map((p) => h('button', { type: 'button', class: 'search-hit', 'data-hit-product': p.id }, h('span', { text: p.title }), h('small', { text: `${CATEGORY_LABEL[p.category]} · ${p.sku}` })))),
        group('Lojas', stores.map((s) => h('button', { type: 'button', class: 'search-hit', 'data-hit-store': s.id }, h('span', { text: `Belle ${s.city}` }), h('small', { text: s.address ?? `${s.state} · endereço a confirmar` })))),
        group('Na experiência', chapters.map((c) => h('button', { type: 'button', class: 'search-hit', 'data-hit-anchor': c.id }, h('span', { text: c.label }), h('small', { text: 'Ir para o capítulo' })))),
      ].filter((x): x is HTMLElement => !!x),
    );
    const total = (n ? prods.length : 0) + (n ? stores.length : 0) + chapters.length;
    count.textContent = n ? (total ? plural(total, 'resultado', 'resultados') : 'Nada encontrado. Tente “vestido”, “bolsa” ou o nome da sua cidade.') : '';
  }

  input.addEventListener('input', render);
  results.addEventListener('click', (e) => {
    const t = (e.target as HTMLElement).closest<HTMLElement>('button');
    if (!t) return;
    const search = document.getElementById('searchButton');
    if (t.dataset.hitProduct) ctx.openQuickView(t.dataset.hitProduct, search);
    else if (t.dataset.hitStore) { ov.close({ restoreFocus: false }); void ctx.chooseStore(t.dataset.hitStore as StoreId, search); }
    else if (t.dataset.hitAnchor) { ov.close({ restoreFocus: false }); ctx.scrollTo(t.dataset.hitAnchor); }
  });

  return {
    open(trigger?: HTMLElement | null) {
      render();
      ov.open(trigger, { focus: input });
    },
  };
}
