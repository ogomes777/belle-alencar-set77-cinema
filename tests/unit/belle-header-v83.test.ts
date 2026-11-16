/// <reference types="vite/client" />
import { describe, it, expect } from 'vitest';
import html from '../../index.html?raw';
import css from '../../src/styles/belle-v83-atelier-header.css?raw';
import menu from '../../src/shell/couture-menu.ts?raw';
import commerce from '../../src/commerce/ui/header.ts?raw';
import settings from '../../src/preferences/settings.ts?raw';
import main from '../../src/main.ts?raw';

describe('Belle V83 · clean header and accessible commerce navigation',()=>{
  const header=html.slice(html.indexOf('<header class="site-header"'),html.indexOf('</header>')+9);
  const dock=html.slice(html.indexOf('<aside class="belle-location-dock"'),html.indexOf('</aside>')+8);
  const nav=html.slice(html.indexOf('<div class="couture-nav"'),html.indexOf('</div>',html.indexOf('<div class="couture-nav"'))+7);

  it('keeps exactly three essential header controls including dynamic settings',()=>{
    expect(header).toContain('id="searchButton"');
    expect(header).toContain('id="belleMenuButton"');
    expect(settings).toContain("trigger.id='belleSettingsButton'");
    expect(header).not.toContain('id="storeButton"');
    expect(header).not.toContain('id="wishlistButton"');
    expect(header).not.toContain('id="bagButton"');
    expect(header).toContain('data-monogram="header"');
    expect(header).toContain('MODA &amp; ACESSÓRIOS');
  });
  it('keeps one functional and persistent location picker outside the header capsule',()=>{
    expect((html.match(/id="storeButton"/g)??[])).toHaveLength(1);
    expect(dock).toContain('id="storeButton"');
    expect(dock).toContain('data-open-store');
    expect(dock).toContain('data-store-label');
    expect(html.indexOf('belleLocationDock')).toBeLessThan(html.indexOf('id="siteHeader"'));
    expect(css).toContain('position:fixed');
    expect(css).toContain('html.couture-nav-open body #belleLocationDock');
  });
  it('moves favorites and bag without duplicating commerce IDs or counters',()=>{
    for(const id of ['wishlistButton','bagButton']){
      expect((html.match(new RegExp('id="'+id+'"','g'))??[])).toHaveLength(1);
      expect(nav).toContain('id="'+id+'"');
      expect(header).not.toContain('id="'+id+'"');
    }
    expect(nav).toContain('data-wishlist-count');
    expect(nav).toContain('data-bag-count');
    expect(menu).toContain("'a[href],button:not([disabled])'");
    expect(menu).toContain('setOpen(false, false, true)');
    expect(commerce).toContain("document.getElementById('belleMenuButton')");
  });
  it('centers brand and retains responsive themes and a full 44px touch target',()=>{
    expect(css).toContain('transform:translate(-50%,-50%)!important');
    expect(css).toContain('width:min(680px,calc(100% - 24px))!important');
    expect(css).toContain('data-belle-theme="dark"');
    expect(css).toContain('data-belle-theme="rose"');
    expect(css).toContain('@media(max-width:375px)');
    expect(css).toContain('min-height:44px');
    expect(main).toContain('belle-v83-atelier-header.css');
  });
});
