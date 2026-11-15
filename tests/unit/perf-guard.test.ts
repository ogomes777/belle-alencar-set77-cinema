import {describe,expect,it} from 'vitest';
import {weakDevice,median} from '../../src/core/perf-guard';
describe('V37 perf guard',()=>{
  it('flags weak devices only',()=>{
    expect(weakDevice({memory:2})).toBe(true);
    expect(weakDevice({memory:4,cores:8})).toBe(true);
    expect(weakDevice({cores:2})).toBe(true);
    expect(weakDevice({saveData:true,memory:8})).toBe(true);
    expect(weakDevice({memory:8,cores:8})).toBe(false);
    expect(weakDevice({})).toBe(false);
  });
  it('uses the median so one hitch does not trigger lite mode',()=>{
    expect(median([16,16,16,200])).toBe(16);
    expect(median([30,25,28])).toBe(28);
  });
});
