import { describe, it, expect } from 'vitest';
import { existsSync, readFileSync } from 'node:fs';

type Clip={city:string;order:number;src:string;poster:string;id:string};
describe('BELLE V54 — six real phones and 47 authorized previews',()=>{
  const clips=JSON.parse(readFileSync('public/belle-v54/manifest.json','utf8')) as Clip[];
  it('keeps precisely 47 city preview positions and no Ibiá video',()=>{
    const expected:Record<string,number>={araxa:12,frutal:11,catalao:12,mineiros:11,ibia:0,franca:1};
    for(const [city,n] of Object.entries(expected)) expect(clips.filter(v=>v.city===city)).toHaveLength(n);
    expect(clips).toHaveLength(47);
  });
  it('de-duplicates to exactly 27 unique video files and has all posters',()=>{
    expect(new Set(clips.map(v=>v.id)).size).toBe(27);
    for(const clip of clips){
      expect(existsSync('public'+clip.src),clip.src).toBe(true);
      expect(existsSync('public'+clip.poster),clip.poster).toBe(true);
    }
  });
  it('includes six source-faithful phone portraits',()=>{
    for(const city of ['araxa','frutal','catalao','mineiros','ibia','franca']){
      expect(existsSync('public/belle-v54/phones/'+city+'.webp')).toBe(true);
    }
  });
});
