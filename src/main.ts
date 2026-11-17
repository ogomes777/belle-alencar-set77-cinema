import { initConciergeReveal } from './concierge-reveal';
import { initEditorialBoundaries } from './motion/editorial-boundaries';
import './styles/city-globe.css';
/**
 * BELLE ALENCAR · boot.
 * Ordem: estilos → monogramas → intro → shell → comércio → filme (3D lazy).
 * Tudo que é crítico para compra funciona antes e independente do WebGL.
 */
import './styles/base.css';
import './styles/shell.css';
import './styles/film.css';
import './styles/film-first-frame-v57.css';
import './styles/luxe-glass.css';
import './styles/header-glass.css';
import './styles/search-atelier.css';
import './styles/catalog-couture-v17.css';
import './styles/preferences-v31.css';
import './styles/stores-atelier-v40.css'; // V40: city selection only, globe/scroll unchanged.
import './styles/brand-story-v41.css'; // Only #atendimento narrative, finale service, profile modal.
import './styles/belle-signature-neon-v42.css'; // Only final WhatsApp/Instagram CTAs and story typography.
import './styles/geo-six-v44.css'; // Same canvas globe, six-location hierarchy and maps neon CTA.
import './styles/store-card-visibility-v45.css'; // Fix clipped store buttons and mobile layout, existing globe untouched.
import './styles/couture-glass-collection-v46.css'; // Four post-throw glass cards + collection CTA only; scroll logic untouched.
import './styles/liquid-glass-nav-v47.css'; // Navigation glass, tactile icon buttons and theme overrides.
import './styles/editorial-search-v47.css'; // Full search atelier redesign; semantic live result filters.
import './styles/prismatic-search-v48.css'; // Search-only left-to-right reveal, prismatic type and pill glass.
import './styles/film-optical-glass-v49.css'; // Seven compact optical film captions, warm dark glass and mobile-safe bounds.
import './styles/film-mobile-impact-v50.css'; // Compact mobile cards and one-shot optical impact reveal.
import './styles/editorial-typography-v51.css'; // Full-page five-role editorial typography and accessible theme contrast.
import './styles/contrast-readable-film-v52.css'; // Keep bright how-film readable in dark theme; legible compact film cards.
import { initTypographyCinema } from './motion/editorial-typography-v51';
import { initBelleI18n } from './preferences/i18n';
import { initBelleSettings } from './preferences/settings';
import { mountMonograms } from './shell/monogram';
import { initIntro } from './shell/intro';
import { initHeader } from './shell/header';
import { initCoutureMenu } from './shell/couture-menu';
import { initDirector } from './shell/director';
import { initCommerce } from './commerce';
import { initFilm } from './film';
import { initSections } from './sections';
import { initBelleInstagramDirectory } from './social/instagram-directory';
import { initHowFilm } from './how-film';
import { initStoresChampagne } from './motion/stores-champagne';
import { initPerfGuard } from './core/perf-guard';
import { initBelleOpeningV86 } from './hero/belle-opening-v86';
import './styles/belle-v68-metal-palettes.css'; // V68: final color-only layer; keeps all interactions untouched.
import './styles/belle-v72-couture-ticker.css'; // V72: seamless premium category rail, scoped to the film/passarela separator.
import './styles/belle-v74-editorial-cleanup.css'; // V74: conversion-first mobile readability and restrained ornament.
import './styles/belle-v75-editorial-ribbon.css'; // V75: couture lettering and fine metallic ribbon borders only.
import './styles/belle-v79-originkit-spin.css'; // V79: borderless transparent original Originkit Spin for Belle phones only.
import './styles/belle-v81-phone-flow-preview-title.css'; // V81: immediate native scroll, viewport-safe carousel and luxury Previews serif.
import './styles/belle-v82-preview-calligraphy.css'; // V82: thinner italic preview headline, no clipped S; no video changes.
import './styles/belle-v83-atelier-header.css'; // V83: central Belle logo, floating store selector, commerce inside couture menu.
import './styles/belle-v84-header-breathing.css'; // V84: prevent search from overlapping the centered Belle logo.
import './styles/belle-v85-optin-film.css'; // V85: runway leads, film locked until explicit entry; original scroll film on opt-in.
import './styles/belle-v86-opening.css'; // V86: original banners and pink Cube Roll reveal.
import './styles/belle-v86-loader-signature.css'; // V86: fine calligraphic loader handwriting.
import './styles/belle-v88-navbar-marquee.css'; // V88: solid header + theme-synced outlined straight marquee only.


initPerfGuard(); // V37: adaptive lite mode before any costly module paints.
mountMonograms();
initIntro(); // Run before costly commerce and canvas modules.
initBelleOpeningV86(); // V86 banner autoplay/swipe; 3D wordmark on-demand; no wheel hijack.
initHeader();
initCoutureMenu(); // V38: full-page chapter menu.
initCommerce();
initBelleI18n();
initBelleSettings();
// V57: boot the hero before below-the-fold enhancements and costly DOM
// choreography. Download/compile proceeds while the intro is visible.
const director = initDirector();
initFilm(director);
initTypographyCinema(); // Lightweight scroll-based editorial text reveals, separate from film.
initSections();
initBelleInstagramDirectory(); // Accessible Instagram profile selector; no changes to existing navigation.
initConciergeReveal(); // Codex: local pointer/touch reveal in concierge only.
// V36 CLEAN: no global transition compositor and no second scene director.
// Leave the original 3D film, runway, carousel, video scrub, collections,
// city globe and all their own scroll-based interactions undisturbed.
initStoresChampagne(); // V22: stores-only scroll choreography; globe untouched.
initEditorialBoundaries();
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
// The globe builds a dense connection graph. Keep CPU/GPU headroom for
// the opening film; initialize it only as its section approaches.
const geoSection=document.getElementById('lojas');
if(geoSection){
  let geographyBooted=false;
  const bootGeography=()=>{
    if(geographyBooted)return;
    geographyBooted=true;
    void Promise.all([import('./astral/orbit'),import('./astral/store-map')])
      .then(([orbit,map])=>{orbit.initStoreOrbit();map.initStoreMap();})
      .catch(error=>console.warn('[belle] globe deferred; store links remain available',error));
  };
  if('IntersectionObserver' in window){
    const nearby=new IntersectionObserver(entries=>{
      if(!entries.some(entry=>entry.isIntersecting))return;
      nearby.disconnect();bootGeography();
    },{rootMargin:'1500px 0px'});
    nearby.observe(geoSection);
  }else bootGeography();
}
// V57: the finale's WebGL, extrusion and foil texture cannot compete
// with the first frame of the opening film. Boot near its own section only.
const finaleSection=document.querySelector<HTMLElement>('[data-finale-solid]');
if(finaleSection){
  let finaleStarted=false;
  const bootFinale=()=>{
    if(finaleStarted)return;finaleStarted=true;
    void import('./finale/ba-solid').then(({initFinaleSolid})=>initFinaleSolid()).catch(()=>{
      // The existing static brand foil remains visible when WebGL is unavailable.
    });
  };
  if('IntersectionObserver' in window){
    const finaleProximity=new IntersectionObserver(entries=>{
      if(!entries.some(entry=>entry.isIntersecting))return;
      finaleProximity.disconnect();bootFinale();
    },{rootMargin:'1200px 0px'});
    finaleProximity.observe(finaleSection);
  }else bootFinale();
}
