/**
 * Seções editoriais de conversão (ocasiões, looks, como comprar, atendimento, FAQ).
 * Conteúdo já está no HTML (funciona sem JS); aqui só: ilustrações, contagens
 * reais do catálogo demo, ponte com o provador 3D e reveals discretos.
 */
import './styles/sections.css';
import { bus } from './core/bus';
import { $$ } from './core/dom';

import { DEMO_CATALOG } from './commerce/catalog.demo';
import type { DressParams } from './core/dress';

export function initSections(): void {
  // Artigos reais do protótipo editorial: mesma imagem usada no catálogo, lookbook e rack.
  // Imagens são sintéticas; não representam estoque ou SKUs oficiais da Belle.
  const artSlugs = [
    'camisas-01','bolsas-02', 'croppeds-03','bolsas-03', 'vestidos-01','aneis-02',
    'vestidos-01','aneis-02', 'vestidos-02','bolsas-03', 'vestidos-03','pulseiras-03',
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

  $$<HTMLElement>('[data-open-product]').forEach(el => {
    const product=DEMO_CATALOG.find(p=>p.slug===el.dataset.openProduct);
    if (!product) return;
    const suffix=el.querySelector('span');
    el.replaceChildren(document.createTextNode(product.title+' '));
    if(suffix)el.append(suffix);
  });
  // contagem real de peças por ocasião (prévia)
  $$<HTMLElement>('[data-occ-count]').forEach((el) => {
    const n = DEMO_CATALOG.filter((p) => p.active && p.occasion === el.dataset.occCount).length;
    el.textContent = `${n} ${n === 1 ? 'peça' : 'peças'} na prévia`;
  });

  // "ver no provador 3D" a partir de um look
  $$<HTMLButtonElement>('[data-try-look]').forEach((b) =>
    b.addEventListener('click', () => {
      try {
        const selected = b.closest('.look')?.querySelector<HTMLElement>('[data-open-product]');
        const p = DEMO_CATALOG.find(p=>p.slug===selected?.dataset.openProduct);
        bus.emit('dress:try', { ...(JSON.parse(b.dataset.tryLook!) as DressParams), ...(p ? { productId:p.id, tone:p.tone, silhouette:p.silhouette ?? 'fluido', label:p.title } : {}) });
      } catch {
        /* ignore */
      }
    }),
  );

  // Revelation timing now belongs to Motion Director V8; this module stays responsible for commerce data and interactions.
}
