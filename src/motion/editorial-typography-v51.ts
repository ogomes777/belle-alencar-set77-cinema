/** BELLE V51: accessible editorial lettering reveals.
 * Runs only for select semantic text nodes away from the existing scroll film.
 * Does not change markup, split words, alter i18n keys or hijack scrolling.
 * No forced opacity before intersection: text is readable if JS fails.
 */
export function initTypographyCinema(): void {
  if (!('IntersectionObserver' in window)) return;
  const reduced=window.matchMedia('(prefers-reduced-motion: reduce)');
  if (reduced.matches || document.documentElement.classList.contains('perf-lite')) return;
  const selectors=[
    '#passarela .runway__intro h2',
    '#ocasioes .eyebrow','#ocasioesTitle','#ocasioes .lede',
    '#colecao .eyebrow','#colecaoTitle','#colecao .section-head .lede',
    '#como-comprar .eyebrow','#howTitle','#como-comprar .lede',
    '#lojas .eyebrow','#lojasTitle','#lojas .lede',
    '#atendimento .eyebrow','#conciergeTitle','#atendimento .brand-story__lead',
    '#duvidas .eyebrow','#faqTitle','#finaleTitle'
  ];
  const targets=selectors.flatMap(s=>Array.from(document.querySelectorAll<HTMLElement>(s)));
  const unique=Array.from(new Set(targets));
  const last=new WeakMap<HTMLElement,number>();
  const observer=new IntersectionObserver(entries=>{
    for(const entry of entries){
      if(!entry.isIntersecting)continue;
      if(reduced.matches || document.documentElement.classList.contains('perf-lite'))continue;
      const el=entry.target as HTMLElement;
      const now=performance.now();
      if(now-(last.get(el)??-Infinity)<800)continue;
      last.set(el,now);
      const micro=el.classList.contains('eyebrow');
      const lede=el.classList.contains('lede');
      // Serif headers reveal horizontally like a fashion editorial title.
      // Small labels enter from the margin and paragraphs rise subtly.
      const frames=micro
        ? [{opacity:.18,transform:'translate3d(-11px,0,0)'},{opacity:1,transform:'none'}]
        : lede
          ? [{opacity:.38,transform:'translate3d(0,14px,0)'},{opacity:1,transform:'none'}]
          : [{opacity:.35,clipPath:'inset(0 100% 0 0)'},{opacity:1,clipPath:'inset(0 0 0 0)'}];
      el.animate(frames,{duration:micro?480:lede?590:800,easing:'cubic-bezier(.16,1,.3,1)'});
      el.dataset.typoAnimated='true';
    }
  },{threshold:.17,rootMargin:'0px 0px -8% 0px'});
  // Film cards have their own scroll-linked animation. Do not double animate.
  for(const el of unique)observer.observe(el);
}
