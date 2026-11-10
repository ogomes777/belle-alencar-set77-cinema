/**
 * Comércio multiloja (pré-lançamento): catálogo demonstrativo, favoritos e
 * sacola de interesse por filial. Sem checkout real: ver docs/STORE_COMMERCE_CONTRACT.md.
 */
import '../styles/commerce.css';
import { bus } from '../core/bus';
import { createCommerce } from './state';
import { DEMO_CATALOG, productBySlug } from './catalog.demo';
import { DemoAvailabilityProvider } from './availability';
import { STORES } from './stores';
import { parseUrl, setParam } from './url';
import { plural } from './format';
import { preferenceSync } from './checkout';
import type { Category, StoreId } from './types';
import type { Silhouette } from '../core/dress';
import type { Ctx } from './ui/context';
import { createStorePicker, createSwitchDialog } from './ui/storePicker';
import { createCatalog } from './ui/catalog';
import { createQuickView } from './ui/quickView';
import { createBag, createWishlist } from './ui/bag';
import { createSearch } from './ui/search';
import { bindHeader } from './ui/header';
import { loadGsap } from './ui/motion';
import { toast } from './ui/toast';

export function initCommerce(): void {
  const commerce = createCommerce({ provider: new DemoAvailabilityProvider(), catalog: DEMO_CATALOG });
  const reduced = () => matchMedia('(prefers-reduced-motion: reduce)').matches;

  // late-binding: os módulos de UI recebem o mesmo objeto ctx, completado abaixo
  const ctx = {} as Ctx;
  const picker = createStorePicker(ctx);
  const switcher = createSwitchDialog();

  async function chooseStore(id: StoreId, trigger?: HTMLElement | null): Promise<void> {
    const plan = commerce.planSwitch(id);
    if (plan.kind === 'same') {
      picker.close();
      return;
    }
    let choice: 'move' | 'keep' | 'cancel' | undefined;
    if (plan.kind === 'resolve') {
      picker.close();
      choice = await switcher.ask(plan, trigger ?? document.getElementById('storeButton'));
      if (choice === 'cancel') return;
    }
    const res = await commerce.selectStore(id, choice);
    picker.close();
    if (!res.changed) return;
    setParam('loja', id);
    void preferenceSync.push(id);
    const city = STORES[id].city;
    if (choice === 'move') {
      toast(
        res.unavailable.length
          ? `${plural(res.unavailable.length, 'peça marcada', 'peças marcadas')} como indisponível em ${city}. Confira na sacola.`
          : `Sacola levada para ${city}. Disponibilidade: consultar a loja.`,
        res.unavailable.length ? 'warn' : 'info',
      );
    } else {
      toast(`Sua loja agora é Belle ${city}.`);
    }
  }

  const scrollTo = (id: string) => {
    const el = document.getElementById(id);
    if (!el) return;
    el.scrollIntoView({ behavior: reduced() ? 'auto' : 'smooth', block: 'start' });
    if (!el.hasAttribute('tabindex')) el.setAttribute('tabindex', '-1');
    el.focus({ preventScroll: true });
  };

  ctx.commerce = commerce;
  ctx.reduced = reduced;
  ctx.openStorePicker = (trigger, then) => picker.open(trigger, then);
  ctx.chooseStore = chooseStore;
  ctx.scrollTo = scrollTo;

  const mount = document.getElementById('catalogMount');
  const catalog = mount ? createCatalog(ctx, mount) : null;
  const qv = createQuickView(ctx);
  const bag = createBag(ctx);
  const wish = createWishlist(ctx);
  const search = createSearch(ctx);

  ctx.openQuickView = (id, trigger, flipFrom) => void qv.open(id, trigger, flipFrom);
  ctx.openBag = (t) => bag.open(t);
  ctx.openWishlist = (t) => wish.open(t);
  ctx.openSearch = (t) => search.open(t);
  ctx.applyCategory = (category: Category | 'todas', silhouette: Silhouette | null = null, scroll = true) => {
    catalog?.setCategory(category, silhouette);
    setParam('categoria', category === 'todas' ? null : category);
    if (scroll) scrollTo('colecao');
  };

  bindHeader(ctx);
  catalog?.onFirstHover(() => {
    if (!reduced()) void loadGsap();
  });
  bus.on('catalog:filter', ({ category, silhouette }) =>
    ctx.applyCategory(category as Category, silhouette ?? null, true),
  );

  // Intenção da URL. Nunca abre o seletor de loja sozinho (AUDIT_V3 A2).
  const intent = parseUrl(location.search);
  if (intent.storeId && intent.storeId !== commerce.get().storeId) {
    // sacolas são por loja: "manter" não descarta nada da loja anterior
    const plan = commerce.planSwitch(intent.storeId);
    void commerce.selectStore(intent.storeId, plan.kind === 'resolve' ? 'keep' : undefined);
  }
  if (intent.category) catalog?.setCategory(intent.category);
  if (intent.productSlug) {
    const p = productBySlug(intent.productSlug);
    if (p) ctx.openQuickView(p.id, null, null);
  }
}
