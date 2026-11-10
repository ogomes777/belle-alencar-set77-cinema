/**
 * Bolsa física da arara (design próprio Belle: couro marfim, ferragens douradas).
 * Duas camadas fixas e alinhadas — FUNDO (alça + interior) e FRENTE (lábio frontal +
 * contador) — para a miniatura do vestido passar ENTRE elas e sumir atrás do lábio.
 */
export interface BagWidget {
  back: HTMLElement;
  front: HTMLElement;
  /** boca da bolsa em coordenadas de viewport */
  mouth(): { x: number; y: number; w: number };
  rect(): DOMRect;
  setCount(n: number): void;
  impact(): void;
  place(x: number, y: number, size: number): void;
  setLayer(mode: 'scene' | 'overlay'): void;
  show(on: boolean): void;
}

const BACK = `<svg viewBox="0 0 120 120" aria-hidden="true">
  <defs>
    <linearGradient id="bgBack" x1="0" x2="0" y1="0" y2="1"><stop offset="0" stop-color="#e9dcc6"/><stop offset="1" stop-color="#cdb999"/></linearGradient>
    <linearGradient id="bgStrap" x1="0" x2="1"><stop offset="0" stop-color="#b8955a"/><stop offset=".5" stop-color="#f1d9a2"/><stop offset="1" stop-color="#a8854c"/></linearGradient>
  </defs>
  <g class="bagw__strap"><path d="M33 47 C34 14 86 14 87 47" fill="none" stroke="url(#bgStrap)" stroke-width="4.2" stroke-linecap="round"/>
    <circle cx="33" cy="47" r="3.2" fill="#c09a5b"/><circle cx="87" cy="47" r="3.2" fill="#c09a5b"/></g>
  <path d="M20 44 H100 L106 110 Q60 116 14 110 Z" fill="url(#bgBack)"/>
  <ellipse cx="60" cy="46" rx="39" ry="6.5" fill="#5b4632"/>
  <ellipse cx="60" cy="47.5" rx="35" ry="4.5" fill="#3d2f22"/>
</svg>`;

const FRONT = `<svg viewBox="0 0 120 120" aria-hidden="true">
  <defs>
    <linearGradient id="bgFront" x1="0" x2="1"><stop offset="0" stop-color="#e4d4b9"/><stop offset=".45" stop-color="#f8efe0"/><stop offset="1" stop-color="#d9c6a6"/></linearGradient>
    <linearGradient id="bgShade" x1="0" x2="0" y1="0" y2="1"><stop offset="0" stop-color="#000" stop-opacity="0"/><stop offset="1" stop-color="#000" stop-opacity=".14"/></linearGradient>
  </defs>
  <path d="M19 48 Q60 53 101 48 L106 110 Q60 116 14 110 Z" fill="url(#bgFront)"/>
  <path d="M19 48 Q60 53 101 48 L106 110 Q60 116 14 110 Z" fill="url(#bgShade)"/>
  <path d="M19 48 Q60 53 101 48" fill="none" stroke="#b8955a" stroke-width="1.6"/>
  <path d="M16 104 Q60 110 104 104" fill="none" stroke="#000" stroke-opacity=".08" stroke-width="1"/>
  <rect x="53" y="56" width="14" height="11" rx="2.5" fill="#c09a5b"/><rect x="56.5" y="59" width="7" height="5" rx="1.5" fill="#e8cf96"/>
</svg>`;

let bagId = 0;

export function createBag(onOpen: (trigger: HTMLElement) => void): BagWidget {
  const prefix = `bag-${++bagId}-`;
  const unique = (svg: string) => svg.replace(/bg(Back|Strap|Front|Shade)/g, name => prefix + name);
  const back = document.createElement('div');
  back.className = 'bagw bagw--back';
  back.innerHTML = unique(BACK);
  back.setAttribute('aria-hidden', 'true');
  const front = document.createElement('button');
  front.type = 'button';
  front.className = 'bagw bagw--front';
  front.innerHTML = `${unique(FRONT)}<span class="bagw__glint" aria-hidden="true"></span><span class="bagw__count" hidden>0</span>`;
  front.setAttribute('aria-label', 'Abrir sacola de interesse');
  front.addEventListener('click', () => onOpen(front));
  document.body.append(back, front);
  const countEl = front.querySelector<HTMLElement>('.bagw__count')!;

  const api: BagWidget = {
    back,
    front,
    mouth() {
      const r = front.getBoundingClientRect();
      return { x: r.left + r.width * 0.5, y: r.top + r.height * (47 / 120), w: r.width * 0.62 };
    },
    rect: () => front.getBoundingClientRect(),
    setCount(n) {
      countEl.hidden = n <= 0;
      countEl.textContent = String(n);
      front.setAttribute('aria-label', `Abrir sacola de interesse, ${n} ${n === 1 ? 'peça' : 'peças'}`);
    },
    impact() {
      for (const el of [back, front]) {
        el.classList.remove('is-impact');
        void el.offsetWidth; // reinicia a animação
        el.classList.add('is-impact');
      }
      countEl.classList.remove('is-pop');
      void countEl.offsetWidth;
      countEl.classList.add('is-pop');
    },
    place(x, y, size) {
      for (const el of [back, front]) {
        el.style.width = el.style.height = `${size}px`;
        el.style.transform = `translate3d(${x.toFixed(1)}px, ${y.toFixed(1)}px, 0)`;
      }
    },
    setLayer(mode) {
      for (const el of [back, front]) el.dataset.layer = mode;
    },
    show(on) {
      for (const el of [back, front]) el.classList.toggle('is-on', on);
    },
  };
  return api;
}
