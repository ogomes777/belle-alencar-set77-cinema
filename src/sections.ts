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
    'vestidos-01','pulseiras-05', 'vestidos-05','bolsas-05', 'camisas-03','calcas-01',
  ];
  $$<HTMLElement>('[data-ill]').forEach((el, i) => {
    const product=DEMO_CATALOG.find(p=>p.slug===artSlugs[i]);
    if(!product?.cutout)return;
    const img=document.createElement('img');
    img.src=product.cutout;
    img.alt='';
    img.width=360;img.height=480;
    img.decoding='async';img.loading='lazy';
    img.className='editorial-cutout';
    el.replaceChildren(img);
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
        bus.emit('dress:try', JSON.parse(b.dataset.tryLook!) as DressParams);
      } catch {
        /* ignore */
      }
    }),
  );

  // reveal ao entrar na tela (sem JS ou com reduced-motion, tudo já visível)
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (reduce || !('IntersectionObserver' in window)) return;
  const targets = $$<HTMLElement>('[data-reveal], .occ-card, .look, .how__steps li, .faq details');
  targets.forEach((el) => el.classList.add('rv'));
  const io = new IntersectionObserver(
    (entries) =>
      entries.forEach((e) => {
        if (!e.isIntersecting) return;
        e.target.classList.add('rv-in');
        io.unobserve(e.target);
      }),
    { rootMargin: '0px 0px -12% 0px', threshold: 0.08 },
  );
  targets.forEach((el) => io.observe(el));
}
