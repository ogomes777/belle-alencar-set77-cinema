import { h } from '../../core/dom';

let region: HTMLElement | null = null;

export function toast(message: string, tone: 'info' | 'warn' = 'info'): void {
  if (!region) {
    region = h('div', { class: 'toasts', role: 'status', 'aria-live': 'polite' });
    (document.getElementById('overlays') ?? document.body).append(region);
  }
  const el = h('p', { class: `toast toast--${tone}`, text: message });
  region.append(el);
  requestAnimationFrame(() => el.classList.add('is-in'));
  window.setTimeout(() => {
    el.classList.remove('is-in');
    window.setTimeout(() => el.remove(), 400);
  }, 3600);
  while (region.children.length > 3) region.firstElementChild?.remove();
}
