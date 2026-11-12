import { describe, expect, it } from 'vitest';
import { BELLE_V32_SCENES } from '../../src/motion/cinematic-v32';

describe('Belle V32 cinematic scene architecture',()=>{
  it('curates eight distinct transitions for the eight editorial sections',()=>{
    expect(BELLE_V32_SCENES).toHaveLength(8);
    expect(new Set(BELLE_V32_SCENES.map(v=>v.motif)).size).toBe(8);
    expect(new Set(BELLE_V32_SCENES.map(v=>v.selector)).size).toBe(8);
  });
  it('never adds a second animation to the existing WebGL hero or live products',()=>{
    expect(BELLE_V32_SCENES.some(v=>v.selector==='#filme')).toBe(false);
    expect(BELLE_V32_SCENES.some(v=>v.selector.includes('pcard'))).toBe(false);
  });
  it('leaves owned video, 3D, globe and catalog headings alone',()=>{
    const owned=['#colecao','#como-comprar','#lojas'];
    for(const selector of owned){
      const scene=BELLE_V32_SCENES.find(v=>v.selector===selector);
      expect(scene?.editorialTitle).toBe(false);
    }
  });
  it('keeps the already independent 3D finale and direct boutique actions',()=>{
    const finale=BELLE_V32_SCENES.find(v=>v.selector==='.finale');
    expect(finale?.motif).toBe('fold');
    expect(finale?.title).toBe('#finaleTitle');
  });
});
