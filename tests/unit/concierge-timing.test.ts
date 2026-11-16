import {describe,it,expect} from 'vitest';
import {REVEAL_HOLD_MS,REVEAL_FADE_MS,REVEAL_DURATION_MS,revealBrushOpacity} from '../../src/concierge-timing';

describe('Belle V78 · dress-reveal timing',()=>{
  it('holds the editorial dress longer than the previous 1100ms trail',()=>{
    expect(REVEAL_HOLD_MS).toBe(430);
    expect(REVEAL_FADE_MS).toBe(1050);
    expect(REVEAL_DURATION_MS).toBe(1480);
    expect(REVEAL_DURATION_MS).toBeGreaterThan(1100);
  });
  it('keeps the reveal fully visible during the initial hold',()=>{
    expect(revealBrushOpacity(0)).toBe(1);
    expect(revealBrushOpacity(250)).toBe(1);
    expect(revealBrushOpacity(REVEAL_HOLD_MS)).toBe(1);
  });
  it('fades smoothly and returns to the original image',()=>{
    expect(revealBrushOpacity(640)).toBeGreaterThan(revealBrushOpacity(1050));
    expect(revealBrushOpacity(1050)).toBeGreaterThan(revealBrushOpacity(1400));
    expect(revealBrushOpacity(1400)).toBeGreaterThan(0);
    expect(revealBrushOpacity(1480)).toBe(0);
    expect(revealBrushOpacity(2000)).toBe(0);
  });
  it('never yields invalid canvas opacity',()=>{
    for(const n of [-200,0,430,500,1000,1480,5000]){
      const k=revealBrushOpacity(n);
      expect(k).toBeGreaterThanOrEqual(0);
      expect(k).toBeLessThanOrEqual(1);
    }
    expect(revealBrushOpacity(Infinity)).toBe(0);
    expect(revealBrushOpacity(Number.NaN)).toBe(0);
  });
});
