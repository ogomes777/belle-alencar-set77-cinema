import {describe,it,expect} from 'vitest';
import {DEMO_CATALOG} from '../../src/commerce/catalog.demo';
import {searchKey,rankProducts,searchHints,SEARCH_SUGGESTIONS,SEARCH_QUICK_TERMS}
  from '../../src/commerce/search-discovery';

describe('Belle V38 search discovery',()=>{
  it('normaliza acentos, separadores e espaços, inclusive cidades',()=>{
    expect(searchKey('  CATÁLÃO  ')).toBe('catalao');
    expect(searchKey('  Vestido--Preto! ')).toBe('vestido preto');
    expect(searchKey('Anéis / Bolsas')).toBe('aneis bolsas');
  });
  it('encontra as oito categorias reais, sem sugestões inventadas',()=>{
    expect(SEARCH_SUGGESTIONS).toHaveLength(4);
    expect(SEARCH_QUICK_TERMS).toHaveLength(8);
    for(const term of SEARCH_QUICK_TERMS){
      const matches=rankProducts(DEMO_CATALOG,term);
      expect(matches.length,term).toBeGreaterThan(0);
      expect(matches.every(p=>p.active)).toBe(true);
    }
  });
  it('busca singular, plural, grafia sem acento e cor',()=>{
    expect(rankProducts(DEMO_CATALOG,'bolsa').length).toBeGreaterThan(0);
    expect(rankProducts(DEMO_CATALOG,'bolsas').length).toBeGreaterThan(0);
    expect(rankProducts(DEMO_CATALOG,'anel').length).toBeGreaterThan(0);
    expect(rankProducts(DEMO_CATALOG,'aneis').length).toBeGreaterThan(0);
    expect(rankProducts(DEMO_CATALOG,'vestido preto').some(p=>searchKey(p.title).includes('preto'))).toBe(true);
  });
  it('usa correspondência de todos os tokens, sem falsos positivos no catálogo',()=>{
    expect(rankProducts(DEMO_CATALOG,'vestido preto').every(p=>p.category==='vestidos')).toBe(true);
    expect(rankProducts(DEMO_CATALOG,'zzzz inexistente')).toEqual([]);
    const matches=rankProducts(DEMO_CATALOG,'bolsa');
    expect(new Set(matches.map(p=>p.id)).size).toBe(matches.length);
  });
  it('oferece termos compatíveis com o catálogo, sem strings artificiais',()=>{
    const hints=searchHints('vest',DEMO_CATALOG);
    expect(hints.length).toBeGreaterThan(0);
    expect(hints.length).toBeLessThanOrEqual(5);
    expect(hints.some(h=>searchKey(h).startsWith('vest'))).toBe(true);
    expect(searchHints('',DEMO_CATALOG)).toEqual([]);
  });
  it('não introduz produto novo ou altera preço/estoque',()=>{
    const originals=new Map(DEMO_CATALOG.map(p=>[p.id,{price:p.price.priceCents,stock:p.inventoryConfirmed}]));
    for(const p of rankProducts(DEMO_CATALOG,'vestido')){
      expect(originals.has(p.id)).toBe(true);
      expect(p.price.priceCents).toBe(originals.get(p.id)?.price);
      expect(p.inventoryConfirmed).toBe(originals.get(p.id)?.stock);
    }
  });
});
