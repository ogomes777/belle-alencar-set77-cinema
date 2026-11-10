/**
 * 00 · Selo. Arco desenhado por traço, letras BA reveladas por máscara,
 * palavra com tracking, e cortina abrindo para a vitrine. ~1,9 s, uma vez
 * por sessão. Qualquer tecla, toque, roda ou "Pular" encerra na hora.
 * Sem JS a intro não existe (CSS só a mostra com html.js).
 */
import { readSession, writeSession } from '../core/storage';

export function initIntro(): void {
  const root = document.documentElement;
  const intro = document.getElementById('intro');
  if (!intro) return;
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (root.classList.contains('intro-seen') || readSession('intro') || reduce) {
    intro.remove();
    root.classList.add('intro-done');
    return;
  }
  writeSession('intro', '1');
  root.classList.add('intro-playing');
  let done = false;
  const finish = (fast: boolean) => {
    if (done) return;
    done = true;
    root.classList.remove('intro-playing');
    root.classList.add(fast ? 'intro-skipped' : 'intro-opening');
    window.setTimeout(() => {
      intro.remove();
      root.classList.remove('intro-opening', 'intro-skipped');
      root.classList.add('intro-done');
    }, fast ? 260 : 900);
    events.forEach((ev) => removeEventListener(ev, skip, true));
  };
  const skip = () => finish(true);
  const events = ['keydown', 'wheel', 'touchstart'] as const;
  events.forEach((ev) => addEventListener(ev, skip, { capture: true, passive: true }));
  document.getElementById('introSkip')?.addEventListener('click', skip);
  intro.addEventListener('pointerdown', skip);
  window.setTimeout(() => finish(false), 1750);
}
