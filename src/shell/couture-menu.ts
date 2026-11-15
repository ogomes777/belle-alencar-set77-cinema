/**
 * V38 · Couture menu — full-page chapter navigation.
 *
 * Interaction grammar (reference studied: agrumeafarm.it, reinterpreted in
 * Belle's palette/type): a pill "Menu" + gold disc in the header; the panel
 * drops from the top (.9s), chapter titles rise letter by letter through a
 * mask in a diagonal staircase, separators draw in, the current chapter gets
 * a diamond; hovering rolls each letter. Closing lifts the panel away.
 *
 * Native anchors only (no router); body scroll is locked while open; Esc,
 * focus trap and focus restore; theme-aware via CSS; reduced motion = instant.
 */
import '@fontsource-variable/bodoni-moda/wght.css';
import '../styles/couture-menu.css';
import { getBelleLocale, translateBelleText } from '../preferences/i18n';

const OPEN_MS = 900;
const CLOSE_MS = 975;

/** Splits a node's text into per-letter spans (visual only; aria-label keeps the text). */
export function splitLetters(el: HTMLElement, roll = true): number {
  if (el.dataset.splitDone) return Number(el.dataset.splitDone);
  const text = (el.textContent || '').trim();
  if (!el.hasAttribute('aria-label') && el.tagName === 'A') el.setAttribute('aria-label', text);
  const box = document.createElement('span');
  box.className = 'cn-letters';
  box.setAttribute('aria-hidden', 'true');
  let index = 0;
  for (const word of text.split(/(\s+)/)) {
    if (!word) continue;
    if (/^\s+$/.test(word)) { const sp = document.createElement('span'); sp.className = 'cn-space'; box.append(sp); continue; }
    const w = document.createElement('span');
    w.className = 'cn-word';
    for (const ch of word) {
      const c = document.createElement('span');
      c.className = 'cn-ch';
      c.style.setProperty('--c', String(index++));
      const inner = document.createElement('span');
      inner.className = 'cn-ch__in';
      const a = document.createElement('span');
      a.className = 'cn-ch__a'; a.textContent = ch;
      inner.append(a);
      if (roll) {
        const b = document.createElement('span');
        b.className = 'cn-ch__b'; b.textContent = ch;
        inner.append(b);
      }
      c.append(inner);
      w.append(c);
    }
    box.append(w);
  }
  el.textContent = '';
  el.append(box);
  el.style.setProperty('--n', String(index));
  el.dataset.splitDone = String(index);
  return index;
}

