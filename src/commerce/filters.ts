import type { Category, Occasion, Product, Size } from './types';
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

export function searchProducts(products: Product[], q: string): Product[] {
  const n = normalize(q);
  if (!n) return [];
  return products.filter((p) => normalize(`${p.title} ${p.sku} ${p.category} ${p.description}`).includes(n));
}

export function normalize(s: string): string {
  return s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').trim();
}
