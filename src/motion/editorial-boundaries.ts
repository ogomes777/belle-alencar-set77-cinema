/**
 * V37 · editorial boundary reveals.
 *
 * One rAF controller, one normalised progress [0,1] per boundary, derived from
 * the geometry of an ANCHOR that this module never transforms or masks the
 * geometry of (mask/clip-path/translate do not change layout boxes, and the
 * anchor is never translated). CSS consumes `--v37-entry` / `--v37-light`.
 *
 * Ownership: this module writes only two custom properties and two classes on
 * the boundary <section>. It never touches commerce nodes, the 3D film, the
 * occasions carousel transforms, the collection reveal, the how-film scrub or
 * the stores scrub. When a boundary completes (`v37-done`) every mask is
 * dropped, so nothing persists over content; scrolling back re-enters it.
 */
import '../styles/editorial-boundaries.css';
import { viewTop, onGeometryChange } from '../core/scroll-geometry';

export interface Boundary {
  /** Section that receives the state (classes + custom properties). */
  section: string;
  /** Element whose top edge drives progress; defaults to the section. */
  anchor?: string;
  /** Viewport fraction at which the reveal starts (anchor top). */
  start?: number;
  /** Viewport fraction travelled to complete. */
  span?: number;
  /** Decorative reveal veil family (aria-hidden, removed on destroy). */
  veil?: string;
  /** Short decorative title shown on the veil before the reveal: [roman, italic]. */
  title?: [string, string];
  /** Chapter line above the title, e.g. "02 · Ocasiões". */
  chapter?: string;
}

/** Number of compositor-only panels each veil family is cut into. */
const PIECES: Record<string, number> = { colunas: 5 };

/** Fronteiras V37: uma por passagem, ver docs/qa-v37/MOTION_OWNERSHIP.md. */
export const BOUNDARIES: Boundary[] = [
  { section: '#passarela', veil: 'cortina', chapter: '01 · Passarela', title: ['A passarela', '.'] },
  { section: '#ocasioes', veil: 'colunas', chapter: '02 · Ocasiões', title: ['Para cada', ' momento.'] },
  { section: '#colecao', veil: 'varredura', chapter: '03 · Coleção', title: ['A coleção', '.'] },
  { section: '#como-comprar', veil: 'dobra', chapter: '04 · Como comprar', title: ['Do clique', ' à loja.'] },
  { section: '#lojas', veil: 'circulo', chapter: '05 · Lojas', title: ['Quatro cidades', '.'] },
  // V43: permuta de micro-intros. Identidades visuais, não os blocos de conteúdo.
  // O capítulo 06 segue antes do 07 para manter a ordem narrativa.
  { section: '#atendimento', veil: 'veludo', chapter: '06 · Assinatura', title: ['Belle', ' Alencar.'] },
  { section: '.finale', veil: 'lateral', chapter: '07 · Atendimento', title: ['Com', ' você.'] },
];

/** Smoothstep progress; complete while the anchor still sits in the lower viewport. */
export function boundaryLinear(top: number, height: number, start = .98, span = .9): number {
  const vh = Math.max(1, height);
  return Math.max(0, Math.min(1, (vh * start - top) / (vh * span)));
}
export function boundaryProgress(top: number, height: number, start = .98, span = .9): number {
  const p = boundaryLinear(top, height, start, span);
  return p * p * (3 - 2 * p);
}

interface Live { section: HTMLElement; anchor: HTMLElement; start: number; span: number; value: number; veil?: HTMLElement; skip: boolean; reached: boolean; skipAt: number }

