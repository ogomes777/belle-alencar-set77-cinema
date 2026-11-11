/**
 * BELLE ALENCAR · boot.
 * Ordem: estilos → monogramas → intro → shell → comércio → filme (3D lazy).
 * Tudo que é crítico para compra funciona antes e independente do WebGL.
 */
import './styles/base.css';
import './styles/shell.css';
import './styles/film.css';
import './styles/luxe-glass.css';
import { mountMonograms } from './shell/monogram';
import { initIntro } from './shell/intro';
import { initHeader } from './shell/header';
import { initDirector } from './shell/director';
import { initCommerce } from './commerce';
import { initFilm } from './film';
import { initSections } from './sections';
import { initMotionDirector } from './motion/director';


mountMonograms();
initIntro(); // Run before costly commerce and canvas modules.
initHeader();
initCommerce();
initSections();
initMotionDirector();
const director = initDirector();
// Load the editorial 3D carousel only as its section approaches the viewport.
// GSAP/ScrollTrigger stay out of the initial hero's critical JavaScript path.
const occasionSection = document.getElementById('ocasioes');
const bootOccasionCarousel = () => {
  void import('./occasions/carousel').then(({ initOccasionsCarousel }) => {
    initOccasionsCarousel(director);
  }).catch(() => {
    // Graceful degradation: the three original commercial cards are readable
    // and their filters work even if the enhancement bundle cannot load.
  });
};
if (occasionSection && !matchMedia('(prefers-reduced-motion: reduce)').matches) {
  if ('IntersectionObserver' in window) {
    const prewarm = new IntersectionObserver((entries) => {
      if (!entries.some(entry => entry.isIntersecting)) return;
      prewarm.disconnect();
      bootOccasionCarousel();
    }, { rootMargin: '620px 0px' });
    prewarm.observe(occasionSection);
  } else {
    bootOccasionCarousel();
  }
}
initFilm(director);
