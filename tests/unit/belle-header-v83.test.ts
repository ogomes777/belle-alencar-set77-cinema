/// <reference types="vite/client" />
import { describe, it, expect } from 'vitest';
import html from '../../index.html?raw';
import menu from '../../src/shell/couture-menu.ts?raw';
import commerce from '../../src/commerce/ui/header.ts?raw';
import settings from '../../src/preferences/settings.ts?raw';
import main from '../../src/main.ts?raw';

describe('Belle V83 · clean header and accessible commerce navigation',()=>{
  const header=html.slice(html.indexOf('<header class="site-header"'),html.indexOf('</header>')+9);
  const nav=html.slice(html.indexOf('<div class="couture-nav"'),html.indexOf('</div>',html.indexOf('<div class="couture-nav"'))+7);

  it('keeps the three primary actions and inline preferences in the header',()=>{
    expect(header).toContain('id="searchButton"');
    expect(header).toContain('id="belleMenuButton"');
    expect(header).toContain('id="storeButton"');
    expect(header).toContain('class="couture-toggle__diamond"');
    expect(header).not.toContain('class="couture-toggle__pill"');
    expect([...header.matchAll(/data-theme-option="([^"]+)"/g)].map(match=>match[1])).toEqual(['rose','light']);
    expect([...header.matchAll(/data-lang-option="([^"]+)"/g)].map(match=>match[1])).toEqual(['pt','en','es','it']);
    expect(header).not.toContain('id="wishlistButton"');
    expect(header).not.toContain('id="bagButton"');
    expect(header).toContain('data-monogram="header"');
    expect(header).toContain('MODA &amp; ACESSÓRIOS');
  });
  it('keeps a single original store-picker trigger with a concise label',()=>{
    expect((html.match(/id="storeButton"/g)??[])).toHaveLength(1);
    expect(header).toContain('id="storeButton" data-open-store');
    expect(header).toContain('data-store-label>Loja</span>');
    expect(html).not.toContain('id="belleLocationDock"');
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
    expect(settings).toContain('setBelleTheme(button.dataset.themeOption');
    expect(settings).toContain('setBelleLocale(button.dataset.langOption');
    expect(html).toContain('data-v54-rotunda');
    expect(html).toContain('data-v79-spin-mount');
    expect(html).toContain('data-monogram="header"');
  });
});
