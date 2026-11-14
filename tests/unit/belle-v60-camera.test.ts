import {describe,it,expect} from 'vitest';
import {VIEWPOSES,VISIT_DESTINATIONS,POVWalk} from '../../src/experience/pov/walk';
describe('V60 physical reference-aligned hero',()=>{
  it('frames the interior from behind the doorway and not through exterior glass',()=>{
    expect(VIEWPOSES.sala.z).toBeLessThan(-1.7);
    expect(VIEWPOSES.sala.z).toBeGreaterThan(-2.8);
    expect(VIEWPOSES.sala.yaw).toBe(0);
    expect(VIEWPOSES.sala.fov).toBeGreaterThanOrEqual(50);
  });
  it('looks along the two racks without aiming perpendicular into a wall',()=>{
    expect(VIEWPOSES.direita.yaw).toBeGreaterThan(0);
    expect(VIEWPOSES.direita.yaw).toBeLessThan(.7);
    expect(VIEWPOSES.esquerda.yaw).toBeLessThan(0);
    expect(VIEWPOSES.esquerda.yaw).toBeGreaterThan(-.7);
  });
  it('the reverse shot faces the same front door from inside the store',()=>{
    expect(VIEWPOSES.portaInterna.z).toBeLessThan(-2);
    expect(VIEWPOSES.portaInterna.yaw).toBe(Math.PI);
    expect(VIEWPOSES.fachada.yaw).toBe(0);
  });
  it('all navigation destinations stay inside the physical floor constraints',()=>{
    const walk=new POVWalk();walk.start(0,-2.62,0);
    for(const dest of ['entrada','centro','esquerda','direita','provador'] as const){
      walk.go(dest);
      for(let k=0;k<450;k++)walk.update(1/60);
      expect(walk.pose.active).toBe(true);
      expect(walk.pose.x).toBeGreaterThan(-4.8);
      expect(walk.pose.x).toBeLessThan(4.8);
    }
    expect(VISIT_DESTINATIONS.direita.x).toBeGreaterThan(0);
    expect(VISIT_DESTINATIONS.esquerda.x).toBeLessThan(0);
  });
});
