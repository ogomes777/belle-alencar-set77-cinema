import type { Product } from '../commerce/types';
import { illustrate } from '../core/illustration';
import { productImage } from '../commerce/media';
const NS = 'http://www.w3.org/2000/svg';
export function crop(src: string, box: readonly number[], sheet: readonly number[]): SVGSVGElement {
  const [x,y,w,h] = box;
  const svg = document.createElementNS(NS, 'svg');
  svg.setAttribute('viewBox', `${x} ${y} ${w} ${h}`);
  svg.setAttribute('aria-hidden', 'true');
  const clip = document.createElementNS(NS, 'svg');
  for (const [key, value] of Object.entries({ x,y,width:w,height:h,viewBox:`${x} ${y} ${w} ${h}`, overflow:'hidden' })) clip.setAttribute(key, String(value));
  const image = document.createElementNS(NS, 'image');
  image.setAttribute('href', src); image.setAttribute('width', String(sheet[0])); image.setAttribute('height', String(sheet[1]));
  clip.append(image); svg.append(clip);
  return svg;
}
// Render local artwork immediately. A failed reference request never hides the interface.
export function mountEditorialMedia(host: HTMLElement, product: Product): void {
  if (product.cutout) {
    const img = productImage(product, { eager: true });
    img.className = 'editorial-product-image';
    host.replaceChildren(img);
    return;
  }
  host.innerHTML = illustrate(product.illustration, `Ilustração demonstrativa: ${product.title}`);
  const sprite = product.sprite;
  if (!sprite?.src || !Image.prototype.decode) return;
  const image = new Image(); image.src = sprite.src;
  void image.decode().then(() => host.replaceChildren(crop(sprite.src, sprite.box, sprite.sheet))).catch(() => {});
}
