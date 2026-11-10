/** Painéis modais acessíveis (dialog, drawer, sheet) montados em #overlays. */
import { h } from '../../core/dom';
import { trapFocus, firstFocusable } from '../../core/a11y';

export type OverlayVariant = 'dialog' | 'drawer' | 'drawer-left' | 'search';

export interface Overlay {
  root: HTMLElement;
  panel: HTMLElement;
  body: HTMLElement;
  open(trigger?: HTMLElement | null, opts?: { flip?: boolean; focus?: HTMLElement | null }): void;
  close(opts?: { restoreFocus?: boolean }): void;
  isOpen(): boolean;
}

const openStack: Overlay[] = [];
const reduced = () => matchMedia('(prefers-reduced-motion: reduce)').matches;

function host(): HTMLElement {
  let el = document.getElementById('overlays');
  if (!el) {
    el = h('div', { id: 'overlays' });
    document.body.append(el);
  }
  return el;
}

function syncLock() {
  document.documentElement.classList.toggle('is-locked', openStack.length > 0);
}

export function closeAll(): void {
  [...openStack].forEach((o) => o.close({ restoreFocus: false }));
}

export function createOverlay(opts: { id: string; labelledBy: string; variant: OverlayVariant; className?: string; onClose?: () => void }): Overlay {
  const body = h('div', { class: 'ov__body' });
  const closeBtn = h('button', { type: 'button', class: 'ov__close', 'aria-label': 'Fechar', 'data-close': true },
    h('span', { 'aria-hidden': 'true', text: '×' }));
  const panel = h('div', {
    class: 'ov__panel',
    role: 'dialog',
    'aria-modal': 'true',
    'aria-labelledby': opts.labelledBy,
    tabindex: '-1',
  }, closeBtn, body);
  const root = h('div', { class: `ov ov--${opts.variant} ${opts.className ?? ''}`, id: opts.id, hidden: true },
    h('div', { class: 'ov__backdrop', 'data-close': true }), panel);
  host().append(root);

  let trigger: HTMLElement | null = null;
  let release: (() => void) | null = null;
  let hideTimer = 0;
  let open = false;

  const onKey = (e: KeyboardEvent) => {
    if (e.key === 'Escape' && openStack[openStack.length - 1] === api) {
      e.stopPropagation();
      api.close();
    }
  };

  root.addEventListener('click', (e) => {
    const t = e.target as HTMLElement;
    if (t.closest('[data-close]') && (t.closest('.ov') === root)) api.close();
  });

  const api: Overlay = {
    root, panel, body,
    isOpen: () => open,
    open(trig = null, o = {}) {
      window.clearTimeout(hideTimer);
      if (open) return;
      // um painel por vez (exceto empilhado explícito do diálogo de troca)
      closeAll();
      trigger = trig ?? (document.activeElement as HTMLElement | null);
      open = true;
      openStack.push(api);
      root.hidden = false;
      root.classList.toggle('ov--flip', !!o.flip);
      void root.offsetWidth; // força reflow para a transição
      root.classList.add('is-open');
      release = trapFocus(panel);
      document.addEventListener('keydown', onKey, true);
      syncLock();
      const target = o.focus ?? firstFocusable(body) ?? closeBtn;
      requestAnimationFrame(() => target.focus({ preventScroll: true }));
    },
    close({ restoreFocus = true } = {}) {
      if (!open) return;
      open = false;
      const i = openStack.indexOf(api);
      if (i >= 0) openStack.splice(i, 1);
      root.classList.remove('is-open');
      release?.();
      release = null;
      document.removeEventListener('keydown', onKey, true);
      syncLock();
      hideTimer = window.setTimeout(() => { if (!open) root.hidden = true; }, reduced() ? 0 : 380);
      if (restoreFocus && trigger && document.contains(trigger)) trigger.focus({ preventScroll: true });
      trigger = null;
      opts.onClose?.();
    },
  };
  return api;
}
