import { initStoreMap } from './astral/store-map';
import './styles/city-globe.css';
import { initStoreOrbit } from './astral/orbit';
/**
 * BELLE ALENCAR · boot.
 * Ordem: estilos → monogramas → intro → shell → comércio → filme (3D lazy).
 * Tudo que é crítico para compra funciona antes e independente do WebGL.
 */
import './styles/base.css';
import './styles/shell.css';
import './styles/film.css';
import './styles/luxe-glass.css';
import './styles/header-glass.css';
import './styles/search-atelier.css';
import './styles/catalog-couture-v17.css';
import './styles/preferences-v31.css';
import { initBelleI18n } from './preferences/i18n';
import { initBelleSettings } from './preferences/settings';
import { mountMonograms } from './shell/monogram';
import { initIntro } from './shell/intro';
import { initHeader } from './shell/header';
import { initDirector } from './shell/director';
import { initCommerce } from './commerce';
import { initFilm } from './film';
import { initSections } from './sections';
import { initHowFilm } from './how-film';
import { initStoresChampagne } from './motion/stores-champagne';


mountMonograms();
initIntro(); // Run before costly commerce and canvas modules.
initHeader();
initCommerce();
initBelleI18n();
initBelleSettings();
initSections();
// V36 CLEAN: no global transition compositor and no second scene director.
// Leave the original 3D film, runway, carousel, video scrub, collections,
// city globe and all their own scroll-based interactions undisturbed.
initStoresChampagne(); // V22: stores-only scroll choreography; globe untouched.
const director = initDirector();
initHowFilm(director); // Scroll Couture: reversible scroll-synced editorial video.
// A coleção contém peças renderizadas dinamicamente. O módulo de movimento
// só carrega quando o catálogo se aproxima, evitando custo no hero e na
// passarela. Sem GSAP, o catálogo continua funcional e totalmente visível.
const catalogSection = document.getElementById('colecao');
const bootCatalogScroll = () => {
  void import('./commerce/collection-reveal').then(({ initCatalogScrollReveal }) => {
    initCatalogScrollReveal(director);
  }).catch(() => {
    // Graceful degradation: normal CSS grid, filtros e carrinho intactos.
  });
};
if (catalogSection && !matchMedia('(prefers-reduced-motion: reduce)').matches) {
  if ('IntersectionObserver' in window) {
    const catalogPrewarm = new IntersectionObserver((entries) => {
      if (!entries.some(entry => entry.isIntersecting)) return;
      catalogPrewarm.disconnect();
      bootCatalogScroll();
    }, {rootMargin:'1100px 0px'});
    catalogPrewarm.observe(catalogSection);
  } else {
    bootCatalogScroll();
  }
}
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

initStoreOrbit();
initStoreMap();
void import('./finale/ba-solid').then(({initFinaleSolid})=>initFinaleSolid()).catch(()=>{
  // Authenticated BA foil remains visible in fallback, including no WebGL.
});
