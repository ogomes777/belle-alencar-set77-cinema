import {afterEach,describe,expect,it,vi} from 'vitest';
import {BOUNDARIES,initEditorialBoundaries} from '../../src/motion/editorial-boundaries';
import {invalidateGeometry} from '../../src/core/scroll-geometry';

afterEach(()=>{vi.unstubAllGlobals();document.body.replaceChildren();delete document.documentElement.dataset.intensity;});
function fixture(reduced=false){
  document.body.innerHTML='<section id="colecao"><header class="section-head"><h2>Original</h2></header><button id="product" style="opacity:1;transform:translateX(2px)">Comprar</button></section>';
  let callback:FrameRequestCallback|undefined,top=850;
  const section=document.querySelector<HTMLElement>('section')!;
  vi.spyOn(section,'getBoundingClientRect').mockImplementation(()=>({top,bottom:top+500,left:0,right:500,width:500,height:500,x:0,y:top,toJSON:()=>({})}));
  vi.stubGlobal('innerHeight',900);
  vi.stubGlobal('matchMedia',()=>({matches:reduced,addEventListener:()=>{},removeEventListener:()=>{}}));
  vi.stubGlobal('requestAnimationFrame',(fn:FrameRequestCallback)=>{callback=fn;return 1;});
  vi.stubGlobal('cancelAnimationFrame',()=>{callback=undefined;});
  return {section,move(value:number){top=value;invalidateGeometry();window.dispatchEvent(new Event('scroll'));callback?.(0);}};
}
describe('V37 boundary integration',()=>{
  it('reverses without touching commercial controls and destroys its enhancement',()=>{
    const {section,move}=fixture();const product=document.getElementById('product')!;const originalStyle=product.getAttribute('style');
    const click=vi.fn();product.addEventListener('click',click);
    const destroy=initEditorialBoundaries();const veil=()=>section.querySelector<HTMLElement>('.v37-veil')!;
    expect(veil().getAttribute('aria-hidden')).toBe('true');const first=veil().style.getPropertyValue('--v37-entry');
    move(-50);expect(veil().style.getPropertyValue('--v37-entry')).toBe('1.0000');
    move(850);expect(veil().style.getPropertyValue('--v37-entry')).toBe(first);
    product.click();expect(click).toHaveBeenCalledOnce();expect(product.getAttribute('style')).toBe(originalStyle);
    destroy();move(-50);expect(section.classList.contains('v37-boundary')).toBe(false);expect(section.querySelector('.v37-veil')).toBeNull();
  });
  it.each(['reduced','essential'])('keeps static content untouched in %s mode',mode=>{
    const {section}=fixture(mode==='reduced');if(mode==='essential')document.documentElement.dataset.intensity='essential';
    const destroy=initEditorialBoundaries();expect(section.classList.contains('v37-boundary')).toBe(false);expect(document.querySelector('h2')!.textContent).toBe('Original');destroy();
  });
});

