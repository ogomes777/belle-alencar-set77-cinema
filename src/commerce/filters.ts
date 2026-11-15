import { CATEGORY_LABEL, OCCASION_LABEL, type Category, type Occasion, type Product, type Size } from './types';
import { phrasePairs } from '../preferences/copy';
import { productPairs } from '../preferences/catalog-copy';
import type { Silhouette } from '../core/dress';

export interface Filters {
  category: Category | 'todas';
  occasion: Occasion | 'todas';
  size: Size | 'todos';
  silhouette: Silhouette | null;
}

export const DEFAULT_FILTERS: Filters = { category: 'todas', occasion: 'todas', size: 'todos', silhouette: null };

export function applyFilters(products: Product[], f: Filters): Product[] {
  return products.filter(
    (p) =>
      p.active &&
      (f.category === 'todas' || p.category === f.category) &&
      (f.occasion === 'todas' || p.occasion === f.occasion) &&
      (f.size === 'todos' || p.variants.some((v) => v.size === f.size)) &&
      (!f.silhouette || p.silhouette === f.silhouette),
  );
}

export function isFiltered(f: Filters): boolean {
  return f.category !== 'todas' || f.occasion !== 'todas' || f.size !== 'todos' || !!f.silhouette;
}

/**
 * Search the SAME canonical products in every supported language.
 * Localized labels do not change product IDs, inventory, prices or store actions.
 * Require all search tokens in one language, avoiding cross-locale false matches.
 */
const searchTranslations = new Map<string, readonly string[]>(
  [...phrasePairs, ...productPairs].map(row => [row[0], row])
);
const localized = (text:string,index:number):string =>
  searchTranslations.get(text)?.[index] || text;
export function searchProducts(products: Product[], q: string): Product[] {
  const tokens = normalize(q).split(/\s+/).filter(Boolean);
  if (!tokens.length) return [];
  return products.filter((p) => {
    const category=CATEGORY_LABEL[p.category];
    const occasion=OCCASION_LABEL[p.occasion];
    const haystacks=[0,1,2,3].map(index=>normalize(
      [localized(p.title,index),localized(p.description,index),
       localized(category,index),localized(occasion,index),
       p.sku,p.category].join(' ')
    ));
    return haystacks.some(hay=>tokens.every(token=>hay.includes(token)));
  });
}

export function normalize(s: string): string {
  return s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').trim();
}
