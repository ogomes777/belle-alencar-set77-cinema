import {describe,expect,it} from 'vitest';
import {storesRevealAt} from '../../src/motion/stores-champagne';
describe('Belle V22 · bidirectional stores scroll',()=>{
  it('reveals smoothly on descent and reverses when returning',()=>{
    const xs=[900,710,530,370,190,-30].map(top=>storesRevealAt(top,800));
    expect(xs[0]).toBe(0);
    expect(xs.at(-1)).toBe(1);
    for(let i=1;i<xs.length;i++)expect(xs[i]).toBeGreaterThanOrEqual(xs[i-1]!);
    expect(storesRevealAt(500,800,.07)).toBe(storesRevealAt(500,800,.07));
  });
});
