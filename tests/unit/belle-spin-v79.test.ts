import { describe, it, expect } from 'vitest';
import { BELLE_SPIN_PHONES, BELLE_SPIN_DESTINATIONS } from '../../src/social/belle-spin-island';

describe('Belle V79 · Originkit Spin Carousel integration', () => {
  it('uses exactly the six real Belle city phone mockups', () => {
    expect(BELLE_SPIN_PHONES).toEqual([
      '/belle-v54/phones/araxa.webp',
      '/belle-v54/phones/frutal.webp',
      '/belle-v54/phones/catalao.webp',
      '/belle-v54/phones/mineiros.webp',
      '/belle-v54/phones/ibia.webp',
      '/belle-v54/phones/franca.webp',
    ]);
    expect(BELLE_SPIN_PHONES.every(src => !src.startsWith('blob:') && !src.startsWith('http'))).toBe(true);
  });
  it('keeps real Instagram destinations aligned with the six phones', () => {
    expect(BELLE_SPIN_DESTINATIONS).toEqual([
      'https://www.instagram.com/belle.alencar/',
      'https://www.instagram.com/frutal.bellealencar/',
      'https://www.instagram.com/catalao.bellealencar/',
      'https://www.instagram.com/bellealencar.mineiros/',
      'https://www.instagram.com/bellealencar.ibia/',
      'https://www.instagram.com/bellealencar.franca/',
    ]);
    expect(new Set(BELLE_SPIN_DESTINATIONS).size).toBe(6);
  });
});
