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
import { initOccasionsCarousel } from './occasions/carousel';

mountMonograms();
initIntro(); // Run before costly commerce and canvas modules.
initHeader();
initCommerce();
initSections();
initMotionDirector();
const director = initDirector();
initOccasionsCarousel(director);
initFilm(director);
