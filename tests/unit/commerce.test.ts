import { beforeEach, describe, expect, it } from 'vitest';
import { createCommerce } from '../../src/commerce/state';
import { DEMO_CATALOG } from '../../src/commerce/catalog.demo';
import { DemoAvailabilityProvider } from '../../src/commerce/availability';
import { STORES } from '../../src/commerce/stores';
import { parseUrl } from '../../src/commerce/url';
import { buildStoreMessage, checkoutGateway } from '../../src/commerce/checkout';
import { addItem, moveBag, setQty, removeItem, countItems } from '../../src/commerce/cart';
import { applyFilters, DEFAULT_FILTERS } from '../../src/commerce/filters';
import type { AvailabilityMap, AvailabilityProvider, StoreId } from '../../src/commerce/types';

const dress = DEMO_CATALOG.find((p) => p.category === 'vestidos')!;
const set = DEMO_CATALOG.find((p) => p.category === 'camisas')!;
const acc = DEMO_CATALOG.find((p) => p.category === 'bolsas')!;

/** Provider falso: estoque diferente por loja e registro de chamadas. */
class FakeProvider implements AvailabilityProvider {
  calls: { storeId: StoreId; ids: string[] }[] = [];
  constructor(private table: Partial<Record<StoreId, AvailabilityMap>>) {}
  async check(storeId: StoreId, ids: string[]) {
    this.calls.push({ storeId, ids });
    const out: AvailabilityMap = {};
    for (const id of ids) out[id] = this.table[storeId]?.[id] ?? 'unknown';
    return out;
  }
}

const fresh = (provider: AvailabilityProvider = new DemoAvailabilityProvider()) =>
  createCommerce({ provider, catalog: DEMO_CATALOG });

beforeEach(() => localStorage.clear());

describe('dados demonstrativos honestos', () => {
  it('todo produto é demo, sem preço e com SKU DEMO-', () => {
    for (const p of DEMO_CATALOG) {
      expect(p.isDemo).toBe(true);
      expect(p.price.priceCents).toBeNull();
      expect(p.sku).toMatch(/^DEMO-[A-Z]+-\d{2}$/);
      expect(p.mediaRights.status).toBe('demo');
    }
  });
  it('endereços fornecidos pelo cliente; contato por unidade não confirmado', () => {
    expect(STORES.araxa.address).toContain('João Sena, 103');
    expect(STORES.frutal.address).toContain('Delfino Nunes, 382');
    expect(STORES.catalao.address).toContain('José Marcelino, 206');
    expect(STORES.mineiros.address).toContain('Quarta Avenida, 76');
    for (const s of Object.values(STORES)) expect(s.contact.contactConfirmed).toBe(false);
  });
  it('checkout online desativado com motivo', () => {
    const st = checkoutGateway.status();
    expect(st.enabled).toBe(false);
    if (!st.enabled) expect(st.reason.length).toBeGreaterThan(20);
  });
});

describe('cidade', () => {
  it('persiste a loja escolhida entre instâncias (reload)', async () => {
    const a = fresh();
    expect(a.get().storeId).toBeNull();
    await a.selectStore('frutal');
    expect(fresh().get().storeId).toBe('frutal');
  });
  it('?loja= tem prioridade e ?cidade= é aceito como legado', () => {
    expect(parseUrl('?loja=catalao').storeId).toBe('catalao');
    expect(parseUrl('?cidade=mineiros').storeId).toBe('mineiros');
    expect(parseUrl('?loja=araxa&cidade=frutal').storeId).toBe('araxa');
    expect(parseUrl('?loja=sao-paulo').storeId).toBeNull();
    expect(parseUrl('?peca=vestido-longo-fluido&categoria=vestidos')).toMatchObject({ productSlug: 'vestido-longo-fluido', category: 'vestidos' });
    expect(parseUrl('?peca=<script>').productSlug).toBeNull();
  });
  it('ignora valor corrompido no storage', () => {
    localStorage.setItem('belle:v4:store', JSON.stringify('lisboa'));
    expect(fresh().get().storeId).toBeNull();
  });
});

describe('sacola por filial', () => {
  it('exige loja e tamanho válidos', () => {
    const c = fresh();
    expect(c.add(dress.id, 'M')).toEqual({ ok: false, reason: 'no-store' });
  });
  it('adiciona, mescla quantidade, altera e remove; persiste', async () => {
    const c = fresh();
    await c.selectStore('araxa');
    expect(c.add(dress.id, 'Único')).toEqual({ ok: false, reason: 'no-variant' });
    c.add(dress.id, 'M');
    c.add(dress.id, 'M');
    c.add(acc.id, 'Único');
    expect(c.currentBag()).toHaveLength(2);
    expect(countItems(c.currentBag())).toBe(3);
    const vid = c.currentBag()[0]!.variantId;
    c.updateQty(vid, 5);
    expect(c.currentBag()[0]!.qty).toBe(5);
    const reloaded = fresh();
    expect(countItems(reloaded.currentBag())).toBe(6);
    reloaded.remove(vid);
    expect(reloaded.currentBag()).toHaveLength(1);
    reloaded.updateQty(reloaded.currentBag()[0]!.variantId, 0);
    expect(reloaded.currentBag()).toHaveLength(0);
  });
  it('funções puras: limite de quantidade, move e mescla', () => {
    let b = addItem({}, 'araxa', { productId: dress.id, variantId: 'x-M', size: 'M', qty: 8 });
    b = addItem(b, 'araxa', { productId: dress.id, variantId: 'x-M', size: 'M', qty: 5 });
    expect(b.araxa![0]!.qty).toBe(9);
    b = addItem(b, 'frutal', { productId: dress.id, variantId: 'x-M', size: 'M' });
    const moved = moveBag(b, 'araxa', 'frutal');
    expect(moved.araxa).toEqual([]);
    expect(moved.frutal![0]!.qty).toBe(9);
    expect(moved.frutal![0]!.storeId).toBe('frutal');
    expect(setQty(moved, 'frutal', 'x-M', 0).frutal).toEqual([]);
    expect(removeItem(moved, 'frutal', 'x-M').frutal).toEqual([]);
  });
});

