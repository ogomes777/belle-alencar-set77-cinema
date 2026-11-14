import { describe, expect, it } from 'vitest';
import { DEMO_CATALOG } from '../../src/commerce/catalog.demo';
import { SHOP_CATEGORIES, type Product } from '../../src/commerce/types';
import { categoryItems, entrySelection, initialSide, openCategory, planSide, reconcile, selectProduct, setPage } from '../../src/experience/rack-state';
import { RAIL, SHELF } from '../../src/experience/scene/layout';

const cap = { hangers: RAIL.slots, shelf: SHELF.slots };

describe('Hero POV · araras por categoria', () => {
  it('a seleção de entrada distribui as 30 roupas sem repetir nem omitir', () => {
    const left = entrySelection(DEMO_CATALOG, 'left', cap);
    const right = entrySelection(DEMO_CATALOG, 'right', cap);
    const ids = [...left.hangers, ...right.hangers].map((p) => p.id);
    expect(new Set(ids).size).toBe(ids.length);
    expect(ids.length).toBe(DEMO_CATALOG.filter((p) => !['bolsas', 'pulseiras', 'aneis'].includes(p.category)).length);
    expect(left.hangers.every((p) => !['vinho', 'noite'].includes(p.tone))).toBe(true);
    expect(right.hangers.some((p) => p.tone === 'vinho')).toBe(true);
    expect(left.shelf.length).toBeGreaterThan(0);
    expect(left.shelf.every((p) => ['bolsas', 'pulseiras', 'aneis'].includes(p.category))).toBe(true);
  });
  it('tocar um vestido abre todos os vestidos ativos e mantém a seleção', () => {
    const dress = DEMO_CATALOG.find((p) => p.slug === 'vestidos-04')!;
    const state = selectProduct(initialSide(), dress, DEMO_CATALOG, cap);
    const plan = planSide(DEMO_CATALOG, 'right', state, cap);
    const expected = categoryItems(DEMO_CATALOG, 'vestidos').map((p) => p.id);
    expect(plan.items.map((p) => p.id)).toEqual(expected);
    expect(plan.hangers.filter(Boolean).map((p) => p!.id)).toEqual(expected);
    expect(plan.selectedId).toBe(dress.id);
    expect(plan.shelf.every((p) => p === null)).toBe(true);
  });
  it('cada categoria existente é alcançável por inteiro, inclusive acessórios no banco', () => {
    for (const category of SHOP_CATEGORIES) {
      const first = categoryItems(DEMO_CATALOG, category)[0]!;
      const state = selectProduct(initialSide(), first, DEMO_CATALOG, cap);
      const plan = planSide(DEMO_CATALOG, 'left', state, cap);
      const reachable = new Set<string>();
      for (let page = 0; page < plan.pages; page++) {
        const p = planSide(DEMO_CATALOG, 'left', setPage(state, page, plan.pages), cap);
        [...p.hangers, ...p.shelf].forEach((x) => x && reachable.add(x.id));
      }
      const expected = categoryItems(DEMO_CATALOG, category).map((p) => p.id);
      expect([...reachable].sort()).toEqual([...expected].sort());
      const accessory = ['bolsas', 'pulseiras', 'aneis'].includes(category);
      expect(plan.hangers.some(Boolean)).toBe(!accessory);
      expect(plan.shelf.some(Boolean)).toBe(accessory);
    }
  });
  it('tocar outra peça da categoria aberta muda a seleção sem reiniciar a página', () => {
    const items = categoryItems(DEMO_CATALOG, 'camisas');
    const a = selectProduct(initialSide(), items[1]!, DEMO_CATALOG, cap);
    const b = selectProduct(a, items[4]!, DEMO_CATALOG, cap);
    expect(b.category).toBe('camisas');
    expect(b.page).toBe(a.page);
    expect(b.selectedId).toBe(items[4]!.id);
  });
  it('pagina quando a categoria excede os cabides e posiciona a página da peça escolhida', () => {
    const synthetic: Product[] = Array.from({ length: 41 }, (_, i) => ({
      ...DEMO_CATALOG[0]!, id: `syn-${i}`, slug: `syn-${i}`, category: 'vestidos', active: true,
    }));
    const small = { hangers: 18, shelf: 6 };
    const target = synthetic[39]!;
    const state = selectProduct(initialSide(), target, synthetic, small);
    const plan = planSide(synthetic, 'right', state, small);
    expect(plan.pages).toBe(3);
    expect(plan.page).toBe(2);
    expect(plan.hangers.filter(Boolean).length).toBe(5);
    expect(plan.hangers.some((p) => p?.id === target.id)).toBe(true);
    const all = new Set<string>();
    for (let page = 0; page < plan.pages; page++) planSide(synthetic, 'right', setPage(state, page, plan.pages), small).hangers.forEach((p) => p && all.add(p.id));
    expect(all.size).toBe(41);
    const exact = synthetic.slice(0, 18);
    expect(planSide(exact, 'right', openCategory(initialSide(), 'vestidos', exact), small).pages).toBe(1);
    expect(planSide(exact.slice(0, 1), 'right', openCategory(initialSide(), 'vestidos', exact.slice(0, 1)), small).total).toBe(1);
  });
  it('categoria vazia e ID inativo não quebram a lista', () => {
    const empty = planSide(DEMO_CATALOG.filter((p) => p.category !== 'saias'), 'left', openCategory(initialSide(), 'saias', []), cap);
    expect(empty.total).toBe(0);
    expect(empty.pages).toBe(1);
    const dress = DEMO_CATALOG.find((p) => p.slug === 'vestidos-02')!;
    const state = selectProduct(initialSide(), dress, DEMO_CATALOG, cap);
    const withoutDress = DEMO_CATALOG.map((p) => (p.id === dress.id ? { ...p, active: false } : p));
    const fixed = reconcile(state, withoutDress);
    expect(fixed.selectedId).toBeNull();
    expect(fixed.category).toBe('vestidos');
    expect(planSide(withoutDress, 'right', fixed, cap).total).toBe(5);
  });
  it('"todas as categorias" devolve a seleção de entrada do lado', () => {
    const dress = DEMO_CATALOG.find((p) => p.slug === 'vestidos-01')!;
    const state = openCategory(selectProduct(initialSide(), dress, DEMO_CATALOG, cap), null, DEMO_CATALOG);
    const plan = planSide(DEMO_CATALOG, 'left', state, cap);
    expect(plan.category).toBeNull();
    expect(plan.hangers.filter(Boolean).length).toBe(entrySelection(DEMO_CATALOG, 'left', cap).hangers.length);
  });
});
