/// <reference types="vite/client" />
import { describe,it,expect } from 'vitest';
import page from '../../index.html?raw';
import slider from '../../src/hero/belle-opening-v86.ts?raw';
import cube from '../../src/components/originkit/CubeRollLetterRole.tsx?raw';
import bridge from '../../src/hero/belle-opening-cube-v86.tsx?raw';
import main from '../../src/main.ts?raw';

describe('Belle V86 · branded first-page campaign',()=>{
  it('puts both original banners above the preserved runway and boutique',()=>{
    const opener=page.indexOf('<section class="v86-opening"');
    const runway=page.indexOf('<section class="runway"');
    const boutique=page.indexOf('<section class="film"');
    expect(opener).toBeGreaterThan(0);
    expect(opener).toBeLessThan(runway);
    expect(runway).toBeLessThan(boutique);
    expect((page.match(/id="inicio"/g)??[])).toHaveLength(1);
    expect(page).toContain('id="v86BannerCarousel"');
    expect(page).toContain('id="v86CubeMount"');
    expect(page).toContain('id="filmEnter"');
  });
  it('shows exactly the two unmodified supplied banners with lighter WebP variants',()=>{
    expect((page.match(/class="v86-opening__slide/g)??[])).toHaveLength(2);
    for(const name of ['vinho','travertino']){
      expect(page).toContain('/media/banner-v86-'+name+'.png');
      expect(page).toContain('/media/banner-v86-'+name+'.webp');
    }
    const figures=page.match(/<figure class="v86-opening__slide[\s\S]*?<\/figure>/g)??[];
    expect(figures).toHaveLength(2);
    for(const figure of figures){
      expect(figure).not.toMatch(/<h[1-6]|<p\b|<figcaption/);
    }
  });
  it('autoplays quickly but keeps native vertical scroll, pointer and keyboard access',()=>{
    expect(slider).toContain('const scheduleMs=4700');
    expect(slider).toContain('touchstart');
    expect(slider).toContain('touchend');
    expect(slider).toContain('ArrowLeft');
    expect(slider).toContain('ArrowRight');
    expect(slider).toContain('event.preventDefault()'); // only keyboard arrows, never wheel/touch
    expect(slider).not.toContain("addEventListener('wheel'");
    expect(slider).toContain('intro-done');
    expect(slider).toContain('prefers-reduced-motion');
  });
  it('uses supplied Originkit 360-degree Cube Roll source in a separate React island',()=>{
    expect(cube).toContain('Cube Roll Letter Role');
    expect(cube).toContain('rotateX: [0, -90 * sign, -180 * sign, -270 * sign, -360 * sign]');
    expect(cube).toContain('repeat: Infinity');
    expect(cube).toContain('const __originkitPresetProps');
    expect(bridge).toContain("CubeRollLetterRole");
    expect(bridge).toContain('tag="h2"');
    expect(main).toContain("initBelleOpeningV86()");
  });
  it('keeps original skip/timing but refines handwriting with script calligraphy',()=>{
    // Vitest CSS raw imports are empty in jsdom: verify final CSS in built assets.
    expect(main).toContain("import './styles/belle-v86-loader-signature.css'");
    expect(page).toContain('class="intro__signature-ink"');
    expect(page).toContain('class="intro__flourish-main"');
    expect(page).toContain('id="introSkip"');
    expect(page).toContain('id="intro"');
    expect(main).toContain('belle-v86-loader-signature.css');
  });
});
