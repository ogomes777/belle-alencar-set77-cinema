import { DEMO_CATALOG } from '../../src/commerce/catalog.demo';
// Integração DOM: initCommerce sobre o index.html real (jsdom).
import { beforeAll, describe, expect, it, vi } from 'vitest';
import indexHtml from '../../index.html?raw';

const flush = () => new Promise((r) => setTimeout(r, 0));

beforeAll(async () => {
  const html = indexHtml;
  const body = html.slice(html.indexOf('<body>') + 6, html.indexOf('</body>'));
  document.body.innerHTML = body;
  localStorage.clear();
  history.replaceState(null, '', '/?cidade=frutal');
  window.matchMedia = vi.fn().mockImplementation((q: string) => ({
    matches: q.includes('reduce'), media: q, addEventListener() {}, removeEventListener() {},
  })) as unknown as typeof window.matchMedia;
  Element.prototype.scrollIntoView = vi.fn();
  window.open = vi.fn() as unknown as typeof window.open;
  const { initCommerce } = await import('../../src/commerce');
  initCommerce();
  await flush();
});

describe('initCommerce (DOM)', () => {
  it('renderiza um card por peça demonstrativa, com selo e sem preço', () => {
    const cards = document.querySelectorAll('#catalogMount .pcard');
    expect(cards).toHaveLength(8);
    expect(document.querySelector('.pcard .badge')?.textContent).toMatch(/Packshot sintético/);
    expect(document.querySelector('.pcard__price')?.textContent).toBe('Preço sob consulta');
    expect(document.querySelector('#catalogMount noscript')).not.toBeNull();
  });

  it('prévia mostra oito peças e VER TUDO expande todas, com reversão acessível', () => {
    const cards = () => document.querySelectorAll('#catalogMount .pcard');
    const button = document.querySelector<HTMLButtonElement>('#catalogMount [data-catalog-toggle]')!;
    const area = document.querySelector<HTMLElement>('#catalogMount .catalog-more')!;
    expect(area.hidden).toBe(false);
    expect(cards()).toHaveLength(8);
    expect(button.textContent).toContain('VER TUDO');
    expect(button.getAttribute('aria-expanded')).toBe('false');
    expect(button.getAttribute('aria-controls')).toBe('catalogGrid');
    const first = cards()[0];
    button.click();
    expect(cards()).toHaveLength(DEMO_CATALOG.length);
    expect(cards()[0]).toBe(first); // no remount of selected favorites/quick view
    expect(button.textContent).toContain('VER MENOS');
    expect(button.getAttribute('aria-expanded')).toBe('true');
    button.click();
    expect(cards()).toHaveLength(8);
    expect(cards()[0]).toBe(first);
    expect(button.textContent).toContain('VER TUDO');
    expect(button.getAttribute('aria-expanded')).toBe('false');
  });

  it('ocasião aplica a prévia aos resultados filtrados e expande sem perder filtros', () => {
    const noite = DEMO_CATALOG.filter(p => p.active && p.occasion === 'noite');
    (document.querySelector('#catalogMount [data-occ="noite"]') as HTMLElement).click();
    expect(document.querySelectorAll('#catalogMount .pcard')).toHaveLength(Math.min(8, noite.length));
    const more = document.querySelector<HTMLButtonElement>('#catalogMount [data-catalog-toggle]')!;
    expect((document.querySelector<HTMLElement>('#catalogMount .catalog-more'))!.hidden).toBe(noite.length <= 8);
    if (noite.length > 8) {
      more.click();
      expect(document.querySelectorAll('#catalogMount .pcard')).toHaveLength(noite.length);
    }
    expect(document.querySelector('#catalogMount [data-occ="noite"]')?.getAttribute('aria-pressed')).toBe('true');
    (document.querySelector('#catalogMount [data-occ="todas"]') as HTMLElement).click();
    expect(document.querySelectorAll('#catalogMount .pcard')).toHaveLength(8);
    expect(more.getAttribute('aria-expanded')).toBe('false');
  });

  it('?cidade= legado define a loja sem abrir diálogo e reescreve para ?loja=', () => {
    expect(document.querySelector('[data-store-label]')?.textContent).toBe('Frutal');
    expect(document.getElementById('storeDialog')?.hidden).toBe(true);
    expect(document.querySelector('[data-store-card="frutal"]')?.classList.contains('is-active')).toBe(true);
  });

  it('filtro de categoria do filme filtra e rola até a coleção', () => {
    (document.querySelector('[data-filter-category="bolsas"]') as HTMLElement).click();
    expect(document.querySelectorAll('#catalogMount .pcard')).toHaveLength(6);
    expect(location.search).toContain('categoria=bolsas');
    (document.querySelector('[data-clear]') as HTMLElement).click();
    expect(document.querySelectorAll('#catalogMount .pcard')).toHaveLength(8);
  });

  it('quick view: exige tamanho, adiciona à sacola de Frutal e atualiza o contador', async () => {
    // Deep-catalog garments are available after user chooses to see all.
    (document.querySelector('#catalogMount [data-catalog-toggle]') as HTMLElement).click();
    const title = document.querySelector('.pcard[data-product="belle-demo-vestidos-01"] .pcard__title button') as HTMLElement;
    title.click();
    await flush();
    const qv = document.getElementById('quickView')!;
    expect(qv.hidden).toBe(false);
    expect(qv.querySelector('.ov__panel')?.getAttribute('aria-modal')).toBe('true');
    expect(location.search).toContain('peca=vestidos-01');
    (qv.querySelector('[data-add]') as HTMLElement).click();
    expect((qv.querySelector('.qv__error') as HTMLElement).hidden).toBe(false);
    const m = qv.querySelector('input[value="M"]') as HTMLInputElement;
    m.checked = true;
    m.dispatchEvent(new Event('change', { bubbles: true }));
    expect(qv.querySelector('[data-avail]')?.textContent).toContain('consultar a loja de Frutal');
    (qv.querySelector('[data-add]') as HTMLElement).click();
    const count = document.querySelector('[data-bag-count]') as HTMLElement;
    expect(count.hidden).toBe(false);
    expect(count.textContent).toBe('1');
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
    expect(qv.classList.contains('is-open')).toBe(false);
  });

  it('trocar para Araxá com sacola pede decisão; "manter" preserva a sacola de Frutal', async () => {
    (document.querySelector('[data-select-store="araxa"]') as HTMLElement).click();
    await flush();
    const sw = document.getElementById('storeSwitchDialog')!;
    expect(sw.hidden).toBe(false);
    expect(document.querySelector('[data-store-label]')?.textContent).toBe('Frutal');
    (sw.querySelector('[data-switch="keep"]') as HTMLElement).click();
    await flush();
    await flush();
    expect(document.querySelector('[data-store-label]')?.textContent).toBe('Araxá');
    expect((document.querySelector('[data-bag-count]') as HTMLElement).hidden).toBe(true);
    const saved = JSON.parse(localStorage.getItem('belle:v4:bags')!);
    expect(saved.frutal).toHaveLength(1);
    expect(location.search).toContain('loja=araxa');
  });

  it('sacola vazia de Araxá aponta a sacola salva em Frutal; envio abre o canal oficial', async () => {
    (document.getElementById('bagButton') as HTMLElement).click();
    const bag = document.getElementById('bagDrawer')!;
    expect(bag.textContent).toContain('sacola de Araxá está vazia');
    expect(bag.textContent).toContain('Frutal');
    (bag.querySelector('[data-goto-store="frutal"]') as HTMLElement).click();
    await flush();
    (document.querySelector('#storeSwitchDialog [data-switch]') as HTMLElement | null); // sem sacola em Araxá: troca direta
    await flush();
    expect(document.querySelector('[data-store-label]')?.textContent).toBe('Frutal');
    (document.getElementById('bagButton') as HTMLElement).click();
    const send = document.querySelector('#bagDrawer [data-send]') as HTMLElement;
    expect(send.textContent).toBe('Enviar para a Belle Frutal');
    expect((document.querySelector('#bagDrawer .btn[disabled]') as HTMLElement).textContent).toBe('Checkout online');
    send.click();
    expect(window.open).toHaveBeenCalledWith('https://wa.me/message/YYDB5NC7JMUQP1', '_blank', 'noopener,noreferrer');
    const area = document.querySelector('#bagDrawer .send-msg') as HTMLTextAreaElement;
    expect(area.value).toContain('Belle Frutal');
    expect(area.value).toContain('DEMO-VESTIDOS-01');
  });

  it('favoritos atualizam contador e persistem', () => {
    // Rings are below the curated preview, but their original actions remain.
    (document.querySelector('#catalogMount [data-catalog-toggle]') as HTMLElement).click();
    (document.querySelector('[data-wish="belle-demo-aneis-02"]') as HTMLElement).click();
    const c = document.querySelector('[data-wishlist-count]') as HTMLElement;
    expect(c.hidden).toBe(false);
    expect(c.textContent).toBe('1');
    expect(JSON.parse(localStorage.getItem('belle:v4:wishlist')!)).toEqual(['belle-demo-aneis-02']);
  });

  it('busca encontra peça e loja', () => {
    (document.getElementById('searchButton') as HTMLElement).click();
    const input = document.getElementById('searchInput') as HTMLInputElement;
    input.value = 'bolsa';
    input.dispatchEvent(new Event('input'));
    expect(document.querySelector('[data-hit-product="belle-demo-bolsas-01"]')).not.toBeNull();
    input.value = 'catalao';
    input.dispatchEvent(new Event('input'));
    expect(document.querySelector('[data-hit-store="catalao"]')).not.toBeNull();
  });
});