describe('troca de loja com sacola', () => {
  async function seeded(provider: AvailabilityProvider) {
    const c = fresh(provider);
    await c.selectStore('araxa');
    c.add(dress.id, 'M');
    c.add(set.id, 'P');
    return c;
  }

  it('exige escolha explícita', async () => {
    const c = await seeded(new DemoAvailabilityProvider());
    expect(c.planSwitch('frutal')).toMatchObject({ kind: 'resolve', from: 'araxa', count: 2 });
    await expect(c.selectStore('frutal')).rejects.toThrow('store-switch-requires-choice');
    expect(c.get().storeId).toBe('araxa');
  });

  it('cancelar não muda nada', async () => {
    const c = await seeded(new DemoAvailabilityProvider());
    const r = await c.selectStore('frutal', 'cancel');
    expect(r.changed).toBe(false);
    expect(c.get().storeId).toBe('araxa');
    expect(c.currentBag()).toHaveLength(2);
  });

  it('manter: sacola de Araxá fica salva e Frutal começa vazia', async () => {
    const c = await seeded(new DemoAvailabilityProvider());
    await c.selectStore('frutal', 'keep');
    expect(c.get().storeId).toBe('frutal');
    expect(c.currentBag()).toHaveLength(0);
    expect(c.bagFor('araxa')).toHaveLength(2);
    expect(c.otherBags()).toEqual(['araxa']);
  });

  it('levar: revalida na nova loja e marca indisponível sem remover', async () => {
    const dressV = `${dress.sku}-M`;
    const setV = `${set.sku}-P`;
    const provider = new FakeProvider({
      araxa: { [dressV]: 'in_stock', [setV]: 'in_stock' },
      frutal: { [dressV]: 'out', [setV]: 'in_stock' },
    });
    const c = await seeded(provider);
    await c.refreshAvailability();
    expect(c.statusOf('araxa', dressV)).toBe('in_stock');

    const r = await c.selectStore('frutal', 'move');
    expect(r.changed).toBe(true);
    expect(r.unavailable).toEqual([dressV]);
    expect(c.currentBag()).toHaveLength(2); // nada removido em silêncio
    expect(c.statusOf('frutal', dressV)).toBe('out');
    expect(c.statusOf('frutal', setV)).toBe('in_stock');
    expect(c.bagFor('araxa')).toHaveLength(0);
    expect(provider.calls.at(-1)).toEqual({ storeId: 'frutal', ids: [dressV, setV] });
  });

  it('disponibilidade nunca é herdada da loja anterior', async () => {
    const dressV = `${dress.sku}-M`;
    const provider = new FakeProvider({ araxa: { [dressV]: 'in_stock' } });
    const c = fresh(provider);
    await c.selectStore('araxa');
    c.add(dress.id, 'M');
    await c.refreshAvailability();
    expect(c.statusOf('araxa', dressV)).toBe('in_stock');
    await c.selectStore('catalao', 'move');
    // catalão não informou nada → desconhecido, não "em estoque"
    expect(c.statusOf('catalao', dressV)).toBe('unknown');
  });

  it('sem sacola, troca direta', async () => {
    const c = fresh();
    await c.selectStore('araxa');
    expect(c.planSwitch('mineiros').kind).toBe('direct');
    await c.selectStore('mineiros');
    expect(c.get().storeId).toBe('mineiros');
  });
});

describe('favoritos', () => {
  it('alterna e persiste; ignora id desconhecido', () => {
    const c = fresh();
    expect(c.toggleWishlist(dress.id)).toBe(true);
    expect(fresh().isWished(dress.id)).toBe(true);
    expect(c.toggleWishlist(dress.id)).toBe(false);
    expect(fresh().get().wishlist).toEqual([]);
    expect(c.toggleWishlist('nao-existe')).toBe(false);
  });
});

describe('mensagem para a loja e filtros', () => {
  it('lista referências, tamanhos, quantidades e loja', async () => {
    const c = fresh();
    await c.selectStore('mineiros');
    c.add(dress.id, 'G');
    c.add(acc.id, 'Único');
    const msg = buildStoreMessage(STORES.mineiros, c.currentBag());
    expect(msg).toContain('Belle Mineiros');
    expect(msg).toContain(`${dress.title} (${dress.sku}) · tam. G · 1 un.`);
    expect(msg).toContain('tamanho único');
    expect(msg).toMatch(/demonstrativas/);
  });
  it('filtra por categoria, ocasião, tamanho e silhueta', () => {
    const vest = applyFilters(DEMO_CATALOG, { ...DEFAULT_FILTERS, category: 'vestidos' });
    expect(vest.every((p) => p.category === 'vestidos')).toBe(true);
    const fluid = applyFilters(DEMO_CATALOG, { ...DEFAULT_FILTERS, category: 'vestidos', silhouette: 'fluido' });
    expect(fluid.length).toBeGreaterThan(0);
    expect(fluid.every((p) => p.silhouette === 'fluido')).toBe(true);
    const unico = applyFilters(DEMO_CATALOG, { ...DEFAULT_FILTERS, size: 'Único' });
    expect(unico.every((p) => ['pulseiras','bolsas','aneis'].includes(p.category))).toBe(true);
  });
});
