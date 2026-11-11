/**
 * BELLE ALENCAR · SET77 · V15 / Busca Atelier
 * Fast fashion-style product discovery with Belle's editorial art direction.
 * Only real demo catalog data, existing product quick view, store picker and
 * chapter links. No fabricated price, inventory, reviews or checkout.
 */
import { h } from '../../core/dom';
import { productImage } from '../media';
import '../media.css';
import { DEMO_CATALOG } from '../catalog.demo';
import { STORE_LIST } from '../stores';
import { normalize, searchProducts } from '../filters';
import { CATEGORY_LABEL, SHOP_CATEGORIES, type StoreId } from '../types';
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
  { id: 'ocasioes', label: 'Compre por ocasião', k: 'ocasiao dia sair noite festa celebrar casamento formatura' },
  { id: 'colecao', label: 'Coleção', k: 'colecao catalogo pecas' },
  { id: 'como-comprar', label: 'Como comprar', k: 'como comprar reservar retirar whatsapp pedido' },
  { id: 'lojas', label: 'Lojas', k: 'lojas cidades endereco mapa' },
  { id: 'atendimento', label: 'Atendimento de estilo', k: 'atendimento consultoria estilo tamanho ajuda' },
  { id: 'duvidas', label: 'Dúvidas frequentes', k: 'duvidas faq troca tamanho preco entrega retirada' },
];

const QUICK_SEARCHES = ['Vestidos', 'Bolsas', 'Croppeds', 'Saias', 'Anéis', 'Camisas'] as const;
const magnifier = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.65" stroke-linecap="round" aria-hidden="true" focusable="false"><circle cx="10.5" cy="10.5" r="6.5"/><path d="m16 16 5 5"/></svg>';

