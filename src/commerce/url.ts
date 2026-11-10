import { SHOP_CATEGORIES, type Category, type StoreId } from './types';
import { isStoreId } from './stores';

export interface UrlIntent {
  storeId: StoreId | null;
  productSlug: string | null;
  category: Category | null;
}

const CATS: readonly Category[] = SHOP_CATEGORIES;

/** `?loja=` tem prioridade; `?cidade=` é o parâmetro legado da V3. */
export function parseUrl(search: string): UrlIntent {
  const q = new URLSearchParams(search);
  const loja = q.get('loja') ?? q.get('cidade');
  const cat = q.get('categoria');
  const peca = q.get('peca');
  return {
    storeId: isStoreId(loja) ? loja : null,
    productSlug: peca && /^[a-z0-9-]{1,80}$/.test(peca) ? peca : null,
    category: cat && (CATS as string[]).includes(cat) ? (cat as Category) : null,
  };
}

export function setParam(key: string, value: string | null): void {
  try {
    const u = new URL(location.href);
    if (value === null) u.searchParams.delete(key);
    else u.searchParams.set(key, value);
    if (key === 'loja') u.searchParams.delete('cidade');
    history.replaceState(history.state, '', u.pathname + u.search + u.hash);
  } catch {
    /* ignore */
  }
}
