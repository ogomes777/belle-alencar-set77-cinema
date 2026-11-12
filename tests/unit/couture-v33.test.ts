import {describe,it,expect} from 'vitest';
import {COUTURE_TRANSITIONS,getBoundaryProgress} from '../../src/motion/couture-transitions-v33';

describe('Belle V34 · non-blocking chapter transitions',()=>{
  it('keeps all eight section boundary motifs without replacing the original scenes',()=>{
    expect(COUTURE_TRANSITIONS).toHaveLength(8);
    expect(new Set(COUTURE_TRANSITIONS.map(x=>x.selector)).size).toBe(8);
    expect(new Set(COUTURE_TRANSITIONS.map(x=>x.motif)).size).toBe(8);
    expect(COUTURE_TRANSITIONS.map(x=>x.selector)).not.toContain('#filme');
  });

  it('does not give the product, video or globe titles to a second controller',()=>{
    for(const selector of ['#colecao','#como-comprar','#lojas'])
      expect(COUTURE_TRANSITIONS.find(x=>x.selector===selector)?.headline).toBe('');
  });

  it('preserves the editorial chapter targets used by the underlying animation director',()=>{
    for(const selector of ['#passarela','#ocasioes','#atendimento','#duvidas','.finale'])
      expect(COUTURE_TRANSITIONS.find(x=>x.selector===selector)?.headline).toBeTruthy();
  });

  it('restricts every light pass to a narrow entry boundary instead of the full scroll height',()=>{
    expect(getBoundaryProgress(1000,1000)).toBe(0);
    expect(getBoundaryProgress(890,1000)).toBe(0);
    expect(getBoundaryProgress(770,1000)).toBeCloseTo(.5,5);
    expect(getBoundaryProgress(650,1000)).toBe(1);
    expect(getBoundaryProgress(0,1000)).toBe(1);
  });

  it('is reversible and clamps safely for mobile viewports',()=>{
    expect(getBoundaryProgress(284.8,320)).toBeCloseTo(0,5);
    expect(getBoundaryProgress(208,320)).toBeCloseTo(1,5);
    expect(getBoundaryProgress(770,1000)).toBe(getBoundaryProgress(770,1000));
  });
});
