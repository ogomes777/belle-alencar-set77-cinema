import type { Product, Size } from '../commerce/types';
export const MODEL_SOURCE = 'https://images.higgs.ai/?default=1&output=webp&url=https%3A%2F%2Fd8j0ntlcm91z4.cloudfront.net%2Fuser_38xzZboKViGWJOttwIXH07lWA1P%2Fhf_20261102_042056_1a704ff7-b0e5-4a9f-bbda-62392b819fb6.png&w=3840&q=85';
export const PIECE_SOURCE = 'https://images.higgs.ai/?default=1&output=webp&url=https%3A%2F%2Fd8j0ntlcm91z4.cloudfront.net%2Fuser_38xzZboKViGWJOttwIXH07lWA1P%2Fhf_20261102_042057_080e85b0-b4aa-4072-8eb9-2304c7baf42b.png&w=2400&q=85';
const localMedia = import.meta.glob<string>('./assets/*.webp', { eager: true, query: '?url', import: 'default' });
export const MODEL_SHEET = localMedia['./assets/models.webp'] ?? '';
export const PIECE_SHEET = localMedia['./assets/pieces.webp'] ?? '';
export const MODEL_BOXES = [[12,176],[178,330],[331,470],[476,633],[634,767],[767,956]] as const;
export const FALLBACKS = ['fluido-perola','fluido-terracota','classico-champagne','marcante-rosa','fluido-gelo','classico-perola'];
const pieces = [
  [26,224,28,214,'Jaqueta de plumas','conjuntos'], [304,412,22,236,'Calça ampla de cetim','conjuntos'],
  [530,666,12,242,'Vestido plissado','vestidos'], [752,922,100,146,'Cinto dourado','acessorios'],
  [70,176,246,466,'Vestido trench de cetim','vestidos'], [294,422,294,432,'Bolsa de mão','acessorios'],
  [508,688,240,452,'Blusa de mangas amplas','conjuntos'], [780,890,252,466,'Calça de cintura marcada','conjuntos'],
  [64,178,484,698,'Casaco azul suave','conjuntos'], [316,396,482,698,'Calça reta marfim','conjuntos'],
  [530,672,508,682,'Blusa de babados','conjuntos'], [754,916,484,700,'Saia longa plissada','conjuntos'],
] as const;
export const RUNWAY_PRODUCTS: Product[] = pieces.map(([x0,x1,y0,y1,title,category], i) => {
  const id = `editorial-${i + 1}`, sizes: Size[] = category === 'acessorios' ? ['Único'] : ['PP','P','M','G','GG'];
  return { id, slug: id, sku: `EDITORIAL-${i + 1}`, title, category, occasion: 'celebrar', tone: 'perola',
    description: 'Peça da referência visual do lookbook. Estudo editorial demonstrativo; não representa o acervo ou o estoque da Belle. Consulte a loja para encontrar uma proposta semelhante.',
    illustration: { kind: category === 'vestidos' ? 'dress' : category === 'acessorios' ? (i === 3 ? 'belt' : 'bag') : 'set', tone: 'perola', seed: i + 30 },
    variants: sizes.map(size => ({ id: `${id}-${size}`, productId: id, size, sku: `${id}-${size}` })),
    sprite: { src: PIECE_SHEET, box: [x0,y0,x1-x0,y1-y0], sheet: [960,720] },
    price: { priceCents: null, currency: 'BRL' }, isDemo: true, active: true,
    mediaRights: { source: 'Referência visual fornecida pelo usuário — Maison Vell', status: 'demo', note: 'Estudo editorial, não é acervo Belle.' },
  };
});
