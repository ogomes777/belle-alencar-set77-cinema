import { describe, expect, it } from 'vitest';
import { depthAt, railOffset } from '../../src/runway/depth';
import { RUNWAY_PRODUCTS } from '../../src/runway/data';

describe('runway depth and commerce contract', () => {
  it('returns to the same scene after six looks, including reverse navigation', () => {
    for (const p of [-19.25,-6,-.3,0,2.8,18.7]) for(let i=0;i<6;i++) {
      const first=depthAt(i,p), next=depthAt(i,p+6);
      for(const key of ['x','feet','height','blur','opacity','z'] as const) expect(first[key]).toBeCloseTo(next[key],7);
      expect(railOffset(i,p,200)).toBeCloseTo(railOffset(i,p+6,200),7);
    }
  });
  it('keeps the foreground sharp and makes the distant line smaller and softer', () => {
    const front=depthAt(0,0), back=depthAt(4,0);
    expect(front.blur).toBe(0);
    expect(back.height).toBeLessThan(front.height);
    expect(back.blur).toBeGreaterThan(front.blur);
    expect(back.opacity).toBeLessThan(front.opacity);
    expect(back.z).toBeLessThan(front.z);
  });
  it('moves both products of a look to the start of the rail', () => {
    expect(railOffset(4,2,160)).toBe(0);
    expect(railOffset(5,2,160)).toBe(160);
    expect(railOffset(0,6,160)).toBe(0);
  });
  it('never invents sale prices or available stock for the reference pieces', () => {
    expect(RUNWAY_PRODUCTS).toHaveLength(12);
    for(const p of RUNWAY_PRODUCTS) {
      expect(p.isDemo).toBe(true);
      expect(p.price.priceCents).toBeNull();
      expect(p.variants.length).toBeGreaterThan(0);
      expect(p.mediaRights.status).toBe('demo');
    }
  });
});
