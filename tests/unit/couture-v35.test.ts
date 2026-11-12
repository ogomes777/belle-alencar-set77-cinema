import {describe,it,expect} from 'vitest';
import {MICRO_MOTIFS,COUTURE_SCENES,boundaryProgress,resolveMotif}
  from '../../src/motion/couture-transitions-v35';

describe('Belle V35 / 22 genuine couture micro-intros',()=>{
  it('contains the 22 explicitly requested, distinct visual families',()=>{
    expect(MICRO_MOTIFS).toEqual([
      'cortina','colunas','digitacao','sobreposicao','rasgo','pixels',
      'varredura','circulo','pilha','moldura','canto','fatias',
      'dobra','cubo','carrossel','tinta','queima','reticula',
      'espiral','veludo','canal','particulas',
    ]);
    expect(new Set(MICRO_MOTIFS).size).toBe(22);
  });

  it('actually assigns every named motif at least once to a real scene',()=>{
    const placed=COUTURE_SCENES.flatMap(s=>[...s.motifs]);
    expect(new Set(placed)).toEqual(new Set(MICRO_MOTIFS));
  });

  it('covers all 7 film chapters plus every subsequent major section',()=>{
    expect(COUTURE_SCENES.map(s=>s.selector)).toEqual([
      '#inicio','#porta','#sala','#vestido','#detalhe','#categorias',
      '#provador','#passarela','#ocasioes','#colecao','#como-comprar',
      '#lojas','#atendimento','#duvidas','.finale',
    ]);
  });

  it('uses a reversible scroll interval without adding layout or pinning',()=>{
    expect(boundaryProgress(1100,1000)).toBe(0);
    expect(boundaryProgress(980,1000)).toBe(0);
    expect(boundaryProgress(575,1000)).toBeCloseTo(.5);
    expect(boundaryProgress(170,1000)).toBe(1);
    expect(boundaryProgress(-100,1000)).toBe(1);
    expect(boundaryProgress(575,1000)).toBe(boundaryProgress(575,1000));
  });

  it('visits every motif in the correct order in each consecutive scene beat',()=>{
    for(const scene of COUTURE_SCENES){
      scene.motifs.forEach((motif,i)=>{
        const p=(i+.5)/scene.motifs.length;
        const beat=resolveMotif(scene.motifs,p);
        expect(beat.motif).toBe(motif);
        expect(beat.index).toBe(i);
        expect(beat.local).toBeCloseTo(.5);
      });
    }
  });

  it('does not remount original interactive headings, video or 3D markup',()=>{
    for(const scene of COUTURE_SCENES.slice(0,7))expect(scene.copy).toBeUndefined();
    expect(COUTURE_SCENES.find(s=>s.selector==='#como-comprar')?.copy).toBe('.how__intro .eyebrow');
    expect(COUTURE_SCENES.find(s=>s.selector==='#colecao')?.copy).toBe('.section-head .eyebrow');
  });
});
