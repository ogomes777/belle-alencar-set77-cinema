import { describe, it, expect } from 'vitest';
import { BELLE_SPIN_PHONES, BELLE_SPIN_DESTINATIONS, belleSpinScale } from '../../src/social/belle-spin-island';
import { createSpinCards } from '../../src/components/originkit/SpinCarousel';

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
  it('creates one visible card per city with no hidden duplicates', () => {
    const cards=createSpinCards(BELLE_SPIN_PHONES);
    expect(cards).toHaveLength(6);
    expect(cards.map(card=>card.src)).toEqual(BELLE_SPIN_PHONES);
    expect(new Set(cards.map(card=>card.id)).size).toBe(6);
  });
  it('keeps all six cards distinct throughout one full wheel rotation', () => {
    const cards=createSpinCards(BELLE_SPIN_PHONES);
    for(let steps=0;steps<6;steps++){
      const rotated=cards.map((_,idx)=>cards[(idx+steps)%6]?.src);
      expect(new Set(rotated).size).toBe(6);
    }
  });
  it('grows the wheel on desktop without cropping the phone ring', () => {
    expect(belleSpinScale(1920)).toBe(101);
    expect(belleSpinScale(1440)).toBe(101);
    expect(belleSpinScale(1200)).toBe(101);
    expect(belleSpinScale(901)).toBe(101);
    // 101 percent of a 96 percent safe-fit keeps the wheel below full-frame size.
    expect((belleSpinScale(1920) / 100) * 0.96).toBeLessThan(1);
  });
  it('preserves generous mobile margins and tablet proportions', () => {
    expect(belleSpinScale(390)).toBe(84);
    expect(belleSpinScale(600)).toBe(84);
    expect(belleSpinScale(601)).toBe(92);
    expect(belleSpinScale(900)).toBe(92);
    expect(belleSpinScale(320)).toBeLessThan(belleSpinScale(1920));
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
