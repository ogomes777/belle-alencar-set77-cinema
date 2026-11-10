/** Intensidade do movimento: cinema ↔ essencial (persistida). */
import { loadIntensity, saveIntensity, type Intensity } from '../core/tier';
import { bus } from '../core/bus';
import { announce } from '../core/a11y';

export interface Director {
  get(): Intensity;
  onChange(fn: (i: Intensity) => void): void;
}

export function initDirector(): Director {
  const btn = document.getElementById('directorToggle');
  const label = btn?.querySelector<HTMLElement>('[data-director-label]');
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  let intensity: Intensity = reduce ? 'essential' : loadIntensity();
  const fns: ((i: Intensity) => void)[] = [];
  const sync = () => {
    document.documentElement.dataset.intensity = intensity;
    if (btn) btn.setAttribute('aria-pressed', String(intensity === 'essential'));
    if (label) label.textContent = intensity === 'essential' ? 'Movimento: essencial' : 'Movimento: cinema';
  };
  btn?.addEventListener('click', () => {
    intensity = intensity === 'cinema' ? 'essential' : 'cinema';
    saveIntensity(intensity);
    sync();
    announce(intensity === 'essential' ? 'Modo essencial: filme em quadros estáticos.' : 'Modo cinema: filme em movimento.');
    bus.emit('motion:intensity', { intensity });
    fns.forEach((f) => f(intensity));
  });
  sync();
  return { get: () => intensity, onChange: (f) => fns.push(f) };
}
