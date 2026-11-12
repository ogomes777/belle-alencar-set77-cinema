import {describe,it,expect} from 'vitest';
import {resolveTier,type Capabilities} from '../../src/core/tier';
const base:Capabilities={
 reducedMotion:false,saveData:false,coarse:false,small:false,
 webgl2:true,softwareRenderer:false,cores:8,memory:8
};
describe('Belle V29 · hardware-aware film safety',()=>{
 it('disables heavy WebGL when only a software renderer is present',()=>{
   expect(resolveTier({...base,softwareRenderer:true},'cinema')).toBe('static');
 });
 it('keeps 3D cinematic on supported real GPU',()=>{
   expect(resolveTier(base,'cinema')).toBe('cinema');
 });
 it('uses lightweight touch on a mobile device with real WebGL',()=>{
   expect(resolveTier({...base,coarse:true,small:true},'cinema')).toBe('touch');
 });
 it('falls back on low core / data saver and allows explicit QA override',()=>{
   expect(resolveTier({...base,cores:2},'cinema')).toBe('static');
   expect(resolveTier({...base,saveData:true},'cinema')).toBe('static');
   expect(resolveTier({...base,softwareRenderer:true},'cinema','touch')).toBe('touch');
 });
});
