import * as React from 'react';
import { createRoot } from 'react-dom/client';
import RotundaCarousel from '../components/originkit/RotundaCarousel';

/** This adapter supplies real Belle video stills to the ORIGINAL Originkit component.
 *  The imported RotundaCarousel.tsx remains byte-for-byte identical to the client's source.
 */
export async function mountBelleRotunda(target: HTMLElement, posters: string[]): Promise<() => void> {
  const root = createRoot(target);
  root.render(React.createElement(RotundaCarousel, {
    images: posters.length ? posters.map(image => ({ image })) : [],
    background: 'transparent',
    panelWidth: 680,
    panelHeight: 1180,
    gap: 66,
    distance: 65,
    speed: 24,
    tilt: 0,
    rounded: 5,
    cursor: { hover: 100, damping: 75 },
    style: { minWidth: '100%', minHeight: '100%', width: '100%', height: '100%' },
  }));
  return () => root.unmount();
}