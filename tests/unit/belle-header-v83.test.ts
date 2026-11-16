/// <reference types="vite/client" />
import { describe, it, expect } from 'vitest';
import html from '../../index.html?raw';
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
    expect(dock).toContain('class="belle-location-dock"');
    expect(main).toContain("import './styles/belle-v83-atelier-header.css'");
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
  it('loads the new header as the final style layer and preserves settings and original cinema',()=>{
    expect(main).toContain('belle-v83-atelier-header.css');
    expect(main.indexOf('belle-v83-atelier-header.css')).toBeGreaterThan(main.indexOf('belle-v82-preview-calligraphy.css'));
    expect(settings).toContain("actions.insertBefore(trigger,menu)");
    expect(html).toContain('data-v54-rotunda');
    expect(html).toContain('data-v79-spin-mount');
    expect(html).toContain('data-monogram="header"');
  });
});
