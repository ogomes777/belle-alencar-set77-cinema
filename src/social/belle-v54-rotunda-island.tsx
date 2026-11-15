import * as React from 'react';
import { createRoot } from 'react-dom/client';
import RotundaCarousel from '../components/originkit/RotundaCarousel';

type BelleClip = { src: string; poster: string };

/**
 * BELLE V62 — Original Originkit WebGL Rotunda as the ONE and ONLY stage.
 * Its cylinder shader, inertia, inverse-projection drag and movement remain.
 * The original frame loader was extended for true video textures.
 * The foreground HTML clip-deck from V61 is intentionally not rendered.
 */
export async function mountBelleRotunda(target: HTMLElement, clips: BelleClip[]): Promise<() => void> {
  const root = createRoot(target);
  // With one supplied Franca film, repeat the SAME actual source around the
  // Rotunda wall; the engine shares the one decoder/texture among its panels.
  const items = clips.length === 1 ? Array(8).fill(clips[0]) : clips;
  root.render(React.createElement(RotundaCarousel, {
    images: items.map(c => ({ image: c.poster, video: c.src })),
    background: 'transparent',
    panelWidth: 690,
    panelHeight: 1180,
    gap: 1,
    distance: 55,
    speed: 31,
    tilt: 0,
    rounded: 0,
    cursor: { hover: 80, damping: 75 },
    style: { minWidth: '100%', minHeight: '100%', width: '100%', height: '100%' },
  }));
  return () => root.unmount();
}
