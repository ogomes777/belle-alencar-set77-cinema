import { describe, expect, it } from 'vitest';
import { storesRevealAt } from '../../src/motion/stores-champagne';

describe('Belle V24 · timed per-element bidirectional scroll reveal', () => {
  it('starts just off-screen, stays visibly in progress on entry, and finishes at 68vh', () => {
    const vh=800;
    expect(storesRevealAt(850,vh)).toBe(0);
    const arriving=storesRevealAt(720,vh);
    expect(arriving).toBeGreaterThan(0.2);
    expect(arriving).toBeLessThan(0.8);
    expect(storesRevealAt(544,vh)).toBe(1);
  });

  it('completes delayed cities before they reach 62vh', () => {
    const vh=800,lateCityDelay=.022+(6-3)*.008;
    expect(storesRevealAt(496,vh,lateCityDelay)).toBe(1);
    expect(storesRevealAt(720,vh,lateCityDelay)).toBeLessThan(1);
  });

  it('returns to the exact same position when scrolling up', () => {
    for (const vh of [640,800,920]) {
      for (const y of [vh*1.1,vh*.96,vh*.8,vh*.6]) {
        const a=storesRevealAt(y,vh,.03);
        const b=storesRevealAt(y,vh,.03);
        expect(a).toBe(b);
      }
    }
  });

  it('is monotonic and bounded without affecting the globe', () => {
    const xs=[900,830,750,690,600,500,350,0].map(y=>storesRevealAt(y,800,.04));
    expect(xs.every(x=>x>=0&&x<=1)).toBe(true);
    for(let i=1;i<xs.length;i++)expect(xs[i]).toBeGreaterThanOrEqual(xs[i-1]!);
  });
});
