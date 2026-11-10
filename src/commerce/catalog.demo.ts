/**
 * Canonical 48 synthetic demo products from the supplied production kit.
 * No official merchandise, prices, availability, fitted sizing or digital twins.
 * Existing lowercase IDs/variant IDs stay stable so saved store bags survive.
 */
import { CATALOG_MANIFEST } from './catalog.data';
import type { Category, Occasion, Product, Size, CatalogSource } from './types';
import type { Silhouette, Tone } from '../core/dress';
import type { IllustrationKind } from '../core/illustration';

const clothing: Size[] = ['PP','P','M','G','GG'], accessory: Size[] = ['Único'];
function kind(category: Category): IllustrationKind {
  return category === 'vestidos' ? 'dress' : category === 'bolsas' ? 'bag' : category === 'aneis' ? 'earring' : category === 'pulseiras' ? 'belt' : 'set';
}
function tone(color: string): Tone {
  const x=color.toLowerCase();
  if(x.includes('vinho')) return 'vinho';
  if(x.includes('rosa') || x.includes('rosé')) return 'rosa';
  if(x.includes('chocolate') || x.includes('preto')) return 'noite';
  if(x.includes('azul')) return 'gelo';
  if(x.includes('oliva') || x.includes('verde')) return 'salvia';
  if(x.includes('dourado')) return 'dourado';
  return x.includes('branco') || x.includes('off-white') ? 'perola' : 'champagne';
}
function silhouette(i: number): Silhouette { return (['fluido','marcante','classico'] as const)[i % 3]!; }
function occasion(category: Category, i: number): Occasion {
  if(category === 'vestidos') return (['celebrar','noite','celebrar','dia','noite','celebrar'] as const)[i % 6]!;
  if(category === 'bolsas' || category === 'aneis' || category === 'pulseiras') return i % 2 ? 'noite' : 'celebrar';
  return i % 3 === 1 ? 'noite' : 'dia';
}

export const DEMO_CATALOG: Product[] = CATALOG_MANIFEST.map((s,i) => {
  const id = `belle-demo-${s.slug}`, sku = `DEMO-${s.slug.toUpperCase()}`;
  const sizes = ['aneis','bolsas','pulseiras'].includes(s.category) ? accessory : clothing;
  const sil = s.category === 'vestidos' ? silhouette(i) : undefined, t=tone(s.color);
  return {
    id, demoId: s.id, slug: s.slug, sku, title: s.name, description: s.description,
    category: s.category, occasion: occasion(s.category,i), tone: t, silhouette: sil,
    illustration: {kind: kind(s.category), tone:t, silhouette:sil, seed:i+400},
    cutout: `/assets/belle/products/cutouts/${s.slug}.webp`,
    packshot: `/assets/belle/products/packshots/${s.slug}.webp`,
    cutoutSize:s.cutoutDimensions, cutoutBounds:s.cutoutBounds,
    packshotBounds:s.packshotOpticalBoundsNormalized,
    variants: sizes.map(size => ({id:`${sku}-${size}`, productId:id, sku:`${sku}-${size}`, size})),
    price:{priceCents:null,currency:'BRL'}, isDemo:true, inventoryConfirmed:false, active:true,
    mediaRights:{source:'Estudo sintético do kit Belle · recorte alpha individual',status:'demo',note:'Não representa produto, preço, tamanho disponível ou estoque oficial da Belle.'},
  };
});
export const demoCatalogSource: CatalogSource = {
  async list() { return DEMO_CATALOG; },
  async bySlug(slug) { return DEMO_CATALOG.find(p => p.slug === slug); },
};
export const productById = (id: string) => DEMO_CATALOG.find(p => p.id === id);
export const productBySlug = (slug: string) => DEMO_CATALOG.find(p => p.slug === slug);
