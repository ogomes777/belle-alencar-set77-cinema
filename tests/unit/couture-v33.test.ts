import {describe,it,expect} from 'vitest';
import {COUTURE_TRANSITIONS} from '../../src/motion/couture-transitions-v33';

describe('Belle V33 · full-viewport couture transitions',()=>{
  it('targets every major content chapter without creating a route or replacing the hero',()=>{
    expect(COUTURE_TRANSITIONS).toHaveLength(8);
    expect(new Set(COUTURE_TRANSITIONS.map(x=>x.selector)).size).toBe(8);
    expect(COUTURE_TRANSITIONS.some(x=>x.selector==='#filme')).toBe(false);
  });
  it('has eight distinct wipe motifs and no top-strip-only scene type',()=>{
    expect(new Set(COUTURE_TRANSITIONS.map(x=>x.motif)).size).toBe(8);
    expect(COUTURE_TRANSITIONS.some(x=>x.motif.includes('strip'))).toBe(false);
  });
  it('does not mask legacy scroll-owned titles that control the catalog, film and globe',()=>{
    for(const selector of ['#colecao','#como-comprar','#lojas'])
      expect(COUTURE_TRANSITIONS.find(x=>x.selector===selector)?.headline).toBe('');
  });
  it('keeps individual editorial text reveals distinct from the global page wipe',()=>{
    for(const selector of ['#passarela','#ocasioes','#atendimento','#duvidas','.finale'])
      expect(COUTURE_TRANSITIONS.find(x=>x.selector===selector)?.headline).toBeTruthy();
  });
});
