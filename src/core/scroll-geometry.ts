/**
 * Shared scroll geometry: per-frame scroll effects read cached document
 * offsets plus the scroll position captured at scroll-event time (when layout
 * is clean), so no rAF callback has to call getBoundingClientRect() after
 * another module already wrote styles — the forced-layout pattern that cost
 * ~2s per full mobile scroll in the V37 profile.
 *
 * Cache is invalidated on resize, document size change (ResizeObserver),
 * load and font loading. (Not on scrollend: browsers fire it after every
 * wheel burst/programmatic jump, which would defeat the cache.)
 */
export interface DocBox { top: number; left: number; width: number; height: number }

let y = typeof window !== 'undefined' ? window.scrollY : 0;
let version = 0;
let started = false;
const boxes = new WeakMap<Element, { v: number; box: DocBox }>();
const listeners = new Set<() => void>();

function invalidate() {
  version++;
  listeners.forEach(fn => fn());
}

function start() {
  if (started || typeof window === 'undefined') return;
  started = true;
  // Capture phase on window: runs before bubbling scroll listeners write styles.
  window.addEventListener('scroll', () => { y = window.scrollY; }, { passive: true, capture: true });
  window.addEventListener('resize', invalidate, { passive: true });
  window.addEventListener('load', invalidate);
  window.addEventListener('pageshow', () => { y = window.scrollY; invalidate(); });
  window.addEventListener('scrollend', () => { y = window.scrollY; }, { passive: true });
  try { document.fonts?.addEventListener('loadingdone', invalidate); } catch { /* old engines */ }
  if ('ResizeObserver' in window) {
    const ro = new ResizeObserver(invalidate);
    ro.observe(document.body);
  }
}

/** Scroll position as of the last scroll event (no layout flush). */
export function scrollTop(): number { start(); return y; }

/** Document-relative box of an element; measured once per invalidation. */
export function docBox(el: Element): DocBox {
  start();
  const hit = boxes.get(el);
  if (hit && hit.v === version) return hit.box;
  const r = el.getBoundingClientRect();
  const box = { top: r.top + window.scrollY, left: r.left + window.scrollX, width: r.width, height: r.height };
  y = window.scrollY;
  boxes.set(el, { v: version, box });
  return box;
}

/** Viewport-relative top derived from the cache. */
export function viewTop(el: Element): number { return docBox(el).top - scrollTop(); }

/** Subscribe to geometry invalidations (e.g. to schedule a redraw). */
export function onGeometryChange(fn: () => void): () => void {
  start(); listeners.add(fn); return () => listeners.delete(fn);
}

/** Test hook. */
export function invalidateGeometry(): void { invalidate(); }
