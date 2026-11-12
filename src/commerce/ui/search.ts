/**
 * BELLE ALENCAR | V38 BUSCA INTELIGENTE
 * GB Imports discovery layout + familiar fashion e-commerce interactions,
 * with Belle's own type, color, rhythm and authentic demonstrative catalog.
 * No artificial search history, stock, prices, recommendations or extra canvases.
 */
import { h } from '../../core/dom';
import { productImage } from '../media';
import '../media.css';
import { DEMO_CATALOG } from '../catalog.demo';
import { STORE_LIST } from '../stores';
import { searchKey, rankProducts, searchHints, SEARCH_QUICK_TERMS, SEARCH_SUGGESTIONS } from '../search-discovery';
import { CATEGORY_LABEL, SHOP_CATEGORIES, type Product, type StoreId } from '../types';
import { createOverlay } from './overlay';
import { plural } from '../format';
import type { Ctx } from './context';

const NAV = [
  {id:'colecao',label:'Coleção completa',description:'Explore a seleção da Belle',terms:'colecao catalogo compras'},
  {id:'ocasioes',label:'Comprar por ocasião',description:'Dia a dia, noite e celebrações',terms:'ocasiao festa casamento formatura dia noite'},
  {id:'lojas',label:'Lojas Belle',description:'Encontre sua unidade',terms:'lojas enderecos cidades'},
  {id:'atendimento',label:'Atendimento de estilo',description:'Ajuda para escolher',terms:'contato whatsapp consultoria atendimento ajuda tamanho'},
];
const symbol='<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.45" stroke-linecap="round" aria-hidden="true" focusable="false"><circle cx="10.5" cy="10.5" r="6.6"/><path d="m16 16 4.7 4.7"/></svg>';
const recentKey='belle:v38:recentSearches';
const readRecent=():string[]=>{
  try{
    const values=JSON.parse(sessionStorage.getItem(recentKey)||'[]') as unknown;
    return Array.isArray(values)?values.filter(v=>typeof v==='string'&&v.length<=60).slice(0,4):[];
  }catch{return [];}
};
const saveRecent=(term:string)=>{
  const value=term.trim().slice(0,60);
  if(value.length<2)return;
  const next=[value,...readRecent().filter(item=>searchKey(item)!==searchKey(value))].slice(0,4);
  try{sessionStorage.setItem(recentKey,JSON.stringify(next));}catch{/* browsing still works */}
};

