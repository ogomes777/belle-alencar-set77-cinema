import { describe, expect, it } from 'vitest';
import { DEMO_CATALOG } from '../../src/commerce/catalog.demo';
import { SHOP_CATEGORIES } from '../../src/commerce/types';
import { CATALOG_MANIFEST as manifest } from '../../src/commerce/catalog.data';
describe('48 canonical isolated products',()=>{
 it('exposes exactly six products in all eight categories',()=>{
  expect(DEMO_CATALOG).toHaveLength(48);
  expect(new Set(DEMO_CATALOG.map(p=>p.id)).size).toBe(48);
  for(const category of SHOP_CATEGORIES)expect(DEMO_CATALOG.filter(p=>p.category===category)).toHaveLength(6);
 });
 it('preserves manifest identity and real local media in every surface',()=>{
  for(const p of DEMO_CATALOG){
   const source=manifest.find((x:{slug:string})=>x.slug===p.slug);
   expect(p.title).toBe(source!.name);expect(p.demoId).toBe(source!.id);
   expect(p.isDemo).toBe(true);expect(p.inventoryConfirmed).toBe(false);expect(p.price.priceCents).toBeNull();
   for(const file of [p.cutout,p.packshot]){expect(file).toMatch(/^\/assets\/belle\/products\//);}
   expect(p.cutoutSize).toEqual(source!.cutoutDimensions);
   const [w,h]=p.cutoutSize!;const [l,t,r,b]=p.cutoutBounds!;
   expect(l).toBeGreaterThan(0);expect(t).toBeGreaterThan(0);expect(r).toBeLessThan(w);expect(b).toBeLessThan(h);
  }
 });
 it('keeps the repaired black dress distinct and removes the human-slit candidate',()=>{
  const p=DEMO_CATALOG.find(p=>p.slug==='vestidos-06')!;
  expect(p.cutoutSize).toEqual([827,1629]);
 });
});
