import {describe,it,expect} from 'vitest';
import {CITIES,REGIONS,journey,spherePoint} from '../../src/astral/geography';
describe('store geographic journey',()=>{
  it('registers all six cities across their three real states',()=>{
    expect(CITIES.filter(c=>c.state==='Minas Gerais').map(c=>c.id)).toEqual(['araxa','frutal','ibia']);
    expect(CITIES.filter(c=>c.state==='Goiás').map(c=>c.id)).toEqual(['catalao','mineiros']);
    expect(CITIES.filter(c=>c.state==='São Paulo').map(c=>c.id)).toEqual(['franca']);
    expect(REGIONS.map(s=>s.code)).toEqual(['MG','GO','SP']);
    expect(CITIES).toHaveLength(6);
    const ibia=CITIES.find(c=>c.id==='ibia')!;
    const franca=CITIES.find(c=>c.id==='franca')!;
    expect(Math.abs(ibia.lat-CITIES[0]!.lat)).toBeLessThan(1);
    expect(franca.lat).toBeCloseTo(-20.5386);
    expect(franca.lon).toBeCloseTo(-47.4008);
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
