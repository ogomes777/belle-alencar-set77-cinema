/** Liga o comércio ao shell: rótulo da loja, contadores e cards de #lojas. */
import { $$ } from '../../core/dom';
import { STORES } from '../stores';
import { countItems } from '../cart';
import type { Category, StoreId } from '../types';
import type { Ctx } from './context';

export function bindHeader(ctx: Ctx) {
  const sync = (bump = false) => {
    const s = ctx.commerce.get();
    const store = s.storeId ? STORES[s.storeId] : null;
    $$('[data-store-label]').forEach((el) => (el.textContent = store ? store.city : 'Escolher loja'));
    document
      .getElementById('storeButton')
      ?.setAttribute('aria-label', store ? `Loja selecionada: ${store.city}. Trocar loja` : 'Escolher loja');

    const bagN = countItems(ctx.commerce.currentBag());
    const wishN = s.wishlist.length;
    $$<HTMLElement>('[data-bag-count]').forEach((el) => {
      el.textContent = String(bagN);
      el.hidden = bagN === 0;
      if (bump && !ctx.reduced()) {
        el.classList.remove('is-bump');
        void el.offsetWidth;
        el.classList.add('is-bump');
      }
    });
    $$<HTMLElement>('[data-wishlist-count]').forEach((el) => {
      el.textContent = String(wishN);
      el.hidden = wishN === 0;
    });
    document
      .getElementById('bagButton')
      ?.setAttribute('aria-label', `Sacola de interesse${store ? ` de ${store.city}` : ''}, ${bagN} ${bagN === 1 ? 'peça' : 'peças'}`);
    document.getElementById('wishlistButton')?.setAttribute('aria-label', `Favoritos, ${wishN} ${wishN === 1 ? 'peça' : 'peças'}`);

    $$<HTMLElement>('[data-store-card]').forEach((c) => c.classList.toggle('is-active', c.dataset.storeCard === s.storeId));
    $$<HTMLElement>('[data-select-store]').forEach((b) => {
      const on = b.dataset.selectStore === s.storeId;
      b.setAttribute('aria-pressed', String(on));
      b.textContent = on ? 'Sua loja ✓' : 'Definir como minha loja';
    });
  };

  ctx.commerce.subscribe((s, prev) => {
    if (s.storeId === prev.storeId && s.bags === prev.bags && s.wishlist === prev.wishlist) return;
    const prevN = countItems(prev.storeId ? prev.bags[prev.storeId] ?? [] : []);
    const nowN = countItems(s.storeId ? s.bags[s.storeId] ?? [] : []);
    sync(nowN > prevN && s.storeId === prev.storeId);
  });

  document.addEventListener('click', (e) => {
    const t = e.target as HTMLElement;
    if (t.closest('#overlays')) return; // painéis tratam os próprios cliques
    const open = t.closest<HTMLElement>('[data-open-store]');
    if (open) {
      ctx.openStorePicker(open);
      return;
    }
    const sel = t.closest<HTMLElement>('[data-select-store]');
    if (sel) {
      void ctx.chooseStore(sel.dataset.selectStore as StoreId, sel);
      return;
    }
    const cat = t.closest<HTMLElement>('[data-filter-category]');
    if (cat) {
      ctx.applyCategory(cat.dataset.filterCategory as Category, null, true);
      return;
    }
    const btn = t.closest<HTMLElement>('#searchButton, #wishlistButton, #bagButton');
    if (btn?.id === 'searchButton') ctx.openSearch(btn);
    else if (btn?.id === 'wishlistButton') ctx.openWishlist(btn);
    else if (btn?.id === 'bagButton') ctx.openBag(btn);
  });

  sync();
}