export function initCoutureMenu(): void {
  const button = document.getElementById('belleMenuButton') as HTMLButtonElement | null;
  const panel = document.getElementById('belleMenuPanel');
  const header = document.getElementById('siteHeader');
  if (!button || !panel) return;
  const root = document.documentElement;

  // Letter wrapping intentionally happens BEFORE the translation engine mounts.
  // Keep the unsplit Portuguese source, rebuild the same animated character spans
  // on every locale change, including when a saved locale is restored at boot.
  const labels = [
    ...Array.from(panel.querySelectorAll<HTMLElement>('[data-split]')),
    ...Array.from(button.querySelectorAll<HTMLElement>('[data-roll]')),
  ].map(el => ({ el, original: (el.textContent || '').trim() }));
  button.dataset.i18nSkip = ''; // aria-label and rolling letters are managed here.
  for (const item of labels) item.el.dataset.i18nSkip = '';
  const updateLabels = () => {
    const selected = getBelleLocale();
    for (const { el, original } of labels) {
      const localized = translateBelleText(original, selected);
      el.removeAttribute('data-split-done');
      el.replaceChildren(document.createTextNode(localized));
      if (el.tagName === 'A') el.setAttribute('aria-label', localized);
      splitLetters(el);
      if (el.classList.contains('couture-nav__link')) {
        const marker = document.createElement('span');
        marker.className = 'couture-nav__marker';
        marker.setAttribute('aria-hidden', 'true');
        el.append(marker);
      }
    }
    button.setAttribute('aria-label', translateBelleText(
      button.getAttribute('aria-expanded') === 'true' ? 'Fechar menu' : 'Abrir menu', selected
    ));
  };
  updateLabels();
  window.addEventListener('belle:localechange', updateLabels);

  let open = false, timer = 0, lastFocus: HTMLElement | null = null;
  const reduced = () => matchMedia('(prefers-reduced-motion: reduce)').matches;
  const warmFont = () => { try { void document.fonts?.load('400 1em "Bodoni Moda Variable"'); } catch { /* ignore */ } };
  button.addEventListener('pointerenter', warmFont, { once: true, passive: true });
  button.addEventListener('focus', warmFont, { once: true });
  button.addEventListener('touchstart', warmFont, { once: true, passive: true });

  const focusables = () => [button, ...Array.from(panel.querySelectorAll<HTMLElement>('a[href]'))];

  function setOpen(next: boolean, restoreFocus = true) {
    if (next === open) return;
    open = next;
    window.clearTimeout(timer);
    button!.setAttribute('aria-expanded', String(next));
    button!.setAttribute('aria-label', translateBelleText(next ? 'Fechar menu' : 'Abrir menu'));
    header?.classList.toggle('is-nav-open', next);
    panel!.setAttribute('aria-hidden', String(!next));
    if (next) {
      warmFont();
      lastFocus = document.activeElement as HTMLElement | null;
      panel!.inert = false;
      panel!.classList.remove('is-closing');
      // Lock scroll without layout jump.
      const gap = innerWidth - root.clientWidth;
      if (gap > 0) root.style.setProperty('--cn-scrollbar', gap + 'px');
      root.classList.add('couture-nav-open');
      requestAnimationFrame(() => panel!.classList.add('is-open'));
      timer = window.setTimeout(() => {
        const target = panel!.querySelector<HTMLElement>('.couture-nav__link[aria-current]')
          ?? panel!.querySelector<HTMLElement>('.couture-nav__link');
        target?.focus({ preventScroll: true });
      }, reduced() ? 0 : 420);
    } else {
      panel!.classList.remove('is-open');
      panel!.classList.add('is-closing');
      root.classList.remove('couture-nav-open');
      root.style.removeProperty('--cn-scrollbar');
      timer = window.setTimeout(() => {
        panel!.classList.remove('is-closing');
        panel!.inert = true;
      }, reduced() ? 0 : CLOSE_MS);
      if (restoreFocus) (lastFocus && lastFocus !== document.body ? lastFocus : button!).focus({ preventScroll: true });
    }
  }

  button.addEventListener('click', () => setOpen(!open));
  panel.addEventListener('click', event => {
    const link = (event.target as Element).closest<HTMLAnchorElement>('a[href]');
    if (!link) return;
    if (link.hasAttribute('data-external')) { setOpen(false, false); return; }
    const hash = link.getAttribute('href') || '';
    const target = hash.length > 1 ? document.querySelector<HTMLElement>(hash) : null;
    setOpen(false, false);
    if (!target) return;
    event.preventDefault();
    if (location.hash !== hash) history.pushState(null, '', hash);
    window.dispatchEvent(new HashChangeEvent('hashchange'));
    landOn(target);
  });

  /** Instant jump under the lifting panel, then hold the target in place while
   *  lazily enhanced sections above it change height (e.g. the how-film scrub
   *  grows 889→2340px on activation, which used to strand #lojas 1.5k px off). */
  function landOn(target: HTMLElement) {
    target.scrollIntoView({ behavior: 'instant' as ScrollBehavior, block: 'start' });
    const want = target.getBoundingClientRect().top;
    const until = performance.now() + 1200;
    let userMoved = false;
    const stop = () => { userMoved = true; };
    window.addEventListener('wheel', stop, { passive: true, once: true });
    window.addEventListener('touchstart', stop, { passive: true, once: true });
    window.addEventListener('keydown', stop, { once: true });
    const hold = () => {
      if (userMoved || performance.now() > until) return;
      if (Math.abs(target.getBoundingClientRect().top - want) > 4) target.scrollIntoView({ behavior: 'instant' as ScrollBehavior, block: 'start' });
      requestAnimationFrame(hold);
    };
    requestAnimationFrame(hold);
    target.focus?.({ preventScroll: true });
  }
  document.addEventListener('keydown', event => {
    if (!open) return;
    if (event.key === 'Escape') { event.preventDefault(); setOpen(false); return; }
    if (event.key !== 'Tab') return;
    const list = focusables();
    const first = list[0]!, last = list[list.length - 1]!;
    if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
    else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
  });
  // Commerce dialogs opened from the header close the menu first.
  document.addEventListener('pointerdown', event => {
    if (open && (event.target as Element).closest?.('#storeButton,#searchButton,#wishlistButton,#bagButton,#belleSettingsButton')) setOpen(false, false);
  }, { passive: true });
  window.addEventListener('pagehide', () => setOpen(false, false));
  void OPEN_MS;
}