export function createSearch(ctx: Ctx) {
  const ov = createOverlay({ id: 'searchDialog', labelledBy: 'searchTitle', variant: 'search', className: 'ba-search' });
  const input = h('input', {
    type: 'search', id: 'searchInput', class: 'search-input',
    placeholder: 'Vestidos, bolsas, acessórios…', autocomplete: 'off',
    enterkeyhint: 'search', 'aria-describedby': 'searchCount'
  }) as HTMLInputElement;
  const count = h('p', { class: 'search-count', id: 'searchCount', 'aria-live': 'polite' });
  const results = h('div', { class: 'search-results' });
  const chips = h('div', { class: 'ba-search-chips', role: 'group', 'aria-label': 'Buscas populares' },
    ...QUICK_SEARCHES.map((label) =>
      h('button', { type: 'button', class: 'ba-search-chip', 'data-search-term': label, text: label })));
  const quick = h('div', { class: 'ba-search-popular' },
    h('span', { class: 'ba-search-popular__label', text: 'ENCONTRE POR CATEGORIA' }), chips);
  const clear = h('button', {
    type: 'button', class: 'ba-search-clear',
    'aria-label': 'Limpar busca', text: 'Limpar', hidden: true
  });
  const inputWrap = h('div', { class: 'ba-search-field' },
    h('span', { class: 'ba-search-field__icon', html: magnifier }),
    input, clear);
  ov.body.append(
    h('div', { class: 'ba-search-intro' },
      h('p', { class: 'ba-search-kicker', text: 'BELLE ALENCAR · DESCUBRA SUA PRÓXIMA PEÇA' }),
      h('h2', { id: 'searchTitle', class: 'ba-search-title', text: 'Encontre o seu look.' }),
      h('p', { class: 'ba-search-subtitle', text: 'Uma busca simples por peças, acessórios e estilo.' }),
    ),
    h('label', { class: 'search-label', for: 'searchInput', text: 'O que você procura?' }),
    inputWrap,
    quick,
    h('div', { class: 'ba-search-result-summary' }, count,
      h('button', { type: 'button', class: 'ba-search-go-collection', 'data-hit-anchor': 'colecao', text: 'VER COLEÇÃO COMPLETA' })),
    results,
    h('p', { class: 'ba-search-disclaimer', text: 'Imagens e produtos desta prévia são demonstrativos. Confirme o acervo e os detalhes com a loja.' }),
  );

  function group(title: string, items: HTMLElement[], kind: string) {
    return items.length ? h('section', { class: 'search-group search-group--' + kind },
      h('h3', { text: title }),
      h('ul', {}, ...items.map((item) => h('li', {}, item))),
    ) : null;
  }

  function render() {
    const q = input.value;
    const n = normalize(q);
    const prods = n
      ? searchProducts(DEMO_CATALOG, q).filter((p) => p.active)
      : SHOP_CATEGORIES.map((category) =>
          DEMO_CATALOG.find((p) => p.active && p.category === category)
        ).filter((p) => p !== undefined);
    const stores = n ? STORE_LIST.filter((s) =>
      normalize(`${s.city} ${s.state}`).includes(n)) : [];
    const chapters = n ? CHAPTERS.filter((c) =>
      document.getElementById(c.id) &&
      normalize(`${c.label} ${c.k}`).includes(n)) : [];
    const productItems = prods.map((p) =>
      h('button', {
        type: 'button', class: 'search-hit search-hit--product',
        'data-hit-product': p.id,
        'aria-label': `Ver ${p.title}, produto demonstrativo`
      },
        h('span', { class: 'ba-search-product-image' }, productImage(p, { alt: '' })),
        h('span', { class: 'ba-search-product-description' },
          h('small', { class: 'ba-search-product-category', text: CATEGORY_LABEL[p.category] }),
          h('span', { class: 'ba-search-product-title', text: p.title }),
          h('small', { class: 'ba-search-product-note', text: 'Produto demonstrativo · ver detalhes' })
        )
      )
    );
    const storeItems = stores.map((s) => h('button', {
      type: 'button', class: 'search-hit search-hit--store', 'data-hit-store': s.id,
    }, h('span', { text: `Belle ${s.city}` }),
      h('small', { text: s.address ?? `${s.state} · endereço a confirmar` })));
    const chapterItems = chapters.map((c) => h('button', {
      type: 'button', class: 'search-hit search-hit--chapter', 'data-hit-anchor': c.id
    }, h('span', { text: c.label }),
      h('small', { text: 'Explorar na landing' })));

    const groups = [
      group(n ? 'Peças encontradas' : 'Explore algumas peças', productItems, 'products'),
      group('Lojas Belle', storeItems, 'stores'),
      group('Na experiência', chapterItems, 'chapters'),
    ].filter((g): g is HTMLElement => !!g);
    if (n && !prods.length && !stores.length && !chapters.length) {
      results.replaceChildren(h('div', { class: 'ba-search-empty' },
        h('h3', { text: 'Não encontramos essa peça.' }),
        h('p', { text: 'Experimente buscar por vestido, bolsa, anel ou pela cidade da sua loja.' })));
    } else {
      results.replaceChildren(...groups);
    }
    const total = prods.length + stores.length + chapters.length;
    count.textContent = n
      ? (total ? plural(total, 'resultado', 'resultados') : 'Nenhum resultado')
      : 'SELEÇÃO DE PEÇAS · ESTUDO EDITORIAL';
    quick.hidden = Boolean(n);
    clear.hidden = !n;
  }

  input.addEventListener('input', render);
  clear.addEventListener('click', () => {
    input.value = '';
    render();
    input.focus({ preventScroll: true });
  });
  chips.addEventListener('click', (e) => {
    const target = (e.target as HTMLElement).closest<HTMLElement>('[data-search-term]');
    if (!target) return;
    input.value = target.dataset.searchTerm ?? '';
    render();
    input.focus({ preventScroll: true });
  });
  ov.body.addEventListener('click', (e) => {
    const t = (e.target as HTMLElement).closest<HTMLElement>('button');
    if (!t) return;
    const origin = document.getElementById('searchButton');
    if (t.dataset.hitProduct) ctx.openQuickView(t.dataset.hitProduct, origin);
    else if (t.dataset.hitStore) {
      ov.close({ restoreFocus: false });
      void ctx.chooseStore(t.dataset.hitStore as StoreId, origin);
    } else if (t.dataset.hitAnchor) {
      ov.close({ restoreFocus: false });
      ctx.scrollTo(t.dataset.hitAnchor);
    }
  });

  return {
    open(trigger?: HTMLElement | null) {
      render();
      ov.open(trigger, { focus: input });
    },
  };
}
