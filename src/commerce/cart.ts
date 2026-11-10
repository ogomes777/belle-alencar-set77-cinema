/** Regras puras da sacola por filial. Sem DOM, sem storage: 100% testável. */
import type { Bags, CartItem, Size, StoreId } from './types';

export const MAX_QTY = 9;

export function bagOf(bags: Bags, storeId: StoreId | null): CartItem[] {
  return storeId ? bags[storeId] ?? [] : [];
}

export function countItems(items: CartItem[]): number {
  return items.reduce((n, it) => n + it.qty, 0);
}

export function addItem(
  bags: Bags,
  storeId: StoreId,
  item: { productId: string; variantId: string; size: Size; qty?: number },
  now = Date.now(),
): Bags {
  const bag = bagOf(bags, storeId);
  const existing = bag.find((it) => it.variantId === item.variantId);
  const qty = item.qty ?? 1;
  const next = existing
    ? bag.map((it) => (it.variantId === item.variantId ? { ...it, qty: Math.min(MAX_QTY, it.qty + qty) } : it))
    : [...bag, { productId: item.productId, variantId: item.variantId, size: item.size, qty: Math.min(MAX_QTY, qty), storeId, addedAt: now }];
  return { ...bags, [storeId]: next };
}

export function setQty(bags: Bags, storeId: StoreId, variantId: string, qty: number): Bags {
  if (qty <= 0) return removeItem(bags, storeId, variantId);
  const bag = bagOf(bags, storeId).map((it) =>
    it.variantId === variantId ? { ...it, qty: Math.min(MAX_QTY, Math.round(qty)) } : it,
  );
  return { ...bags, [storeId]: bag };
}

export function removeItem(bags: Bags, storeId: StoreId, variantId: string): Bags {
  return { ...bags, [storeId]: bagOf(bags, storeId).filter((it) => it.variantId !== variantId) };
}

/** Move todos os itens de uma filial para outra (mesclando variantes iguais). */
export function moveBag(bags: Bags, from: StoreId, to: StoreId): Bags {
  if (from === to) return bags;
  let next: Bags = { ...bags, [from]: [] };
  for (const it of bagOf(bags, from)) {
    next = addItem(next, to, { productId: it.productId, variantId: it.variantId, size: it.size, qty: it.qty }, it.addedAt);
  }
  return next;
}
