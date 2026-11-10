import type { Product } from './types';

/** Packshots have a fixed transparent 900×1125 canvas; scene/flight uses tight cutouts. */
export function productImage(p: Product, options: { scene?: boolean; eager?: boolean; alt?: string } = {}): HTMLImageElement {
  const img = document.createElement('img');
  const scene = options.scene || !p.packshot;
  img.src = scene ? p.cutout! : p.packshot!;
  img.alt = options.alt ?? `Estudo sintético demonstrativo: ${p.title}`;
  const [w,h] = scene ? p.cutoutSize ?? [720,1200] : [900,1125];
  img.width=w!; img.height=h!;
  img.decoding='async'; img.loading=options.eager?'eager':'lazy';
  img.dataset.productId=p.id; img.dataset.productSlug=p.slug;
  return img;
}
