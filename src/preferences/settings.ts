
/** Preferências persistentes do cabeçalho. */
import { getBelleLocale, setBelleLocale, type BelleLocale } from './i18n';

export type BelleTheme = 'light' | 'dark' | 'rose';
const themeKey = 'belle:v31:theme';

function readTheme(): BelleTheme {
  try {
    const stored = localStorage.getItem(themeKey);
    if (stored === 'dark' || stored === 'rose') return stored;
  } catch { /* Storage can be unavailable. */ }
  return 'light';
}

export function setBelleTheme(next: BelleTheme) {
  if (next !== 'light' && next !== 'dark' && next !== 'rose') return;
  document.documentElement.dataset.belleTheme = next;
  try { localStorage.setItem(themeKey, next); } catch { /* Keep the current page usable. */ }
  window.dispatchEvent(new CustomEvent('belle:themechange', { detail: { theme: next } }));
}

export function initBelleSettings() {
  setBelleTheme(readTheme());
  const preferences = document.querySelector('.belle-nav-preferences');
  if (!preferences) return;

  const themes = preferences.querySelectorAll<HTMLButtonElement>('[data-theme-option]');
  const languages = preferences.querySelectorAll<HTMLButtonElement>('[data-lang-option]');

  function syncThemes() {
    const theme = document.documentElement.dataset.belleTheme;
    themes.forEach(button => button.setAttribute('aria-pressed', String(button.dataset.themeOption === theme)));
  }

  function syncLanguages() {
    const locale = getBelleLocale();
    languages.forEach(button => button.setAttribute('aria-pressed', String(button.dataset.langOption === locale)));
  }

  themes.forEach(button => button.addEventListener('click', () => {
    setBelleTheme(button.dataset.themeOption as BelleTheme);
  }));
  languages.forEach(button => button.addEventListener('click', () => {
    setBelleLocale(button.dataset.langOption as BelleLocale);
  }));
  window.addEventListener('belle:themechange', syncThemes);
  window.addEventListener('belle:localechange', syncLanguages);
  syncThemes();
  syncLanguages();
}
