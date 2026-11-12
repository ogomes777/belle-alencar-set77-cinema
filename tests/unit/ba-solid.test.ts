import {describe,it,expect} from 'vitest';
import * as THREE from 'three';
import {BA_FOIL_CONTOURS} from '../../src/finale/ba-contours';
import {buildBAShape} from '../../src/finale/ba-solid';
describe('Belle BA finale V28 — single physically extruded brand',()=>{
 it('is one consolidated shape with the three cutouts of the provided logo',()=>{
   expect(BA_FOIL_CONTOURS.length).toBe(4);
   const shape=buildBAShape(THREE);
   expect(shape.holes).toHaveLength(3);
   expect(THREE.ShapeUtils.isClockWise(shape.extractPoints().shape)).toBe(true);
 });
 it('has non-zero real thickness and front/back faces',()=>{
   const g=new THREE.ExtrudeGeometry(buildBAShape(THREE),{
     depth:.38,bevelEnabled:true,bevelSize:.028,bevelThickness:.036,bevelSegments:3
   });
   g.computeBoundingBox();
   expect(g.boundingBox!.max.z-g.boundingBox!.min.z).toBeGreaterThan(.38);
   expect(g.getAttribute('position').count).toBeGreaterThan(500);
   g.dispose();
 });
});
