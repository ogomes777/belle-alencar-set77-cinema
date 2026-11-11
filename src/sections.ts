/**
 * Seções editoriais de conversão (ocasiões, como comprar, atendimento, FAQ).
 * Conteúdo editorial permanece no HTML; aqui só as ilustrações existentes
 * e contagens por ocasião do catálogo demonstrativo.
 */
import './styles/sections.css';
import { $$ } from './core/dom';

import { DEMO_CATALOG } from './commerce/catalog.demo';

export function initSections(): void {
  // Artigos reais do protótipo editorial: mesma imagem usada no catálogo, lookbook e rack.
  // Imagens são sintéticas; não representam estoque ou SKUs oficiais da Belle.
  const artSlugs = [
    'camisas-01','bolsas-02','croppeds-03','bolsas-03','vestidos-01','aneis-02',
  ];
  $$<HTMLElement>('[data-ill]').forEach((el, i) => {
    const product=DEMO_CATALOG.find(p=>p.slug===artSlugs[i]);
    if(!product?.cutout)return;
    const img=document.createElement('img');
    img.src=product.cutout;
    img.alt='';
    img.width=product.cutoutSize?.[0] ?? 600;img.height=product.cutoutSize?.[1] ?? 900;
    img.dataset.productId=product.id;
    img.decoding='async';img.loading='lazy';
    img.className='editorial-cutout';
    el.replaceChildren(img);
  });

  // contagem real de peças por ocasião (prévia)
  $$<HTMLElement>('[data-occ-count]').forEach((el) => {
    const n = DEMO_CATALOG.filter((p) => p.active && p.occasion === el.dataset.occCount).length;
    el.textContent = `${n} ${n === 1 ? 'peça' : 'peças'} na prévia`;
  });

  // Revelation timing now belongs to Motion Director V8; this module stays responsible for commerce data and interactions.
}
