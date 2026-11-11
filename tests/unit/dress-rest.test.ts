import {describe,it,expect} from 'vitest';
import * as THREE from 'three';
import {DressRig} from '../../src/experience/cloth/dress';

describe('hero skirt returns to a stable rest pose',()=>{
  it('resets every simulated vertex and velocity when a deep scroll returns to the rail',()=>{
    const dress=new DressRig({cols:16,rows:8,iterations:3},new THREE.Texture());
    const geom=dress.skirt.geometry;
    const p=(geom.getAttribute('position') as THREE.BufferAttribute);
    dress.group.position.set(4.72,1.36,-6.4);
    dress.group.rotation.y=Math.PI/2;
    dress.restPose();
    expect(Number.isFinite(p.getX(0))).toBe(true);
    const first=[p.getX(0),p.getY(0),p.getZ(0)];
    expect(first[0]).toBeGreaterThan(4.4);
    expect(first[2]).toBeLessThan(-6);
    dress.group.position.set(0,1.34,-8);
    dress.group.rotation.y=Math.PI*1.4;
    dress.restPose();
    expect(Math.abs(p.getX(0)-first[0])).toBeGreaterThan(2);
    dress.group.position.set(4.72,1.36,-6.4);
    dress.group.rotation.y=Math.PI/2;
    dress.restPose();
    expect([p.getX(0),p.getY(0),p.getZ(0)]).toEqual(first);
    const arr=p.array as Float32Array;
    expect([...arr].every(Number.isFinite)).toBe(true);
    dress.dispose();
  });
});
