/**
 * Adaptive performance guard (V37). Keeps scrolling fluid on any device by
 * switching `html.perf-lite` on when the device is weak or when real frames
 * are measured to be slow while the user scrolls. Lite mode only swaps
 * costly paint effects (backdrop-filter glass re-blurred every frame) for
 * near-opaque surfaces of the same tone: layout, palette, content and the
 * section reveals stay identical.
 */
import '../styles/perf-lite.css';

const KEY = 'belle:v37:perf-lite';

export interface DeviceHints { memory?: number; cores?: number; saveData?: boolean }

/** Static heuristic: devices that commonly drop frames on blur-heavy pages. */
export function weakDevice(h: DeviceHints): boolean {
  if (h.saveData) return true;
  if (h.memory !== undefined && h.memory <= 4) return true;
  if (h.cores !== undefined && h.cores <= 2) return true;
  return false;
}

/** Median of frame deltas (ms). */
export function median(values: number[]): number {
  if (!values.length) return 0;
  const s = [...values].sort((a, b) => a - b);
  const m = s.length >> 1;
  return s.length % 2 ? s[m]! : (s[m - 1]! + s[m]!) / 2;
}

export function initPerfGuard(): void {
  const root = document.documentElement;
  const enable = (reason: string) => {
    if (root.classList.contains('perf-lite')) return;
    root.classList.add('perf-lite');
    root.dataset.perfLite = reason;
    try { sessionStorage.setItem(KEY, reason); } catch { /* private mode */ }
  };
  const params = new URLSearchParams(location.search);
  if (params.get('perf') === 'full') return;          // QA escape hatch
  if (params.get('perf') === 'lite') { enable('forced'); return; }
  try { const saved = sessionStorage.getItem(KEY); if (saved) { enable(saved); return; } } catch { /* ignore */ }
  const nav = navigator as Navigator & { deviceMemory?: number; connection?: { saveData?: boolean } };
  if (weakDevice({ memory: nav.deviceMemory, cores: nav.hardwareConcurrency, saveData: nav.connection?.saveData })) {
    enable('device');
    return;
  }
  // Runtime governor: sample frame deltas only while the user is scrolling.
  let samples: number[] = [], last = 0, frame = 0, scrolling = 0;
  const tick = (now: number) => {
    frame = 0;
    if (last && now - last < 250) samples.push(now - last);  // ignore tab-switch gaps
    last = now;
    if (samples.length >= 90) {
      if (median(samples) > 22) { enable('frames'); stop(); return; }
      samples = [];
    }
    if (performance.now() - scrolling < 200) frame = requestAnimationFrame(tick); else last = 0;
  };
  const onScroll = () => { scrolling = performance.now(); if (!frame) frame = requestAnimationFrame(tick); };
  const stop = () => { window.removeEventListener('scroll', onScroll); if (frame) cancelAnimationFrame(frame); };
  window.addEventListener('scroll', onScroll, { passive: true });
}
