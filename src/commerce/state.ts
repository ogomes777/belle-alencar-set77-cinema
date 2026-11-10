/**
 * Controlador do comércio: cidade, sacolas por filial, favoritos e disponibilidade.
 * Disponibilidade é mantida POR LOJA e nunca é herdada de outra unidade.
 */
import { createStore, type Store as Observable } from '../core/store';
import { readJSON, writeJSON } from '../core/storage';
import type { AvailabilityMap, AvailabilityProvider, AvailabilityStatus, Bags, CartItem, Product, Size, StoreId } from './types';
import { STORE_IDS } from './types';
import { isStoreId } from './stores';
import { addItem, bagOf, moveBag, removeItem, setQty } from './cart';

export interface CommerceState {
  storeId: StoreId | null;
  bags: Bags;
  wishlist: string[];
  availability: Partial<Record<StoreId, AvailabilityMap>>;
}

export type SwitchChoice = 'move' | 'keep' | 'cancel';

export interface SwitchPlan {
  kind: 'same' | 'direct' | 'resolve';
  from: StoreId | null;
  to: StoreId;
  count: number;
}

export interface SwitchResult {
  changed: boolean;
  unavailable: string[]; // variantIds marcados como 'out' na nova loja
}

const K = { store: 'store', bags: 'bags', wishlist: 'wishlist' } as const;

export interface CommerceOptions {
  provider: AvailabilityProvider;
  catalog: Product[];
  persist?: boolean;
}

export type Commerce = ReturnType<typeof createCommerce>;

export function createCommerce({ provider, catalog, persist = true }: CommerceOptions) {
  const known = new Map(catalog.map((p) => [p.id, p]));
  const validVariant = (it: CartItem) => !!known.get(it.productId)?.variants.some((v) => v.id === it.variantId);

  function loadBags(): Bags {
    const raw = persist ? readJSON<Bags>(K.bags, {}) : {};
    const out: Bags = {};
    for (const id of STORE_IDS) {
      const list = Array.isArray(raw?.[id]) ? raw[id]! : [];
      out[id] = list
        .filter((it) => it && typeof it.qty === 'number' && it.qty > 0 && validVariant(it))
        .map((it) => ({ ...it, storeId: id }));
    }
    return out;
  }

  const savedStore = persist ? readJSON<string | null>(K.store, null) : null;
  const savedWish = persist ? readJSON<string[]>(K.wishlist, []) : [];

  const store: Observable<CommerceState> = createStore<CommerceState>({
    storeId: isStoreId(savedStore) ? savedStore : null,
    bags: loadBags(),
    wishlist: Array.isArray(savedWish) ? savedWish.filter((id) => known.has(id)) : [],
    availability: {},
  });

  if (persist) {
    store.subscribe((s, prev) => {
      if (s.storeId !== prev.storeId) writeJSON(K.store, s.storeId);
      if (s.bags !== prev.bags) writeJSON(K.bags, s.bags);
      if (s.wishlist !== prev.wishlist) writeJSON(K.wishlist, s.wishlist);
    });
  }

  async function refreshAvailability(storeId: StoreId | null = store.get().storeId): Promise<AvailabilityMap> {
    if (!storeId) return {};
    const ids = bagOf(store.get().bags, storeId).map((it) => it.variantId);
    if (!ids.length) return {};
    const fresh = await provider.check(storeId, ids);
    store.set((s) => ({ availability: { ...s.availability, [storeId]: { ...fresh } } }));
    return fresh;
  }

  function statusOf(storeId: StoreId | null, variantId: string): AvailabilityStatus {
    if (!storeId) return 'unknown';
    return store.get().availability[storeId]?.[variantId] ?? 'unknown';
  }

  function planSwitch(to: StoreId): SwitchPlan {
    const s = store.get();
    if (s.storeId === to) return { kind: 'same', from: s.storeId, to, count: 0 };
    const count = bagOf(s.bags, s.storeId).length;
    return { kind: count > 0 ? 'resolve' : 'direct', from: s.storeId, to, count };
  }

  /** Troca de loja. Com sacola não vazia exige `choice` explícita. */
  async function selectStore(to: StoreId, choice?: SwitchChoice): Promise<SwitchResult> {
    const plan = planSwitch(to);
    if (plan.kind === 'same') return { changed: false, unavailable: [] };
    if (plan.kind === 'resolve' && !choice) throw new Error('store-switch-requires-choice');
    if (choice === 'cancel') return { changed: false, unavailable: [] };

    if (plan.kind === 'resolve' && choice === 'move' && plan.from) {
      const from = plan.from;
      store.set((s) => ({ bags: moveBag(s.bags, from, to), storeId: to }));
      const fresh = await refreshAvailability(to);
      return { changed: true, unavailable: Object.keys(fresh).filter((id) => fresh[id] === 'out') };
    }
    store.set({ storeId: to });
    await refreshAvailability(to);
    return { changed: true, unavailable: [] };
  }

  function add(productId: string, size: Size): { ok: true } | { ok: false; reason: 'no-store' | 'no-variant' } {
    const s = store.get();
    if (!s.storeId) return { ok: false, reason: 'no-store' };
    const variant = known.get(productId)?.variants.find((v) => v.size === size);
    if (!variant) return { ok: false, reason: 'no-variant' };
    const storeId = s.storeId;
    store.set((st) => ({ bags: addItem(st.bags, storeId, { productId, variantId: variant.id, size }) }));
    void refreshAvailability(storeId);
    return { ok: true };
  }

  function updateQty(variantId: string, qty: number): void {
    const id = store.get().storeId;
    if (id) store.set((s) => ({ bags: setQty(s.bags, id, variantId, qty) }));
  }

  function remove(variantId: string): void {
    const id = store.get().storeId;
    if (id) store.set((s) => ({ bags: removeItem(s.bags, id, variantId) }));
  }

  function toggleWishlist(productId: string): boolean {
    if (!known.has(productId)) return false;
    const has = store.get().wishlist.includes(productId);
    store.set((s) => ({ wishlist: has ? s.wishlist.filter((x) => x !== productId) : [...s.wishlist, productId] }));
    return !has;
  }

  return {
    get: store.get,
    subscribe: store.subscribe,
    currentBag: () => bagOf(store.get().bags, store.get().storeId),
    bagFor: (id: StoreId) => bagOf(store.get().bags, id),
    otherBags: () => STORE_IDS.filter((id) => id !== store.get().storeId && bagOf(store.get().bags, id).length > 0),
    planSwitch,
    selectStore,
    add,
    updateQty,
    remove,
    toggleWishlist,
    isWished: (id: string) => store.get().wishlist.includes(id),
    statusOf,
    refreshAvailability,
    product: (id: string) => known.get(id),
  };
}
