/** Quick view acessível com FLIP card → painel e escolha de tamanho. */
import { productImage } from '../media';
import { flightOrigin } from '../flight-origin';
import '../media.css';
import type { BagWidget } from '../../rack/bag';
import { h } from '../../core/dom';
import { bus } from '../../core/bus';
import { announce } from '../../core/a11y';
import { createOverlay } from './overlay';
import { loadGsap } from './motion';
import { STORES } from '../stores';
import { CATEGORY_LABEL, OCCASION_LABEL, type Product, type Size } from '../types';
import { formatPrice } from '../format';
import { AVAILABILITY_LABEL } from '../availability';
import { setParam } from '../url';
import { heart, arrow } from './icons';
import { toast } from './toast';
import type { Ctx } from './context';

export function createQuickView(ctx: Ctx) {
  let current: Product | null = null;
  let size: Size | null = null;
  let adding = false;
  let targetBag: BagWidget | null = null;
  let bagTimer = 0;
  let pendingOpen = 0;
  const ov = createOverlay({
    id: 'quickView', labelledBy: 'qvTitle', variant: 'drawer', className: 'ov--qv',
    onClose: () => { setParam('peca', null); current = null; if (!adding) targetBag?.show(false); },
  });

  function availText(): string {
    const sid = ctx.commerce.get().storeId;
    if (!sid) return 'Escolha sua loja para consultar disponibilidade.';
    const city = STORES[sid].city;
    if (!current || !size) return `Disponibilidade: consultar a loja de ${city}.`;
    const v = current.variants.find((x) => x.size === size);
    const st = v ? ctx.commerce.statusOf(sid, v.id) : 'unknown';
    return st === 'unknown' ? `Disponibilidade: consultar a loja de ${city}.` : `${AVAILABILITY_LABEL[st]} em ${city}.`;
  }

  function render(p: Product) {
    const single = p.variants.length === 1;
    size = single ? p.variants[0]!.size : null;
    const media = h('div', { class: 'qv__media' });
    const image = h('span', { class: 'qv__ill qv__ill--cutout', 'data-flip-id': `ill-${p.id}` });
    image.append(productImage(p, { eager: true }));
    media.append(image, h('span', { class: 'badge', text: 'Packshot sintético · demonstração' }));
    // zoom do detalhe: botão acessível + lupa que acompanha ponteiro/dedo
    const zoomBtn = h('button', { type: 'button', class: 'qv__zoom', 'aria-pressed': 'false', text: 'Ampliar' });
    const setZoom = (on: boolean) => {
      media.classList.toggle('is-zoomed', on);
      zoomBtn.setAttribute('aria-pressed', String(on));
      zoomBtn.textContent = on ? 'Reduzir' : 'Ampliar';
    };
    zoomBtn.addEventListener('click', () => setZoom(!media.classList.contains('is-zoomed')));
    media.addEventListener('pointermove', (ev) => {
      const r = media.getBoundingClientRect();
      media.style.setProperty('--zx', `${(((ev.clientX - r.left) / r.width) * 100).toFixed(1)}%`);
      media.style.setProperty('--zy', `${(((ev.clientY - r.top) / r.height) * 100).toFixed(1)}%`);
    });
    media.querySelector('.qv__ill')?.addEventListener('click', () => setZoom(!media.classList.contains('is-zoomed')));
    media.append(zoomBtn);

    const sizes = h('fieldset', { class: 'sizes' },
      h('legend', { text: single ? 'Interesse em tamanho único' : 'Tamanho de interesse · grade a confirmar' }),
      ...p.variants.map((v) =>
        h('label', { class: 'size' },
          h('input', { type: 'radio', name: 'qv-size', value: v.size, checked: single }),
          h('span', { text: v.size === 'Único' ? 'Único' : v.size }),
        ),
      ),
    );
    const avail = h('p', { class: 'qv__avail', 'data-avail': true, text: availText() });
    const err = h('p', { class: 'qv__error', role: 'alert', hidden: true, text: 'Escolha um tamanho para continuar.' });
    const wished = ctx.commerce.isWished(p.id);
    const actions = h('div', { class: 'qv__actions' },
      h('button', { type: 'button', class: 'btn btn--solid', 'data-add': true, text: 'Adicionar à sacola de interesse' }),
      h('button', { type: 'button', class: 'btn btn--line wish-btn wish-btn--wide', 'data-qv-wish': true, 'aria-pressed': String(wished), html: `${heart}<span>${wished ? 'Nos favoritos' : 'Favoritar'}</span>` }),
    );
    const extra = p.illustration.kind === 'dress' && p.silhouette
      ? h('button', { type: 'button', class: 'link-btn qv__try', 'data-try': true, html: `Ver no provador ${arrow}` })
      : null;

    ov.body.replaceChildren(
      h('div', { class: 'qv' },
        media,
        h('div', { class: 'qv__info' },
          h('p', { class: 'eyebrow', text: `${CATEGORY_LABEL[p.category]} · ${OCCASION_LABEL[p.occasion]}` }),
          h('h2', { class: 'qv__title', id: 'qvTitle', text: p.title }),
          h('p', { class: 'qv__sku', text: `${p.sku} · referência demonstrativa` }),
          h('p', { class: 'qv__price', text: formatPrice(p.price) }),
          h('p', { class: 'qv__desc', text: p.description }),
          sizes, avail, err, actions, extra,
          h('p', { class: 'fineprint', text: 'Estudo sintético demonstrativo. Não representa uma peça real, grade disponível ou estoque da Belle. O provador é uma apresentação frontal; não simula vestir nem giro 360°.' }),
        ),
      ),
    );
  }

  ov.body.addEventListener('change', (e) => {
    const t = e.target as HTMLInputElement;
    if (t.name === 'qv-size') {
      size = t.value as Size;
      ov.body.querySelector<HTMLElement>('.qv__error')!.hidden = true;
      ov.body.querySelector<HTMLElement>('[data-avail]')!.textContent = availText();
    }
  });

  ov.body.addEventListener('click', (e) => {
    const t = e.target as HTMLElement;
    if (!current) return;
    const p = current;
    if (t.closest('[data-add]')) {
      if (!size) {
        const err = ov.body.querySelector<HTMLElement>('.qv__error')!;
        err.hidden = false;
        ov.body.querySelector<HTMLInputElement>('input[name="qv-size"]')?.focus();
        return;
      }
      if (adding) return;
      const chosen = size;
      const doAdd = () => {
        const storeId = ctx.commerce.get().storeId;
        if (!storeId || adding) return;
        const button = ov.body.querySelector<HTMLButtonElement>('[data-add]');
        const commit = () => {
          if (ctx.commerce.get().storeId !== storeId) {
            toast('A loja mudou durante a animação. Confira a unidade e adicione novamente.', 'warn');
            return;
          }
          const result = ctx.commerce.add(p.id, chosen);
          if (result.ok) {
            toast(`${p.title} (${chosen}) está na sacola de ${STORES[storeId].city}.`);
            if (button && ov.isOpen()) button.textContent = 'Adicionado à sacola ✓';
          } else if (result.reason) toast(result.reason, 'warn');
        };
        const source = ov.body.querySelector<HTMLImageElement>('.qv__ill img');
        // Reduced motion and unavailable visible origins keep the same synchronous commerce path.
        if (ctx.reduced() || !source || source.getBoundingClientRect().width < 4 || !ov.isOpen()) {
          commit();
          return;
        }
        adding = true;
        if (button) { button.disabled = true; button.setAttribute('aria-busy', 'true'); }
        void (async () => {
          let origin: HTMLElement | null = null;
          let committed = false;
          try {
            const [flight, bagModule] = await Promise.all([import('../../rack/flight'), import('../../rack/bag'), import('../../styles/rack.css')]);
            if (flight.isFlying()) return;
            if (!targetBag) {
              targetBag = bagModule.createBag(() => { if (!adding) ctx.openBag(document.getElementById('bagButton')); });
              targetBag.front.setAttribute('aria-hidden', 'true');
              targetBag.front.tabIndex = -1;
              targetBag.front.dataset.commerceBag = 'true';
              targetBag.back.dataset.commerceBag = 'true';
            }
            clearTimeout(bagTimer);
            const size = innerWidth < 600 ? 76 : 100;
            targetBag.place(innerWidth - size - 18, innerHeight - size - 18, size);
            targetBag.setLayer('overlay'); targetBag.setCount(ctx.commerce.currentBag().reduce((n,it) => n + it.qty, 0));
            targetBag.show(true);
            origin = flightOrigin(source, p);
            source.classList.add('is-departing');
            await flight.flyToBag({
              from: origin, image: p.cutout!, productId: p.id,
              target: { mouth: () => targetBag!.mouth(), ghostZ: 72, impact: () => targetBag!.impact() },
              onImpact: () => { committed = true; commit(); targetBag!.setCount(ctx.commerce.currentBag().reduce((n,it) => n + it.qty, 0)); },
            });
          } catch {
            if (!committed) commit();
          } finally {
            origin?.remove(); source.classList.remove('is-departing'); adding = false;
            if (button) { button.disabled = false; button.removeAttribute('aria-busy'); }
            bagTimer = window.setTimeout(() => targetBag?.show(false), 550);
          }
        })();
      };
      if (!ctx.commerce.get().storeId) {
        announce('Escolha sua loja para adicionar à sacola.');
        ctx.openStorePicker(t.closest('button'), doAdd);
      } else doAdd();
      return;
    }
    const w = t.closest<HTMLElement>('[data-qv-wish]');
    if (w) {
      const on = ctx.commerce.toggleWishlist(p.id);
      w.setAttribute('aria-pressed', String(on));
      w.querySelector('span')!.textContent = on ? 'Nos favoritos' : 'Favoritar';
      if (on && !ctx.reduced()) { w.classList.remove('is-burst'); void w.offsetWidth; w.classList.add('is-burst'); }
      return;
    }
    if (t.closest('[data-try]') && p.silhouette) {
      bus.emit('dress:try', { silhouette: p.silhouette, tone: p.tone, label: p.title, productId: p.id });
      ov.close({ restoreFocus: false });
      ctx.scrollTo('provador');
    }
  });

  ctx.commerce.subscribe((s, prev) => {
    if (ov.isOpen() && (s.storeId !== prev.storeId || s.availability !== prev.availability)) {
      const a = ov.body.querySelector<HTMLElement>('[data-avail]');
      if (a) a.textContent = availText();
    }
  });

  return {
    async open(productId: string, trigger?: HTMLElement | null, flipFrom?: HTMLElement | null) {
      if (adding) return;
      const request = ++pendingOpen;
      const p = ctx.commerce.product(productId);
      if (!p) return;
      const canFlip = !!flipFrom && !ctx.reduced();
      const mod = canFlip ? await loadGsap() : null;
      if (request !== pendingOpen) return;
      const state = mod && flipFrom ? mod.Flip.getState(flipFrom) : null;
      current = p;
      render(p);
      setParam('peca', p.slug);
      ov.open(trigger, { flip: !!state });
      if (mod && state) {
        const target = ov.body.querySelector<HTMLElement>('.qv__ill');
        if (target) {
          mod.Flip.from(state, { targets: target, duration: 0.72, ease: 'power3.inOut', absolute: true, scale: true });
          mod.gsap.from(ov.body.querySelectorAll('.qv__info > *'), { opacity: 0, y: 18, duration: 0.5, ease: 'power2.out', stagger: 0.035, delay: 0.22, clearProps: 'all' });
        }
      }
    },
    close: () => ov.close(),
  };
}
