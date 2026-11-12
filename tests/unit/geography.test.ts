import {describe,it,expect} from 'vitest';
import {CITIES,journey,spherePoint} from '../../src/astral/geography';
describe('store geographic journey',()=>{
  it('keeps the two stores in each actual state',()=>{
    expect(CITIES.filter(c=>c.state==='Minas Gerais').map(c=>c.id)).toEqual(['araxa','frutal']);
    expect(CITIES.filter(c=>c.state==='Goiás').map(c=>c.id)).toEqual(['catalao','mineiros']);
  });
  it('arrives at each city after the state stop without camera discontinuity',()=>{
    for(const city of CITIES){
      expect(journey(city,0).label).toBe('Brasil');
      const state=journey(city,2200);expect(state.lat).toBeCloseTo(city.stateLat);expect(state.lon).toBeCloseTo(city.stateLon);
      const final=journey(city,5000);expect(final.lat).toBeCloseTo(city.lat);expect(final.lon).toBeCloseTo(city.lon);
      expect(journey(city,5400).zoom).toBe(1);
      for(const time of [600,2100,2400,4200,5200])expect(Math.abs(journey(city,time+1).zoom-journey(city,time-1).zoom)).toBeLessThan(.01);
      const p=spherePoint(city.lat,city.lon);expect(Math.hypot(p.x,p.y,p.z)).toBeCloseTo(1);
    }
  });
});