export function createSearch(ctx:Ctx) {
  const ov=createOverlay({id:'searchDialog',labelledBy:'searchTitle',variant:'search',className:'ba-search ba-search-v38'});
  ov.panel.querySelector('.ov__close')?.append(h('span',{class:'ba-v38-close-text',text:'FECHAR'}));
  const input=h('input',{
    id:'searchInput',class:'search-input',type:'search',
    placeholder:'O que você procura?',autocomplete:'off',autocapitalize:'off',
    spellcheck:'false',enterkeyhint:'search',
    'aria-label':'Pesquisar peças na Belle','aria-describedby':'searchCount',
    'aria-controls':'searchResults','aria-autocomplete':'list'
  }) as HTMLInputElement;
  const clear=h('button',{type:'button',class:'ba-search-clear','aria-label':'Limpar pesquisa',hidden:true,text:'LIMPAR'});
  const count=h('p',{id:'searchCount',class:'search-count','role':'status','aria-live':'polite',text:'Explore algumas peças'});
  const results=h('div',{id:'searchResults',class:'search-results'});
  const hintList=h('div',{class:'ba-v38-autocomplete',hidden:true,'aria-label':'Sugestões de pesquisa'});
  const recent=h('div',{class:'ba-v38-recent',hidden:true});
  const suggestions=h('section',{class:'ba-v38-suggest','aria-label':'Descubra por categoria'},
    h('div',{class:'ba-v38-heading-row'},
      h('h3',{class:'ba-v38-eyebrow',text:'O QUE VOCÊ QUER ENCONTRAR?'}),
      h('span',{class:'ba-v38-tiny',text:'CURADORIA BELLE · 04 CAMINHOS'})
    ),
    h('div',{class:'ba-v38-suggest-grid'},...SEARCH_SUGGESTIONS.map((s)=>
      h('button',{type:'button',class:'ba-v38-suggest-card','data-search-term':s.term,
        'aria-label':'Pesquisar '+s.label},
        h('span',{class:'ba-v38-suggest-number',text:s.code+' · '+s.eyebrow}),
        h('strong',{text:s.label}),
        h('span',{class:'ba-v38-card-arrow','aria-hidden':'true',text:'↗'})
      )))
  );
  const popular=h('div',{class:'ba-v38-popular'},
    h('span',{class:'ba-v38-popular-label',text:'BUSCAS RÁPIDAS'}),
    h('div',{class:'ba-v38-chips'},...SEARCH_QUICK_TERMS.map(term=>
      h('button',{type:'button','data-search-term':term,class:'ba-v38-chip',text:term})))
  );
  const summary=h('div',{class:'ba-v38-summary'},count,
    h('button',{type:'button',class:'ba-search-go-collection','data-hit-anchor':'colecao',text:'VER COLEÇÃO COMPLETA ↗'}));
  const more=h('button',{type:'button',class:'ba-v38-more',hidden:true,text:'MOSTRAR MAIS PEÇAS +'});
  ov.body.append(
    h('div',{class:'ba-v38-top'},
      h('h2',{id:'searchTitle',class:'ba-v38-top-title',text:'BUSCAR PEÇAS NA BELLE'}),
      h('span',{class:'ba-v38-top-tag',text:'SELEÇÃO · MODA & ACESSÓRIOS'})
    ),
    h('div',{class:'ba-v38-searchbar'},
      h('label',{class:'sr-only',for:'searchInput',text:'O que você procura?'}),
      h('span',{class:'ba-v38-magnifier','aria-hidden':'true',html:symbol}),
      input,clear,
      h('span',{class:'ba-v38-shortcut','aria-hidden':'true',text:'CTRL K'})
    ),
    hintList,recent,suggestions,popular,summary,results,more,
    h('p',{class:'ba-v38-fineprint',text:'Prévia demonstrativa: peças, imagens e combinações são estudos visuais. Valores, tamanhos e estoque devem ser confirmados com a loja.'})
  );

  let shown=12;
  let lastQuery='';
  let productsFound:Product[]=[];
  function group(label:string,items:HTMLElement[],kind:string):HTMLElement|null {
    if(!items.length)return null;
    return h('section',{class:'search-group search-group--'+kind},
      h('h3',{class:'ba-v38-group-title',text:label}),
      h('ul',{},...items.map(button=>h('li',{},button))));
  }
  const productButton=(p:Product)=>
    h('button',{
      class:'search-hit search-hit--product',type:'button',
      'data-hit-product':p.id,'aria-label':'Ver detalhes de '+p.title
    },
      h('span',{class:'ba-search-product-image'},productImage(p,{alt:''})),
      h('span',{class:'ba-search-product-description'},
        h('small',{class:'ba-search-product-category',text:CATEGORY_LABEL[p.category]}),
        h('strong',{class:'ba-search-product-title',text:p.title}),
        h('small',{class:'ba-search-product-note',text:'Peça demonstrativa · ver detalhes'})
      ),
      h('span',{class:'ba-v38-hit-arrow','aria-hidden':'true',text:'↗'})
    );

  function renderRecent(){
    const terms=readRecent();
    recent.hidden=!terms.length||Boolean(searchKey(input.value));
    if(!recent.hidden)recent.replaceChildren(
      h('span',{class:'ba-v38-popular-label',text:'SUAS ÚLTIMAS BUSCAS'}),
      ...terms.map(term=>h('button',{type:'button',class:'ba-v38-recent-chip','data-search-term':term,text:term}))
    );
  }
  function render(){
    const q=searchKey(input.value);
    if(q!==lastQuery){lastQuery=q;shown=12;}
    const active=Boolean(q);
    const prods=active?rankProducts(DEMO_CATALOG,input.value):
      SHOP_CATEGORIES.map(category=>DEMO_CATALOG.find(p=>p.active&&p.category===category))
        .filter((p):p is Product=>!!p);
    productsFound=prods;
    const stores=active?STORE_LIST.filter(s=>searchKey(s.city+' '+s.state).includes(q)):[];
    const links=active?NAV.filter(item=>
      searchKey(item.label+' '+item.description+' '+item.terms).includes(q)&&document.getElementById(item.id)):[];
    const groups=[
      group(active?'PEÇAS ENCONTRADAS':'PEÇAS PARA COMEÇAR',
        prods.slice(0,active?shown:8).map(productButton),'products'),
      group('ENCONTRE SUA LOJA',stores.map(store=>h('button',{
          type:'button',class:'search-hit search-hit--store','data-hit-store':store.id
        },h('span',{text:'Belle '+store.city}),
          h('small',{text:store.address||store.state+' · endereço a confirmar'}))),'stores'),
      group('EXPLORE NA BELLE',links.map(item=>h('button',{
          type:'button',class:'search-hit search-hit--chapter','data-hit-anchor':item.id
        },h('span',{text:item.label}),h('small',{text:item.description}))),'chapters')
    ].filter((g):g is HTMLElement=>g!==null);
    const total=prods.length+stores.length+links.length;
    if(active&&!total){
      results.replaceChildren(h('div',{class:'ba-search-empty'},
        h('h3',{text:'Nenhuma peça encontrada.'}),
        h('p',{text:'Tente outra categoria, cor ou ocasião. Também vale procurar pela cidade da sua loja.'}),
        h('button',{type:'button','data-search-term':'vestidos',class:'ba-v38-empty-cta',text:'EXPLORAR VESTIDOS ↗'})
      ));
    }else results.replaceChildren(...groups);
    count.textContent=active?plural(total,'resultado encontrado','resultados encontrados'):
      'SELEÇÃO INICIAL · '+DEMO_CATALOG.length+' PEÇAS NO ESTUDO';
    suggestions.hidden=active;
    popular.hidden=active;
    clear.hidden=!active;
    more.hidden=!active||prods.length<=shown;
    if(!more.hidden)more.textContent='VER MAIS '+Math.min(12,prods.length-shown)+' PEÇAS  +';

    const hints=active?searchHints(input.value,DEMO_CATALOG,5):[];
    hintList.hidden=!hints.length;
    if(hints.length)hintList.replaceChildren(
      h('span',{class:'ba-v38-popular-label',text:'SUGESTÕES'}),
      ...hints.map(term=>h('button',{class:'ba-v38-hint',type:'button','data-search-term':term,text:term}))
    );
    else hintList.replaceChildren();
    renderRecent();
  }

  function applyTerm(term:string){
    input.value=term;
    render();
    input.focus({preventScroll:true});
    input.setSelectionRange?.(input.value.length,input.value.length);
  }
  input.addEventListener('input',render);
  input.addEventListener('search',render);
  clear.addEventListener('click',()=>applyTerm(''));
  more.addEventListener('click',()=>{
    shown+=12;render();
  });
  ov.body.addEventListener('click',e=>{
    const btn=(e.target as Element).closest<HTMLButtonElement>('button');
    if(!btn)return;
    const term=btn.dataset.searchTerm;
    if(term){saveRecent(term);applyTerm(term);return;}
    const origin=document.getElementById('searchButton');
    if(btn.dataset.hitProduct){
      saveRecent(input.value);
      ctx.openQuickView(btn.dataset.hitProduct,origin);
    }else if(btn.dataset.hitStore){
      saveRecent(input.value);
      ov.close({restoreFocus:false});
      void ctx.chooseStore(btn.dataset.hitStore as StoreId,origin);
    }else if(btn.dataset.hitAnchor){
      saveRecent(input.value);
      ov.close({restoreFocus:false});
      ctx.scrollTo(btn.dataset.hitAnchor);
    }
  });
  input.addEventListener('keydown',e=>{
    if(e.key==='ArrowDown'){
      const first=results.querySelector<HTMLButtonElement>('.search-hit,.ba-v38-empty-cta');
      if(first){e.preventDefault();first.focus({preventScroll:true});}
    }else if(e.key==='Enter'&&input.value.trim()){
      e.preventDefault();
      const first=results.querySelector<HTMLButtonElement>('.search-hit');
      if(first){saveRecent(input.value);first.click();}
      else if(productsFound.length){saveRecent(input.value);ctx.openQuickView(productsFound[0]!.id,document.getElementById('searchButton'));}
    }
  });
  results.addEventListener('keydown',e=>{
    if(e.key!=='ArrowDown'&&e.key!=='ArrowUp')return;
    const buttons=Array.from(results.querySelectorAll<HTMLButtonElement>('.search-hit'));
    const current=buttons.indexOf(document.activeElement as HTMLButtonElement);
    if(current===-1)return;
    e.preventDefault();
    const next=current+(e.key==='ArrowDown'?1:-1);
    if(next<0)input.focus({preventScroll:true});
    else buttons[Math.min(next,buttons.length-1)]?.focus({preventScroll:true});
  });
  document.addEventListener('keydown',e=>{
    if(e.defaultPrevented ||e.altKey)return;
    const el=e.target as HTMLElement|null;
    const typing=Boolean(el?.closest('input,textarea,select,[contenteditable="true"]'));
    if(((e.ctrlKey||e.metaKey)&&e.key.toLowerCase()==='k')||(!typing&&!e.ctrlKey&&!e.metaKey&&e.key==='/')){
      e.preventDefault();
      if(!ov.isOpen())open(document.getElementById('searchButton'));
      else input.focus({preventScroll:true});
    }
  });

  function open(trigger?:HTMLElement|null){
    render();
    ov.open(trigger,{focus:input});
    // Landing scene animations must not repaint the search layer.
    ov.panel.scrollTop=0;
  }
  return {open};
}
