import {afterEach,describe,expect,it,vi} from 'vitest';
import {initEditorialBoundaries} from '../../src/motion/editorial-boundaries';

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
  return {section,move(value:number){top=value;window.dispatchEvent(new Event('scroll'));callback?.(0);}};
}
describe('V37 boundary integration',()=>{
  it('reverses without touching commercial controls and destroys its enhancement',()=>{
    const {section,move}=fixture();const product=document.getElementById('product')!;const originalStyle=product.getAttribute('style');
    const click=vi.fn();product.addEventListener('click',click);
    const destroy=initEditorialBoundaries();const first=section.style.getPropertyValue('--v37-entry');
    move(200);expect(section.style.getPropertyValue('--v37-entry')).toBe('1.0000');
    move(850);expect(section.style.getPropertyValue('--v37-entry')).toBe(first);
    product.click();expect(click).toHaveBeenCalledOnce();expect(product.getAttribute('style')).toBe(originalStyle);
    destroy();move(200);expect(section.classList.contains('v37-boundary')).toBe(false);expect(section.style.getPropertyValue('--v37-entry')).toBe('');
  });
  it.each(['reduced','essential'])('keeps static content untouched in %s mode',mode=>{
    const {section}=fixture(mode==='reduced');if(mode==='essential')document.documentElement.dataset.intensity='essential';
    const destroy=initEditorialBoundaries();expect(section.classList.contains('v37-boundary')).toBe(false);expect(document.querySelector('h2')!.textContent).toBe('Original');destroy();
  });
});
