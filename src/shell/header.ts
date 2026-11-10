/** Header: compacta ao rolar, marca a seção ativa da navegação. */
export function initHeader(): void {
  const header = document.getElementById('siteHeader');
  if (!header) return;
  let ticking = false;
  const update = () => {
    ticking = false;
    header.classList.toggle('is-compact', scrollY > 24);
  };
  addEventListener('scroll', () => {
    if (!ticking) { ticking = true; requestAnimationFrame(update); }
  }, { passive: true });
  update();

  const links = Array.from(header.querySelectorAll<HTMLAnchorElement>('.site-nav a'));
  const targets = links.map((a) => document.querySelector<HTMLElement>(a.hash === '#inicio' ? '#filme' : a.hash)).filter(Boolean) as HTMLElement[];
  if (!('IntersectionObserver' in window)) return;
  const io = new IntersectionObserver((entries) => {
    entries.forEach((e) => {
      if (!e.isIntersecting) return;
      const id = e.target.id === 'filme' ? '#inicio' : `#${e.target.id}`;
      links.forEach((a) => (a.hash === id ? a.setAttribute('aria-current', 'location') : a.removeAttribute('aria-current')));
    });
  }, { rootMargin: '-45% 0px -50% 0px' });
  targets.forEach((t) => io.observe(t));
}
