/**
 * Entrada lazy do 3D (chunk separado: three + gsap + cena).
 * Só é baixado em tiers CINEMA/TOUCH, depois da primeira pintura.
 */
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { World, type WorldOptions } from './world';

gsap.registerPlugin(ScrollTrigger);
// tempo real: em aparelho lento o texto não fica "preso" no meio da animação
gsap.ticker.lagSmoothing(0);

export async function createWorld(opts: WorldOptions): Promise<World> {
  // letreiros em canvas precisam da tipografia carregada
  if ('fonts' in document) {
    await Promise.race([
      Promise.all([
        document.fonts.load("400 64px 'Cormorant Garamond'"),
        document.fonts.load("italic 400 64px 'Cormorant Garamond'"),
        document.fonts.load("600 32px 'DM Sans Variable'"),
      ]),
      new Promise((r) => setTimeout(r, 1500)),
    ]).catch(() => undefined);
  }
  return new World(opts);
}

/**
 * Tipografia cinética: títulos dos capítulos entram por máscara de linha
 * quando o cartão chega na tela (uma vez). Conteúdo nunca fica oculto sem JS
 * e o título do herói não é re-animado (já está visível sob a intro).
 */
export function initReveals(root: HTMLElement): void {
  const titles = Array.from(root.querySelectorAll<HTMLElement>('.chapter:not(.chapter--hero) [data-split]'));
  titles.forEach((el) => {
    if (el.dataset.splitDone) return;
    el.dataset.splitDone = '1';
    const words: HTMLElement[] = [];
    const walk = (node: Node) => {
      Array.from(node.childNodes).forEach((child) => {
        if (child.nodeType === Node.TEXT_NODE) {
          const frag = document.createDocumentFragment();
          (child.textContent ?? '').split(/(\s+)/).forEach((part) => {
            if (!part) return;
            if (/^\s+$/.test(part)) { frag.append(part); return; }
            const mask = document.createElement('span');
            mask.className = 'w-mask';
            const w = document.createElement('span');
            w.className = 'w';
            w.textContent = part;
            mask.append(w);
            frag.append(mask);
            words.push(w);
          });
          child.replaceWith(frag);
        } else if (child.nodeType === Node.ELEMENT_NODE && (child as Element).tagName !== 'BR') {
          walk(child);
        }
      });
    };
    walk(el);
    const card = el.closest('.chapter') ?? el;
    gsap.set(words, { yPercent: 110 });
    ScrollTrigger.create({
      trigger: card,
      start: 'top 65%',
      once: true,
      onEnter: () => gsap.to(words, { yPercent: 0, duration: 1.1, ease: 'expo.out', stagger: 0.045 }),
    });
    // capítulos já passados (deep link) aparecem sem animação
    if (card.getBoundingClientRect().top < innerHeight * 0.65) gsap.set(words, { yPercent: 0 });
  });
  ScrollTrigger.refresh();
}