export function initEditorialBoundaries(list: Boundary[] = BOUNDARIES): () => void {
  const root = document.documentElement;
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  const live: Live[] = [];
  for (const b of list) {
    const section = document.querySelector<HTMLElement>(b.section);
    if (!section) continue;
    const anchor = (b.anchor && section.querySelector<HTMLElement>(b.anchor)) || section;
    let veil: HTMLElement | undefined;
    if (b.veil) {
      veil = document.createElement('div');
      veil.className = `v37-veil v37-veil--${b.veil}`;
      veil.setAttribute('aria-hidden', 'true');
      const n = PIECES[b.veil] ?? 1;
      for (let i = 0; i < n; i++) {
        const piece = document.createElement('span');
        piece.className = 'v37-veil__piece';
        piece.style.setProperty('--i', String(i));
        veil.append(piece);
      }
      if (b.title) {
        const el = (tag: string, cls: string) => { const e = document.createElement(tag); e.className = cls; return e; };
        const stage = el('div', 'v37-veil__stage');
        const chapter = el('span', 'v37-veil__chapter');
        chapter.textContent = b.chapter ?? '';
        const mask = el('span', 'v37-veil__mask');
        const t = el('span', 'v37-veil__title');
        const em = document.createElement('em');
        em.textContent = b.title[1];
        t.append(b.title[0], em);
        mask.append(t);
        stage.append(chapter, mask, el('span', 'v37-veil__rule'));
        veil.append(stage);
      }
      section.appendChild(veil);
    }
    live.push({ section, anchor, start: b.start ?? .98, span: b.span ?? .9, value: -1, veil, skip: false, reached: false, skipAt: 0 });
  }
  let frame = 0, disposed = false;
  const device = navigator as Navigator & { deviceMemory?: number; connection?: { saveData?: boolean } };
  const constrained = device.connection?.saveData === true || (device.deviceMemory !== undefined && device.deviceMemory <= 2);
  const staticMode = () => constrained || reduced.matches || root.dataset.intensity === 'essential';

  function clear(item: Live) {
    item.section.classList.remove('v37-boundary', 'v37-done');
    for (const el of [item.section, item.veil]) {
      el?.style.removeProperty('--v37-entry');
      el?.style.removeProperty('--v37-lin');
    }
    item.value = -1;
  }
  function update() {
    frame = 0;
    if (disposed || document.hidden) return;
    if (staticMode()) { live.forEach(clear); return; }
    const vh = innerHeight;
    // Reads first, then writes: no layout thrash.
    const next = live.map(item => {
      const top = viewTop(item.anchor); // cached: no forced layout per frame
      // A menu/hash jump lands with the section already revealed; the skip
      // ends once the section is scrolled back below the viewport.
      // With smooth scrolling the section is still far away on the first
      // frames, so the skip only ends after it was reached and then left
      // below the viewport (or after a 4s safety window if never reached).
      if (item.skip) {
        if (top <= vh * .5) item.reached = true;
        if ((item.reached && top > vh) || (!item.reached && performance.now() - item.skipAt > 4000)) item.skip = false;
      }
      return item.skip || item.section.contains(document.activeElement) ? 1
        : boundaryLinear(top, vh, item.start, item.span);
    });
    live.forEach((item, i) => {
      const lin = next[i]!;
      if (Math.abs(item.value - lin) < .001) return;
      item.value = lin;
      const p = lin * lin * (3 - 2 * lin);
      const s = item.section;
      // Custom properties go on the veil (their only consumer) so each frame
      // restyles one small subtree, not the whole section (48 cards in #colecao).
      const target = item.veil ?? s;
      target.style.setProperty('--v37-entry', p.toFixed(4));
      target.style.setProperty('--v37-lin', lin.toFixed(4));
      if (!s.classList.contains('v37-boundary')) s.classList.add('v37-boundary');
      const done = p >= .999;
      if (s.classList.contains('v37-done') !== done) s.classList.toggle('v37-done', done);
    });
  }
  const schedule = () => { if (!disposed && !frame && !document.hidden) frame = requestAnimationFrame(update); };
  const markJump = (hash: string) => {
    if (!hash || hash.length < 2) return;
    let target: Element | null = null;
    try { target = document.querySelector(hash); } catch { return; }
    live.forEach(item => { if (target && (item.section === target || item.section.contains(target))) { item.skip = true; item.reached = false; item.skipAt = performance.now(); } });
    schedule();
  };
  const onHash = () => markJump(location.hash);
  const onClick = (e: MouseEvent) => {
    const a = (e.target as Element | null)?.closest?.('a[href^="#"]');
    if (a) markJump(a.getAttribute('href') || '');
  };
  window.addEventListener('hashchange', onHash);
  document.addEventListener('click', onClick, true);
  onHash();
  const offGeometry = onGeometryChange(schedule);
  const modes = new MutationObserver(schedule);
  modes.observe(root, { attributes: true, attributeFilter: ['data-intensity'] });
  const winEvents = ['scroll', 'resize', 'pageshow', 'hashchange'] as const;
  winEvents.forEach(e => window.addEventListener(e, schedule, { passive: true }));
  document.addEventListener('visibilitychange', schedule);
  document.addEventListener('focusin', schedule);
  reduced.addEventListener('change', schedule);
  update();

  const destroy = () => {
    disposed = true; cancelAnimationFrame(frame); modes.disconnect(); offGeometry();
    winEvents.forEach(e => window.removeEventListener(e, schedule));
    document.removeEventListener('visibilitychange', schedule);
    document.removeEventListener('focusin', schedule);
    reduced.removeEventListener('change', schedule);
    window.removeEventListener('hashchange', onHash);
    document.removeEventListener('click', onClick, true);
    live.forEach(clear);
    live.forEach(item => item.veil?.remove());
  };
  if (import.meta.hot) import.meta.hot.dispose(destroy);
  return destroy;
}
