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

export interface Boundary {
  /** Section that receives the state (classes + custom properties). */
  section: string;
  /** Element whose top edge drives progress; defaults to the section. */
  anchor?: string;
  /** Viewport fraction at which the reveal starts (anchor top). */
  start?: number;
  /** Viewport fraction travelled to complete. */
  span?: number;
}

/** Fronteiras V37: uma por passagem, ver docs/qa-v37/MOTION_OWNERSHIP.md. */
export const BOUNDARIES: Boundary[] = [
  { section: '#passarela' },                                  // Cortina
  { section: '#ocasioes', anchor: '.occ-round', span: .42 },  // Colunas
  { section: '#colecao' },                                    // Varredura
  { section: '#lojas', span: .5 },                            // Círculo (luz local)
  { section: '#atendimento' },                                // Cortina lateral
  { section: '#duvidas' },                                    // Dobra
  { section: '.finale', span: .5 },                           // Veludo
];

/** Smoothstep progress; complete while the anchor still sits in the lower viewport. */
export function boundaryProgress(top: number, height: number, start = .98, span = .34): number {
  const vh = Math.max(1, height);
  const p = Math.max(0, Math.min(1, (vh * start - top) / (vh * span)));
  return p * p * (3 - 2 * p);
}

interface Live { section: HTMLElement; anchor: HTMLElement; start: number; span: number; value: number }

export function initEditorialBoundaries(list: Boundary[] = BOUNDARIES): () => void {
  const root = document.documentElement;
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  const live: Live[] = [];
  for (const b of list) {
    const section = document.querySelector<HTMLElement>(b.section);
    if (!section) continue;
    const anchor = (b.anchor && section.querySelector<HTMLElement>(b.anchor)) || section;
    live.push({ section, anchor, start: b.start ?? .98, span: b.span ?? .34, value: -1 });
  }
  let frame = 0, disposed = false;
  const device = navigator as Navigator & { deviceMemory?: number; connection?: { saveData?: boolean } };
  const constrained = device.connection?.saveData === true || (device.deviceMemory !== undefined && device.deviceMemory <= 2);
  const staticMode = () => constrained || reduced.matches || root.dataset.intensity === 'essential';

  function clear(item: Live) {
    item.section.classList.remove('v37-boundary', 'v37-done');
    item.section.style.removeProperty('--v37-entry');
    item.section.style.removeProperty('--v37-light');
    item.value = -1;
  }
  function update() {
    frame = 0;
    if (disposed || document.hidden) return;
    if (staticMode()) { live.forEach(clear); return; }
    const vh = innerHeight;
    // Reads first, then writes: no layout thrash.
    const next = live.map(item => item.section.contains(document.activeElement) ? 1
      : boundaryProgress(item.anchor.getBoundingClientRect().top, vh, item.start, item.span));
    live.forEach((item, i) => {
      const p = next[i]!;
      if (Math.abs(item.value - p) < .001) return;
      item.value = p;
      const s = item.section;
      s.style.setProperty('--v37-entry', p.toFixed(4));
      s.style.setProperty('--v37-light', Math.sin(p * Math.PI).toFixed(4));
      s.classList.add('v37-boundary');
      s.classList.toggle('v37-done', p >= .999);
    });
  }
  const schedule = () => { if (!disposed && !frame && !document.hidden) frame = requestAnimationFrame(update); };
  const modes = new MutationObserver(schedule);
  modes.observe(root, { attributes: true, attributeFilter: ['data-intensity'] });
  const winEvents = ['scroll', 'resize', 'pageshow', 'hashchange'] as const;
  winEvents.forEach(e => window.addEventListener(e, schedule, { passive: true }));
  document.addEventListener('visibilitychange', schedule);
  document.addEventListener('focusin', schedule);
  reduced.addEventListener('change', schedule);
  update();

  const destroy = () => {
    disposed = true; cancelAnimationFrame(frame); modes.disconnect();
    winEvents.forEach(e => window.removeEventListener(e, schedule));
    document.removeEventListener('visibilitychange', schedule);
    document.removeEventListener('focusin', schedule);
    reduced.removeEventListener('change', schedule);
    live.forEach(clear);
  };
  if (import.meta.hot) import.meta.hot.dispose(destroy);
  return destroy;
}
