/**
 * Estado das araras por lado: categoria aberta, peça selecionada e página.
 * Puro (sem Three.js, sem DOM). Fonte canônica = catálogo ativo em ordem estável.
 * Contrato: docs/hero-pov/07_ARARAS_POR_CATEGORIA.md.
 */
import type { Category, Product } from '../commerce/types';
import type { Side } from './scene/layout';

export const ACCESSORY_CATEGORIES: readonly Category[] = ['bolsas', 'pulseiras', 'aneis'];
export const isAccessory = (c: Category): boolean => ACCESSORY_CATEGORIES.includes(c);

export interface SideState { category: Category | null; selectedId: string | null; page: number }
export interface Capacity { hangers: number; shelf: number }

export interface SidePlan {
  side: Side;
  category: Category | null;
  /** Lista completa e estável da categoria (ou da seleção de entrada). */
  items: Product[];
  /** Produtos atribuídos a cada cabide (null = vazio). */
  hangers: (Product | null)[];
  /** Produtos atribuídos a cada apoio do banco (null = vazio). */
  shelf: (Product | null)[];
  total: number;
  page: number;
  pages: number;
  pageSize: number;
  selectedId: string | null;
  /** Índice da peça selecionada dentro de `items`, ou -1. */
  selectedIndex: number;
}

export const initialSide = (): SideState => ({ category: null, selectedId: null, page: 0 });

const CLOTHING_ORDER: readonly Category[] = ['vestidos', 'camisas', 'croppeds', 'saias', 'calcas'];
const DARK_TONES = new Set(['vinho', 'noite', 'terracota']);
const MID_TONES = new Set(['gelo', 'salvia', 'dourado']);

/** Ativos da categoria, na ordem estável da fonte. */
export function categoryItems(catalog: readonly Product[], category: Category): Product[] {
  return catalog.filter((p) => p.active && p.category === category);
}

/**
 * Seleção de entrada por lado (sem categoria aberta): esquerda recebe os tons
 * claros, direita vinho/preto e tons intermediários (quadros 02/03/05).
 * Acessórios entram no banco: duas bolsas, uma pulseira e um anel por lado.
 */
export function entrySelection(catalog: readonly Product[], side: Side, cap: Capacity): { hangers: Product[]; shelf: Product[] } {
  const clothing = catalog.filter((p) => p.active && !isAccessory(p.category));
  const dark = clothing.filter((p) => DARK_TONES.has(p.tone) || MID_TONES.has(p.tone));
  const light = clothing.filter((p) => !DARK_TONES.has(p.tone) && !MID_TONES.has(p.tone));
  const byCategory = (list: Product[]) => [...list].sort((a, b) => CLOTHING_ORDER.indexOf(a.category) - CLOTHING_ORDER.indexOf(b.category));
  const mine = byCategory(side === 'left' ? light : dark);
  const other = byCategory(side === 'left' ? dark : light);
  const hangers = mine.slice(0, cap.hangers);
  // Nenhuma peça fica de fora do salão: o que não coube de um lado vai ao outro.
  const overflow = other.slice(cap.hangers);
  for (const p of overflow) if (hangers.length < cap.hangers) hangers.push(p);
  const pick = (category: Category, n: number, offset: number) => categoryItems(catalog, category).filter((_, i) => (i % 2 === offset)).slice(0, n);
  const offset = side === 'left' ? 0 : 1;
  const shelf = [...pick('bolsas', 2, offset), ...pick('pulseiras', 1, offset), ...pick('aneis', 1, offset)].slice(0, cap.shelf);
  return { hangers, shelf };
}

export function pageOf(index: number, pageSize: number): number {
  return index < 0 ? 0 : Math.floor(index / Math.max(1, pageSize));
}

/** Plano de exibição de um lado para o estado atual. */
export function planSide(catalog: readonly Product[], side: Side, state: SideState, cap: Capacity): SidePlan {
  if (!state.category) {
    const entry = entrySelection(catalog, side, cap);
    const items = [...entry.hangers, ...entry.shelf];
    const selectedIndex = state.selectedId ? items.findIndex((p) => p.id === state.selectedId) : -1;
    return {
      side, category: null, items,
      hangers: pad(entry.hangers, cap.hangers), shelf: pad(entry.shelf, cap.shelf),
      total: items.length, page: 0, pages: 1, pageSize: items.length || 1,
      selectedId: selectedIndex >= 0 ? state.selectedId : null, selectedIndex,
    };
  }
  const items = categoryItems(catalog, state.category);
  const accessory = isAccessory(state.category);
  const pageSize = Math.max(1, accessory ? cap.shelf : cap.hangers);
  const pages = Math.max(1, Math.ceil(items.length / pageSize));
  const page = Math.min(Math.max(0, state.page), pages - 1);
  const slice = items.slice(page * pageSize, page * pageSize + pageSize);
  const selectedIndex = state.selectedId ? items.findIndex((p) => p.id === state.selectedId) : -1;
  return {
    side, category: state.category, items,
    hangers: accessory ? pad([], cap.hangers) : pad(slice, cap.hangers),
    shelf: accessory ? pad(slice, cap.shelf) : pad([], cap.shelf),
    total: items.length, page, pages, pageSize,
    selectedId: selectedIndex >= 0 ? state.selectedId : null, selectedIndex,
  };
}

/** Tocar uma peça: abre a categoria inteira no lado, mantém a seleção e a página que a contém. */
export function selectProduct(state: SideState, product: Product, catalog: readonly Product[], cap: Capacity): SideState {
  const items = categoryItems(catalog, product.category);
  const index = items.findIndex((p) => p.id === product.id);
  const pageSize = Math.max(1, isAccessory(product.category) ? cap.shelf : cap.hangers);
  const sameCategory = state.category === product.category;
  const page = sameCategory && pageOf(index, pageSize) === state.page ? state.page : pageOf(index, pageSize);
  return { category: product.category, selectedId: index >= 0 ? product.id : null, page };
}

/** Abrir uma categoria pelo seletor: primeira página, sem seleção (ou mantém se ainda pertencer). */
export function openCategory(state: SideState, category: Category | null, catalog: readonly Product[]): SideState {
  if (!category) return { category: null, selectedId: null, page: 0 };
  const items = categoryItems(catalog, category);
  const keep = state.selectedId && items.some((p) => p.id === state.selectedId) ? state.selectedId : null;
  return { category, selectedId: keep, page: 0 };
}

export function setPage(state: SideState, page: number, pages: number): SideState {
  return { ...state, page: Math.min(Math.max(0, page), Math.max(0, pages - 1)) };
}

/** Se a peça selecionada deixou de existir/ficou inativa, remove a seleção e preserva a lista. */
export function reconcile(state: SideState, catalog: readonly Product[]): SideState {
  if (!state.selectedId) return state;
  const p = catalog.find((x) => x.id === state.selectedId);
  if (!p || !p.active || (state.category && p.category !== state.category)) return { ...state, selectedId: null };
  return state;
}

function pad<T>(list: T[], n: number): (T | null)[] {
  const out: (T | null)[] = list.slice(0, n);
  while (out.length < n) out.push(null);
  return out;
}
