
import {beforeEach,describe,expect,it} from 'vitest';
import {getBelleLocale,setBelleLocale,initBelleI18n} from '../../src/preferences/i18n';
import {setBelleTheme} from '../../src/preferences/settings';
import {phrasePairs} from '../../src/preferences/copy';
import {productPairs} from '../../src/preferences/catalog-copy';

describe('Belle V31 · settings with persistent locale and palette',()=>{
 beforeEach(()=>{
  localStorage.clear();
  document.body.innerHTML='<main><h1 id="headline">A próxima escolha</h1><p id="copy">Escolha com calma.</p><span id="product">Camisa branca de corte estruturado</span><button id="b" aria-label="Escolher loja">Escolher loja</button><span data-i18n-skip id="brand">BELLE ALENCAR</span></main>';
  setBelleLocale('pt');setBelleTheme('light');
 });
 it('includes four distinct locale choices with complete 48-item product dictionaries',()=>{
   expect(phrasePairs.length).toBeGreaterThan(230);
   expect(productPairs).toHaveLength(96); // titles and descriptions
   expect(new Set(productPairs.map(p=>p[0])).size).toBe(96);
 });
 it('translates editorial copy, product names and accessibility labels without DOM remount',()=>{
   const node=document.getElementById('product')!;
   initBelleI18n();
   setBelleLocale('en');
   expect(document.getElementById('headline')?.textContent).toBe('The next choice');
   expect(node.textContent).toBe('Structured white shirt');
   expect(document.getElementById('b')?.getAttribute('aria-label')).toBe('Choose store');
   expect(document.documentElement.lang).toBe('en');
   expect(localStorage.getItem('belle:v31:locale')).toBe('en');
   setBelleLocale('es');
   expect(node.textContent).toBe('Camisa blanca de corte estructurado');
   setBelleLocale('it');
   expect(node.textContent).toBe('Camicia bianca dal taglio strutturato');
   setBelleLocale('pt');
   expect(node.textContent).toBe('Camisa branca de corte estruturado');
   expect(getBelleLocale()).toBe('pt');
   expect(document.getElementById('brand')?.textContent).toBe('BELLE ALENCAR');
 });
 it('changes whole-page root palette and stores it locally',()=>{
   setBelleTheme('dark');
   expect(document.documentElement.dataset.belleTheme).toBe('dark');
   expect(localStorage.getItem('belle:v31:theme')).toBe('dark');
   setBelleTheme('rose');
   expect(document.documentElement.dataset.belleTheme).toBe('rose');
   setBelleTheme('light');
   expect(document.documentElement.dataset.belleTheme).toBe('light');
 });
});
