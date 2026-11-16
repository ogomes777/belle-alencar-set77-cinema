import * as React from 'react';
import { createRoot } from 'react-dom/client';
import SpinCarousel from '../components/originkit/SpinCarousel';

type BelleCity = { id: string; name: string; profile: string };
const CITIES: BelleCity[] = [
  { id: 'araxa', name: 'Araxá', profile: 'belle.alencar' },
  { id: 'frutal', name: 'Frutal', profile: 'frutal.bellealencar' },
  { id: 'catalao', name: 'Catalão', profile: 'catalao.bellealencar' },
  { id: 'mineiros', name: 'Mineiros', profile: 'bellealencar.mineiros' },
  { id: 'ibia', name: 'Ibiá', profile: 'bellealencar.ibia' },
  { id: 'franca', name: 'Franca', profile: 'bellealencar.franca' },
];

export const BELLE_SPIN_PHONES = CITIES.map(city => '/belle-v54/phones/' + city.id + '.webp');
export const BELLE_SPIN_DESTINATIONS = CITIES.map(city => 'https://www.instagram.com/' + city.profile + '/');

/** Viewport-safe visual size; desktop gets the full fashion-film presence.
 * Mobile keeps more breathing room around all six phones.
 */
export const belleSpinScale = (width: number) =>
  width <= 600 ? 84 : width <= 900 ? 92 : 101;

type Press = { index: number; front: number; x: number; y: number };

/** The original Originkit implementation lives unchanged in components/originkit.
 * Only this small React island connects its existing wheel to Belle's six REAL mockups.
 * Side-card tap focuses through Originkit's own click-to-center; a front-card tap
 * opens its real Instagram. Native page wheel scroll stays normal; only drag spins.
 */
function BelleSpinPhones() {
  const shell = React.useRef<HTMLDivElement>(null);
  const pressed = React.useRef<Press | null>(null);
  const [reduceMotion, setReduceMotion] = React.useState(false);
  const [wheelScale, setWheelScale] = React.useState(() =>
    belleSpinScale(window.innerWidth));

  React.useEffect(() => {
    const media = matchMedia('(prefers-reduced-motion: reduce)');
    const update = () => setReduceMotion(media.matches ||
      document.documentElement.dataset.intensity === 'essential');
    const observer = new MutationObserver(update);
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['data-intensity'] });
    media.addEventListener('change', update);
    update();
    return () => { observer.disconnect(); media.removeEventListener('change', update); };
  }, []);

  React.useEffect(() => {
    const syncScale = () => setWheelScale(belleSpinScale(window.innerWidth));
    window.addEventListener('resize', syncScale, { passive: true });
    return () => window.removeEventListener('resize', syncScale);
  }, []);

  function frontCardIndex(): number {
    const cards = Array.from(shell.current?.querySelectorAll<HTMLElement>('[data-index]') ?? []);
    const front = cards.reduce<HTMLElement | null>((best, card) =>
      best === null || Number(card.style.zIndex || 0) > Number(best.style.zIndex || 0) ? card : best, null);
    return front ? Number(front.dataset.index) : 0;
  }
  function onPointerDownCapture(event: React.PointerEvent<HTMLDivElement>) {
    const card = (event.target as HTMLElement).closest<HTMLElement>('[data-index]');
    pressed.current = card ? {
      index: Number(card.dataset.index),
      front: frontCardIndex(),
      x: event.clientX,
      y: event.clientY,
    } : null;
  }
  function onPointerUpCapture(event: React.PointerEvent<HTMLDivElement>) {
    const press = pressed.current;
    pressed.current = null;
    if (!press || Math.hypot(event.clientX-press.x,event.clientY-press.y) >= 7) return;
    // Keep the library's own side-card focus intact: only the already centered
    // card acts as a link. Window is opened inside the actual pointer gesture.
    if (press.index === press.front && Number.isInteger(press.index) && press.index >= 0) {
      const city = CITIES[press.index % CITIES.length];
      if (city) window.open(BELLE_SPIN_DESTINATIONS[press.index % CITIES.length], '_blank', 'noopener,noreferrer');
    }
  }

  return (
    <div className="v79-spin-content">
      <div className="v79-spin-live"
        ref={shell}
        onPointerDownCapture={onPointerDownCapture}
        onPointerUpCapture={onPointerUpCapture}
        onPointerCancelCapture={() => { pressed.current = null; }}
        aria-label="Carrossel com seis Instagrams Belle. Arraste na horizontal para girar. Role a página normalmente. Toque no mockup central para abrir a unidade."
      >
        <SpinCarousel
          items={BELLE_SPIN_PHONES}
          background="transparent"
          scale={wheelScale}
          aspect={145}
          rounded={0}
          speed={0}
          transition={{ type: 'tween', duration: reduceMotion ? 0 : 0.4, ease: [0.33, 1, 0.68, 1] }}
          style={{
            width: '100%', height: '100%',
            minWidth: '100%', minHeight: '100%',
            backgroundColor: 'transparent',
            touchAction: 'pan-y',
          }}
        />
      </div>
      <nav className="v79-spin-screenreader-links" aria-label="Abrir Instagram de cada unidade Belle">
        {CITIES.map((city, index) => (
          <a key={city.id} href={BELLE_SPIN_DESTINATIONS[index]}
            target="_blank" rel="noopener noreferrer">Instagram Belle {city.name}</a>
        ))}
      </nav>
    </div>
  );
}

export function mountBelleSpinPhones(target: HTMLElement): () => void {
  const root = createRoot(target);
  root.render(<BelleSpinPhones />);
  return () => root.unmount();
}