describe('V37 boundary progress contract',()=>{
  it('is monotonic, clamped and symmetric for reverse scroll',async()=>{
    const {boundaryProgress}=await import('../../src/motion/editorial-boundaries');
    const down=[900,800,700,600,500].map(t=>boundaryProgress(t,900));
    for(let i=1;i<down.length;i++)expect(down[i]!).toBeGreaterThanOrEqual(down[i-1]!);
    expect(boundaryProgress(2000,900)).toBe(0);expect(boundaryProgress(-500,900)).toBe(1);
    const up=[500,600,700,800,900].map(t=>boundaryProgress(t,900));expect(up).toEqual([...down].reverse());
  });
  it('marks completion so masks drop, and re-enters on the way back',()=>{
    const {section,move}=fixture();const destroy=initEditorialBoundaries([{section:'#colecao'}]);
    move(-100);expect(section.classList.contains('v37-done')).toBe(true);
    move(700);expect(section.classList.contains('v37-done')).toBe(false);expect(section.classList.contains('v37-boundary')).toBe(true);
    destroy();
  });
  it('measures a stable anchor, never requiring the animated node',()=>{
    document.body.innerHTML='<section id="ocasioes"><div class="occ-round"></div></section>';
    const anchor=document.querySelector<HTMLElement>('.occ-round')!;let cb:FrameRequestCallback|undefined;
    const spy=vi.spyOn(anchor,'getBoundingClientRect').mockImplementation(()=>({top:-100,bottom:600,left:0,right:1,width:1,height:500,x:0,y:100,toJSON:()=>({})}));
    vi.stubGlobal('innerHeight',900);vi.stubGlobal('matchMedia',()=>({matches:false,addEventListener:()=>{},removeEventListener:()=>{}}));
    vi.stubGlobal('requestAnimationFrame',(fn:FrameRequestCallback)=>{cb=fn;return 1;});vi.stubGlobal('cancelAnimationFrame',()=>{});
    const destroy=initEditorialBoundaries([{section:'#ocasioes',anchor:'.occ-round'}]);
    expect(spy).toHaveBeenCalled();expect(document.getElementById('ocasioes')!.style.getPropertyValue('--v37-entry')).toBe('1.0000');
    expect(anchor.getAttribute('style')).toBeNull();cb;destroy();
  });
});

describe('V43: ceremonial reveals exchanged without moving the sections',()=>{
  it('plays Assinatura / Belle Alencar on the founder story, then Atendimento / Com você on the final page',()=>{
    const story=BOUNDARIES.find(x=>x.section==='#atendimento');
    const finale=BOUNDARIES.find(x=>x.section==='.finale');
    expect(story).toMatchObject({veil:'veludo',chapter:'06 · Assinatura',title:['Belle',' Alencar.']});
    expect(finale).toMatchObject({veil:'lateral',chapter:'07 · Atendimento',title:['Com',' você.']});
    expect(BOUNDARIES).toHaveLength(7);
    expect(BOUNDARIES.slice(0,5).map(x=>x.veil)).toEqual(['cortina','colunas','varredura','dobra','circulo']);
  });
  it('mounts the correct decorative veils only on their original anchors',()=>{
    document.body.innerHTML='<section id="atendimento"><div class="brand-story">Historia Belle</div><div data-concierge-reveal></div></section><section class="finale"><div id="atendimento-final"><button>Falar</button></div></section>';
    const mq={matches:false,addEventListener:()=>{},removeEventListener:()=>{}};
    vi.stubGlobal('matchMedia',()=>mq);
    vi.stubGlobal('innerHeight',900);
    const first=document.querySelector<HTMLElement>('#atendimento')!;
    const last=document.querySelector<HTMLElement>('.finale')!;
    for(const el of [first,last])vi.spyOn(el,'getBoundingClientRect').mockImplementation(()=>({top:550,bottom:1250,left:0,right:800,width:800,height:700,x:0,y:550,toJSON:()=>({})}));
    const destroy=initEditorialBoundaries();
    const intro=first.querySelector<HTMLElement>('.v37-veil')!;
    const outro=last.querySelector<HTMLElement>('.v37-veil')!;
    expect(intro.classList.contains('v37-veil--veludo')).toBe(true);
    expect(outro.classList.contains('v37-veil--lateral')).toBe(true);
    expect(intro.querySelector('.v37-veil__chapter')?.textContent).toBe('06 · Assinatura');
    expect(intro.querySelector('.v37-veil__title')?.textContent).toBe('Belle Alencar.');
    expect(outro.querySelector('.v37-veil__chapter')?.textContent).toBe('07 · Atendimento');
    expect(outro.querySelector('.v37-veil__title')?.textContent).toBe('Com você.');
    expect(first.querySelector('[data-concierge-reveal]')).toBeTruthy();
    expect(last.querySelector('#atendimento-final button')?.textContent).toBe('Falar');
    expect(intro.getAttribute('aria-hidden')).toBe('true');
    expect(outro.getAttribute('aria-hidden')).toBe('true');
    destroy();
    expect(document.querySelectorAll('.v37-veil')).toHaveLength(0);
  });
});
