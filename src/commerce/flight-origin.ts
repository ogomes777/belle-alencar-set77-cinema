import type { Product } from './types';

/**
 * Match the cutout's full canvas to the visible alpha shape inside a contained packshot.
 * The transient origin has no pixels: the flight renders the same product's tight cutout.
 */
export function flightOrigin(image: HTMLImageElement, product: Product, sourceKind: 'packshot' | 'cutout' = 'packshot'): HTMLElement {
  const packed=sourceKind==='packshot' && !!product.packshot;
  const r=image.getBoundingClientRect();
  const [iw,ih]=packed ? [900,1125] : product.cutoutSize ?? [720,1200];
  const fit=Math.min(r.width/iw!,r.height/ih!);
  const w=iw!*fit, h=ih!*fit, x=r.left+(r.width-w)/2, y=r.top+(r.height-h)/2;
  const [tw,th]=product.cutoutSize ?? [720,1200];
  const raw=product.cutoutBounds ?? [0,0,tw,th];
  const tight=[raw[0]/tw,raw[1]/th,raw[2]/tw,raw[3]/th];
  const pack=packed ? product.packshotBounds ?? [0,0,1,1] : tight;
  const opaqueW=w*(pack[2]!-pack[0]!);
  const [cw,ch]=product.cutoutSize ?? [720,1200];
  const fullW=opaqueW/(tight[2]!-tight[0]!), fullH=fullW*ch!/cw!;
  const el=document.createElement('span');
  el.dataset.productId=product.id; el.setAttribute('aria-hidden','true');
  Object.assign(el.style,{position:'fixed',pointerEvents:'none',opacity:'0',left:`${x+w*pack[0]!-fullW*tight[0]!}px`,top:`${y+h*pack[1]!-fullH*tight[1]!}px`,width:`${fullW}px`,height:`${fullH}px`});
  document.body.append(el);
  return el;
}
