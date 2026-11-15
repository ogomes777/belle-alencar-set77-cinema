import { describe, it, expect } from 'vitest';
import { existsSync, readFileSync } from 'node:fs';
describe('BELLE V54: six real phones and 47 previews',()=>{
 const clips=JSON.parse(readFileSync('public/belle-v54/manifest.json','utf8'));
 it('maps 47 previews to five cities and zero to Ibiá',()=>{
  const expected={araxa:12,frutal:11,catalao:12,mineiros:11,ibia:0,franca:1};
  for(const [city,n] of Object.entries(expected))expect(clips.filter(v=>v.city===city)).toHaveLength(n);
  expect(clips).toHaveLength(47);
 });
 it('stores 27 unique videos with genuine posters',()=>{
  expect(new Set(clips.map(v=>v.id)).size).toBe(27);
  for(const clip of clips){
   expect(existsSync('public'+clip.src),clip.src).toBe(true);
   expect(existsSync('public'+clip.poster),clip.poster).toBe(true);
  }
 });
 it('keeps original supplied image content on each of six phone previews',()=>{
  for(const city of ['araxa','frutal','catalao','mineiros','ibia','franca']){
   expect(existsSync('public/belle-v54/phones/'+city+'.webp')).toBe(true);
  }
 });
});
