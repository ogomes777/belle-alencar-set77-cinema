import {describe,it,expect} from 'vitest';
import {POVWalk, VISIT_DESTINATIONS, collisionStep, safeWalkPoint} from '../../src/experience/pov/walk';
import {filteredProducts,categoryPage} from '../../src/experience/pov/controls';
import {SHOP_CATEGORIES} from '../../src/commerce/types';
import {DEMO_CATALOG} from '../../src/commerce/catalog.demo';
describe('Belle V58 360° navigation',()=>{
 it('crosses 360 degrees with continuous yaw and bounded pitch',()=>{
  const p=new POVWalk();p.start(0,-3,0);
  for(let i=0;i<12;i++)p.look(Math.PI/5,.15);
  expect(p.pose.yaw).toBeGreaterThan(2*Math.PI);
  expect(p.pose.pitch).toBeLessThanOrEqual(.61);
  for(let i=0;i<24;i++)p.look(-Math.PI/5,-.15);
  expect(p.pose.yaw).toBeLessThan(-2*Math.PI);
  expect(p.pose.pitch).toBeGreaterThanOrEqual(-.61);
 });
 it('walks toward both rails without going through wall or rail',()=>{
  const p=new POVWalk();p.start(0,-3,0);
  p.go('direita');for(let i=0;i<340;i++)p.update(1/60);
  expect(p.pose.x).toBeCloseTo(VISIT_DESTINATIONS.direita.x,1);
  expect(p.pose.z).toBeCloseTo(VISIT_DESTINATIONS.direita.z,1);
  p.go('esquerda');for(let i=0;i<420;i++)p.update(1/60);
  expect(p.pose.x).toBeCloseTo(VISIT_DESTINATIONS.esquerda.x,1);
  expect(p.pose.z).toBeCloseTo(VISIT_DESTINATIONS.esquerda.z,1);
 });
 it('cannot tunnel across a freestanding rail or fitting partition',()=>{
  const p=collisionStep({x:2.25,z:-7},{x:4.4,z:-7});
  expect(p.x).toBeLessThan(2.75);
  const partition=collisionStep({x:2,z:-14.1},{x:3.9,z:-14.1});
  expect(partition.x).toBeLessThan(2.25);
 });
 it('door and behind-the-rail are represented by the same physical coordinates',()=>{
  const p=safeWalkPoint(0,-3.45);expect(p.z).toBeCloseTo(-3.45);
  expect(safeWalkPoint(3.45,-7).x).not.toBeCloseTo(3.45);
 });
 it('releases destination and manual keyboard input when stopping',()=>{
  const p=new POVWalk();p.start(0,-3,0);p.go('provador');p.key('w',true);p.update(1/60);p.stop();expect(p.pose.active).toBe(false);
 });
});
describe('Belle V58 canonical category completeness',()=>{
 it('shows exact active IDs for each category and both sides',()=>{
   for(const category of SHOP_CATEGORIES){
    const expected=DEMO_CATALOG.filter(p=>p.active&&p.category===category).map(p=>p.id);
    for(const side of [-1,1] as const){
     const actual=filteredProducts(category,side).map(p=>p.id);
     expect(actual).toEqual(expected);
     const ids=new Set<string>();
     for(let page=0;page<Math.ceil(actual.length/8);page++){
      for(const product of categoryPage(filteredProducts(category,side),page).visible)ids.add(product.id);
     }
     expect([...ids]).toEqual(expected);
    }
   }
 });
 it('paginates with stable selected ID on later pages',()=>{
  const p=DEMO_CATALOG.filter(item=>item.active).slice(0,23);
  const last=p[22]!;
  const got=categoryPage(p,0,last.id);
  expect(got.page).toBe(2);
  expect(got.visible.some(x=>x.id===last.id)).toBe(true);
 });
 it('reports absent bermudas without synthesizing inventory',()=>{
  expect(SHOP_CATEGORIES.includes('bermudas' as never)).toBe(false);
  expect(DEMO_CATALOG.some(p=>p.category===('bermudas' as never))).toBe(false);
 });
});

