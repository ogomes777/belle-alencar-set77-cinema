/**
 * FICHA EDITORIAL (M010–M018): a MESMA peça da arara se transforma por FLIP na
 * apresentação; fechar devolve a imagem ao cabide de origem. Um componente reutilizado
 * por todas as peças. Sem modelo real nem preço: estudo 3D rotulado e "preço sob consulta".
 */
import { commerceApi } from '../commerce/api';
import { CATEGORY_LABEL, type Product, type Size } from '../commerce/types';
import { flightOrigin } from '../commerce/flight-origin';
import { bus } from '../core/bus';
import { announce, trapFocus } from '../core/a11y';
import { flyToBag, isFlying } from './flight';
import type { BagWidget } from './bag';

export interface Viewer {
  close(then?: () => void): Promise<void>;
  open(p: Product, from: HTMLImageElement, hideSource: () => void): void;
  bagAnchor(size: number): { x: number; y: number };
}


const EASE = 'cubic-bezier(0.22, 0.82, 0.2, 1)';
const reduce = () => matchMedia('(prefers-reduced-motion: reduce)').matches;

export function createViewer(opts: { bag: BagWidget; onClosed: (id: string) => void }): Viewer {
  const root = document.createElement('div');
  root.className = 'pv';
  root.hidden = true;
  root.innerHTML = `
    <div class="pv__backdrop"></div>
    <div class="pv__panel" role="dialog" aria-modal="true" aria-labelledby="pvTitle">
      <button type="button" class="pv__close" aria-label="Fechar e voltar à arara"><span aria-hidden="true">×</span></button>
      <div class="pv__media"><i class="pv__arch" aria-hidden="true"></i><span class="pv__floor" aria-hidden="true"></span><img class="pv__img" alt=""><span class="badge pv__badge">Packshot sintético · demonstração</span></div>
      <div class="pv__info">
        <p class="pv__eyebrow"></p>
        <h2 class="pv__title" id="pvTitle"></h2>
        <p class="pv__price">Preço sob consulta</p>
        <p class="pv__desc"></p>
        <fieldset class="pv__sizes"><legend>Tamanho</legend><div class="pv__sizerow"></div></fieldset>
        <p class="pv__avail" aria-live="polite"></p>
        <p class="pv__error" role="alert" hidden>Escolha um tamanho para continuar.</p>
        <div class="pv__actions">
          <button type="button" class="btn btn--solid pv__add">Adicionar à sacola</button>
          <button type="button" class="btn btn--line pv__try">Ver no espaço de provador</button>
        </div>
        <p class="fineprint pv__fine">Estudo sintético em vista frontal. Não é uma prova virtual nem uma peça oficial da Belle. Tamanho e disponibilidade são confirmados pela loja.</p>
      </div>
    </div>`;
  document.body.appendChild(root);
  const $ = <T extends HTMLElement>(s: string) => root.querySelector<T>(s)!;
  const panel = $('.pv__panel');
  const img = $<HTMLImageElement>('.pv__img');
  const media = $('.pv__media');
  const addBtn = $<HTMLButtonElement>('.pv__add');
  const err = $('.pv__error');
  const avail = $('.pv__avail');
  let current: Product | null = null;
  let source: HTMLImageElement | null = null;
  let size: Size | null = null;
  let untrap: (() => void) | null = null;
  let closing = false;
  let focusTimer = 0;

  const refreshAvail = () => { if (current) avail.textContent = commerceApi()?.availabilityText(current.id, size) ?? ''; };
  function fitImage(): void {
    if (!current || root.hidden) return;
    const r=media.getBoundingClientRect(), [w,h]=current.cutoutSize ?? [720,1200];
    const scale=Math.min(r.width*.88/w,r.height*.88/h);
    img.style.width=`${w*scale}px`;img.style.height=`${h*scale}px`;
    img.style.top=`${(r.height-h*scale)/2}px`;
  }
  addEventListener('resize',fitImage,{passive:true});
  commerceApi()?.onChange(refreshAvail);

  function flipFrom(rect: DOMRect, reverse = false): Animation | null {
    const to = img.getBoundingClientRect();
    if (!rect.width || !to.width || reduce()) return null;
    const sx = rect.width / to.width;
    const dx = rect.left + rect.width / 2 - (to.left + to.width / 2);
    const dy = rect.top - to.top;
    const from = `translate(${dx}px, ${dy}px) scale(${sx})`;
    const frames = reverse ? [{ transform: 'none' }, { transform: from }] : [{ transform: from }, { transform: 'none' }];
    return img.animate(frames, { duration: reverse ? 560 : 760, easing: EASE, fill: 'both' });
  }

  function open(p: Product, from: HTMLImageElement, hideSource: () => void): void {
    current = p;
    source = from;
    root.dataset.productId = p.id;
    size = null;
    closing = false;
    $('.pv__eyebrow').textContent = `${CATEGORY_LABEL[p.category]} · ${p.sku}`;
    $('.pv__title').textContent = p.title;
    $('.pv__desc').textContent = p.description;
    err.hidden = true;
    addBtn.disabled = false;
    addBtn.textContent = 'Adicionar à sacola';
    const row = $('.pv__sizerow');
    row.innerHTML = p.variants.map((v) => `<label class="pv__size"><input type="radio" name="pv-size" value="${v.size}"><span>${v.size}</span></label>`).join('');
    refreshAvail();
    img.src = p.cutout ?? '';
    img.alt = `${p.title}, packshot sintético demonstrativo`;
    media.style.setProperty('--tone', toneBg(p.tone));
    const rect = from.getBoundingClientRect();
    root.hidden = false;
    fitImage();
    document.documentElement.classList.add('is-locked', 'pv-open');
    hideSource();
    // FLIP: a imagem nasce exatamente sobre o cabide e assenta na ficha
    flipFrom(rect);
    if (!reduce()) {
      root.querySelector('.pv__backdrop')!.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 420, easing: 'ease-out' });
      panel.animate([{ opacity: 0, transform: 'scale(0.965)' }, { opacity: 1, transform: 'none' }], { duration: 520, easing: EASE });
      Array.from($('.pv__info').children).forEach((el, i) =>
        (el as HTMLElement).animate([{ opacity: 0, transform: 'translateY(14px)' }, { opacity: 1, transform: 'none' }], { duration: 560, delay: 160 + i * 55, easing: EASE, fill: 'backwards' }),
      );
    }
    untrap = trapFocus(panel);
    clearTimeout(focusTimer);
    focusTimer = window.setTimeout(() => { if (!root.hidden && !closing) $('.pv__close').focus({ preventScroll: true }); }, 30);
  }

  async function close(then?: () => void): Promise<void> {
    if (!current || closing) return;
    closing = true;
    clearTimeout(focusTimer);
    const id = current.id;
    untrap?.();
    if (source && !reduce()) {
      // devolve a peça ao mesmo cabide (posição atual da arara)
      source.closest('.rack__piece')?.classList.remove('is-hidden');
      const r = source.getBoundingClientRect();
      source.closest('.rack__piece')?.classList.add('is-hidden');
      const a = flipFrom(r, true);
      panel.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 420, delay: 120, easing: 'ease-in', fill: 'forwards' });
      root.querySelector('.pv__backdrop')!.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 480, easing: 'ease-in', fill: 'forwards' });
      $('.pv__info').animate([{ opacity: 1 }, { opacity: 0 }], { duration: 200, fill: 'forwards' });
      await a?.finished.catch(() => undefined);
    }
    root.hidden = true;
    root.getAnimations({ subtree: true }).forEach((an) => an.cancel());
    document.documentElement.classList.remove('is-locked', 'pv-open');
    current = null;
    opts.onClosed(id);
    then?.();
  }

  root.addEventListener('click', (e) => {
    const t = e.target as HTMLElement;
    if (t.closest('.pv__close') || t.classList.contains('pv__backdrop')) void close();
  });
  root.addEventListener('change', (e) => {
    const t = e.target as HTMLInputElement;
    if (t.name === 'pv-size') { size = t.value as Size; err.hidden = true; refreshAvail(); }
  });
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && !root.hidden && !isFlying()) void close();
  });

  addBtn.addEventListener('click', () => {
    const p = current;
    const api = commerceApi();
    if (!p || !api || isFlying()) return;
    if (!size) {
      err.hidden = false;
      root.querySelector<HTMLInputElement>('input[name="pv-size"]')?.focus();
      return;
    }
    const chosen = size;
    const selectedCity = api.storeCity();
    const go = () => {
      addBtn.disabled = true;
      addBtn.setAttribute('aria-busy', 'true');
      addBtn.animate?.([{ transform: 'scale(1)' }, { transform: 'scale(0.97)' }, { transform: 'scale(1)' }], { duration: 160 });
      const origin = flightOrigin(img, p, 'cutout');
      void flyToBag({
        from: origin,
        image: p.cutout ?? img.src, productId: p.id,
        target: {
          mouth: () => opts.bag.mouth(),
          ghostZ: 72,
          impact: () => {
            opts.bag.impact();
            const hb = document.getElementById('bagButton');
            hb?.classList.remove('is-bump');
            void hb?.offsetWidth;
            hb?.classList.add('is-bump');
          },
        },
        onImpact: () => {
          if (api.storeCity() !== selectedCity) { announce('A loja mudou. Confirme a peça novamente.'); return; }
          const r = api.add(p.id, chosen);
          if (r.ok) announce(`${p.title}, tamanho ${chosen}, está na sacola de ${api.storeCity()}.`);
        },
      }).finally(() => {
        origin.remove();
        addBtn.removeAttribute('aria-busy');
        addBtn.disabled = false;
        addBtn.textContent = 'Na sacola ✓ · adicionar outra';
      });
    };
    if (!api.hasStore()) {
      announce('Escolha sua loja para adicionar à sacola.');
      api.ensureStore(addBtn, go);
    } else go();
  });

  $('.pv__try').addEventListener('click', () => {
    const p = current;
    if (!p) return;
    void close(() => bus.emit('dress:try', { silhouette: p.silhouette ?? 'fluido', tone: p.tone, label: p.title, productId: p.id }));
  });

  return {
    open, close,
    bagAnchor(sz) {
      if (innerWidth < 900) {
        const m = media.getBoundingClientRect();
        return { x: m.right - sz - 10, y: m.bottom - sz - 8 };
      }
      return { x: 26, y: innerHeight - sz - 26 };
    },
  };
}

function toneBg(t: string): string {
  return t === 'noite' || t === 'vinho' ? '#efe6d6' : '#f6efe3';
}
