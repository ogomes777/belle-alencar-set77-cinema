import {describe,it,expect} from 'vitest';
import {clampGlobeZoom,wheelGlobeZoom,pinchGlobeZoom,easeGlobeZoom} from '../../src/astral/gestures';
describe('Belle globe V27 · bounded and reversible interactions',()=>{
  it('bounds wheel zoom and ignores invalid values',()=>{
    expect(clampGlobeZoom(NaN)).toBe(1);
    expect(clampGlobeZoom(100)).toBe(3.6);
    expect(wheelGlobeZoom(1,-200)).toBeGreaterThan(1);
    expect(wheelGlobeZoom(3.6,-800)).toBe(3.6);
    expect(wheelGlobeZoom(1,800)).toBe(1);
  });
  it('pinch in/out modifies zoom without exceeding limits',()=>{
    expect(pinchGlobeZoom(2,300,200)).toBe(3);
    expect(pinchGlobeZoom(2,100,200)).toBe(1);
    expect(pinchGlobeZoom(2,100,0)).toBe(2);
  });
  it('eases toward manual zoom independently of frame duration',()=>{
    let z=1;
    for(let i=0;i<240;i++)z=easeGlobeZoom(z,3.1,16.67);
    expect(z).toBeCloseTo(3.1,2);
    for(let i=0;i<240;i++)z=easeGlobeZoom(z,1,16.67);
    expect(z).toBeCloseTo(1,2);
  });
});
