import { beforeEach, describe, expect, it } from 'vitest';
import { phrasePairs } from '../../src/preferences/copy';
import { productPairs } from '../../src/preferences/catalog-copy';
import { additionalPairs } from '../../src/preferences/extended-copy';
import { getBelleLocale, initBelleI18n, setBelleLocale, translateBelleText } from '../../src/preferences/i18n';
import { initCoutureMenu } from '../../src/shell/couture-menu';
import { DEMO_CATALOG } from '../../src/commerce/catalog.demo';
import { searchProducts } from '../../src/commerce/filters';

const rows=[...phrasePairs,...productPairs,...additionalPairs];
const dictionary=new Map<string,readonly string[]>(rows.map(row=>[row[0],row]));

describe('Belle V39 — internationalization across interactive surfaces',()=>{
 beforeEach(()=>{
  localStorage.clear();
  document.body.innerHTML='<main><h1>O look começa</h1><button aria-label="Escolher loja">Escolher loja</button></main>';
  setBelleLocale('pt');
 });
 it('has nonempty translations in all four positions',()=>{
  for(const row of rows){
   expect(row.length,row[0]).toBe(4);
   expect(row.every(x=>x.trim().length>0),row[0]).toBe(true);
  }
  expect(additionalPairs.length).toBeGreaterThan(115);
 });
 it('translates all animated chapter labels, with the same number of letter layers and no duplicate markers',()=>{
  document.body.innerHTML=
   '<header id="siteHeader"><button id="belleMenuButton" aria-expanded="false">'+
   '<span data-roll>Menu</span><span data-roll>Fechar</span></button></header>'+
   '<div id="belleMenuPanel" inert aria-hidden="true"><nav>'+
   '<a class="couture-nav__link" href="#inicio" data-split>A loja</a>'+
   '<a class="couture-nav__link" href="#passarela" data-split>Passarela</a>'+
   '<a class="couture-nav__link" href="#colecao" data-split>Coleção</a>'+
   '<a class="couture-nav__link" href="#atendimento" data-split>Atendimento</a></nav>'+
   '<a href="#como-comprar" data-split>Como comprar</a>'+
   '<a href="#duvidas" data-split>Dúvidas</a></div><section id="inicio"></section>';
  const source=['A loja','Passarela','Coleção','Atendimento','Como comprar','Dúvidas'];
  initCoutureMenu();
  initBelleI18n();
  const links=Array.from(document.querySelectorAll<HTMLAnchorElement>('[data-split]'));
  for(const locale of ['pt','en','es','it','pt'] as const){
   setBelleLocale(locale);
   const index=({pt:0,en:1,es:2,it:3})[locale];
   expect(links.map(el=>el.getAttribute('aria-label'))).toEqual(source.map(s=>dictionary.get(s)?.[index]));
   for(const el of links){
    expect(el.querySelectorAll('.cn-letters').length).toBe(1);
    const label=el.getAttribute('aria-label')!;
    const characters=[...el.querySelectorAll('.cn-ch__a')].map(x=>x.textContent).join('');
    expect(characters).toBe(label.replace(/\s+/g,''));
   }
   expect(document.querySelectorAll('.couture-nav__marker').length).toBe(4);
   expect(document.getElementById('belleMenuButton')!.getAttribute('aria-label')).toBe(translateBelleText('Abrir menu',locale));
  }
 });
 it('switches PT→EN→ES→IT→PT without forgotten originals or duplicated words',()=>{
  document.body.innerHTML='<h1>A próxima escolha</h1><p>Escolha com calma.</p><input placeholder="Vestidos, bolsas, acessórios…"><button aria-label="Buscar">Buscar</button><p id="concierge">Passe o cursor para revelar o vestido</p>';
  initBelleI18n();
  for(const lang of ['en','es','it','pt'] as const){
   setBelleLocale(lang);
   expect(document.querySelector('h1')!.textContent).toBe(translateBelleText('A próxima escolha',lang));
   expect(document.querySelector('p')!.textContent).toBe(translateBelleText('Escolha com calma.',lang));
   expect(document.querySelector('input')!.getAttribute('placeholder')).toBe(translateBelleText('Vestidos, bolsas, acessórios…',lang));
   expect(document.querySelector('button')!.getAttribute('aria-label')).toBe(translateBelleText('Buscar',lang));
   expect(document.getElementById('concierge')!.textContent).toBe(translateBelleText('Passe o cursor para revelar o vestido',lang));
  }
  expect(getBelleLocale()).toBe('pt');
 });
 it('translates runtime bag, store, runway and count messages',()=>{
  expect(translateBelleText('Enviar para a Belle Araxá','en')).toBe('Send to Belle Araxá');
  expect(translateBelleText('Sua sacola de Catalão está vazia.','es')).toBe('Tu bolsa de Catalão está vacía.');
  expect(translateBelleText('Manter a sacola de Frutal e começar outra','it')).toBe("Mantieni la borsa di Frutal e inizia un'altra");
  expect(translateBelleText('Look 15. Vinho & areia, Cropped + saia + bolsa. Três peças disponíveis para visualizar individualmente.','en')).toContain('Crop top + skirt + bag');
  expect(translateBelleText('1 resultado','it')).toBe('1 risultato');
  expect(translateBelleText('2 resultados','en')).toBe('2 results');
 });
 it('finds real products by localized title or category without changing product IDs',()=>{
  for(const query of ['vestido','dress','dresses','abito','abiti','skirt','faldas','gonne','bag','bolsos','borse','camisa','shirt','ring','anillos','anelli']){
   const matches=searchProducts(DEMO_CATALOG,query);
   expect(matches.length,query).toBeGreaterThan(0);
   expect(matches.every(p=>DEMO_CATALOG.includes(p)),query).toBe(true);
  }
  expect(searchProducts(DEMO_CATALOG,'')).toEqual([]);
  expect(searchProducts(DEMO_CATALOG,'zxyzxyz')).toEqual([]);
 });
});
