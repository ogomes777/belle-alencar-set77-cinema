import {describe,it,expect} from 'vitest';
import {advanceFilmScrub} from '../../src/experience/film-scrub-v55';
describe('Belle V55 film scroll stability',()=>{
  it('never teleports the hero camera during fast native wheel input',()=>{
    let p=0,previous=0;
    for(let i=0;i<20;i++){
      p=advanceFilmScrub(p,.75,1/60);
      expect(p).toBeGreaterThan(previous);
      expect(p-previous).toBeLessThanOrEqual(.022);
      previous=p;
    }
    expect(p).toBeLessThan(.75);
  });
  it('follows forward and reverse touch scroll continuously',()=>{
    let p=.8;
    for(let i=0;i<100;i++) p=advanceFilmScrub(p,.2,1/60);
    expect(p).toBeCloseTo(.2,2);
    for(let i=0;i<100;i++) p=advanceFilmScrub(p,.7,1/60);
    expect(p).toBeCloseTo(.7,2);
  });
  it('only jumps on explicit first-paint or session restoration',()=>{
    expect(advanceFilmScrub(0,.9,1/60,true)).toBe(.9);
    expect(advanceFilmScrub(.3,.8,1/60)).toBeLessThan(.33);
  });
  it('stays stable on high refresh, low refresh and dropped frames',()=>{
    for(const dt of [1/120,1/60,1/30,.25]){
      const p=advanceFilmScrub(.3,.95,dt);
      expect(p).toBeGreaterThan(.3);
      expect(p).toBeLessThanOrEqual(.3210001);
    }
  });
});