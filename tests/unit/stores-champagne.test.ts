import {describe,expect,it} from 'vitest';
import {storesRevealAt} from '../../src/motion/stores-champagne';
describe('Belle V23 · early, readable, bidirectional stores reveal',()=>{
  it('reveals in an earlier, shorter scroll window',()=>{
    const vh=800;
    expect(storesRevealAt(900,vh)).toBe(0);
    expect(storesRevealAt(560,vh)).toBe(1);
    expect(storesRevealAt(490,vh,.105)).toBe(1);
    expect(storesRevealAt(750,vh)).toBeGreaterThan(0);
  });
  it('is monotonic descending and reverses to the same exact state',()=>{
    const positions=[900,830,780,740,700,630,560,490,0];
    const values=positions.map(x=>storesRevealAt(x,800,.045));
    for(let i=1;i<values.length;i++) expect(values[i]).toBeGreaterThanOrEqual(values[i-1]!);
    expect(storesRevealAt(700,800,.045)).toBe(storesRevealAt(700,800,.045));
  });
});
