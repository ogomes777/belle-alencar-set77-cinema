import {describe,it,expect} from 'vitest';
import {clampGlobeZoom,wheelGlobeZoom,pinchGlobeZoom,easeGlobeZoom,globeAutoSpinFactor} from '../../src/astral/gestures';
import {globeScreenX,spherePoint} from '../../src/astral/geography';
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
  it('nearly pauses automatic spin as zoom approaches a city',()=>{
    expect(globeAutoSpinFactor(1)).toBe(1);
    expect(globeAutoSpinFactor(1.5)).toBeLessThan(.05);
    expect(globeAutoSpinFactor(2)).toBeLessThan(.015);
    expect(globeAutoSpinFactor(3.6)).toBeLessThanOrEqual(.00301);
    expect(globeAutoSpinFactor(0)).toBe(1);
    expect(globeAutoSpinFactor(Number.NaN)).toBe(1);
    for(const z of [1,1.15,1.5,2,2.5,3.6])expect(globeAutoSpinFactor(z)).toBeGreaterThan(0);
  });
  it('projects Minas Gerais west to the left and east to the right, north upward',()=>{
    // Reference: official north-up Minas Gerais IBGE map. A westward Triângulo Mineiro tip.
    const centerLon=-45,westLon=-50.998,eastLon=-39.864,angle=(centerLon-90)*Math.PI/180;
    const worldX=(lon:number)=>Math.cos(-19*Math.PI/180)*Math.cos(lon*Math.PI/180-angle);
    expect(globeScreenX(worldX(westLon),100,100))
      .toBeLessThan(globeScreenX(worldX(eastLon),100,100));
    expect(spherePoint(-14.24,-45).y)
      .toBeLessThan(spherePoint(-22.892,-45).y);
  });
  it('eases toward manual zoom independently of frame duration',()=>{
    let z=1;
    for(let i=0;i<240;i++)z=easeGlobeZoom(z,3.1,16.67);
    expect(z).toBeCloseTo(3.1,2);
    for(let i=0;i<240;i++)z=easeGlobeZoom(z,1,16.67);
    expect(z).toBeCloseTo(1,2);
  });
});
