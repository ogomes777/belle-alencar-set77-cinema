
/** Belle V31 · instant local translations with zero network calls.
 * Works with existing DOM and commerce mutations; original pt-BR kept in memory.
 */
import { phrasePairs } from './copy';
import { productPairs } from './catalog-copy';
export type BelleLocale='pt'|'en'|'es'|'it';
const languages: BelleLocale[]=['pt','en','es','it'];
const dictionary:Record<'en'|'es'|'it',Record<string,string>>={en:{},es:{},it:{}};
for(const [pt,en,es,it] of [...phrasePairs,...productPairs]){
 dictionary.en[pt.trim()]=en;dictionary.es[pt.trim()]=es;dictionary.it[pt.trim()]=it;
}
const storeKey='belle:v31:locale';
function readLocale():BelleLocale{
 try{const value=localStorage.getItem(storeKey);return languages.includes(value as BelleLocale)?value as BelleLocale:'pt';}
 catch{return 'pt';}
}
let locale:BelleLocale=readLocale();
type Original={base:string;last:string};
const textOrigins=new WeakMap<Text,Original>();
const attrOrigins=new WeakMap<Element,Map<string,Original>>();
const skip='[data-i18n-skip],script,style,noscript,textarea,svg,canvas,code,pre,[contenteditable="true"]';
const attributes=['aria-label','title','alt','placeholder'] as const;
let observer:MutationObserver|null=null;
const pending=new Set<Node>();
let frame=0;
const titles:Record<BelleLocale,string>={
 pt:'Belle Alencar | Moda & Acessórios',en:'Belle Alencar | Fashion & Accessories',
 es:'Belle Alencar | Moda y Accesorios',it:'Belle Alencar | Moda e Accessori',
};
const words:Record<Exclude<BelleLocale,'pt'>,Record<string,string>>={
 en:{peça:'item',peças:'items',favoritos:'favorites',Favoritos:'Favorites',loja:'store',Loja:'Store',sacola:'bag',Sacola:'Bag',tamanho:'size',Tamanho:'Size',escolher:'choose',Ver:'View',detalhes:'details',adicionar:'add','na prévia':'in the preview','com estes filtros':'matching your filters','exibidas':'displayed','exibida':'displayed','da seleção':'from the selection',mais:'more',Explore:'Discover','página':'page'},
 es:{peça:'prenda',peças:'prendas',favoritos:'favoritos',Favoritos:'Favoritos',loja:'tienda',Loja:'Tienda',sacola:'bolsa',Sacola:'Bolsa',tamanho:'talla',Tamanho:'Talla',escolher:'elegir',Ver:'Ver',detalhes:'detalles',adicionar:'añadir','na prévia':'en la vista previa','com estes filtros':'con estos filtros','exibidas':'mostradas','exibida':'mostrada','da seleção':'de la selección',mais:'más',Explore:'Descubre','página':'página'},
 it:{peça:'articolo',peças:'articoli',favoritos:'preferiti',Favoritos:'Preferiti',loja:'negozio',Loja:'Negozio',sacola:'borsa',Sacola:'Borsa',tamanho:'taglia',Tamanho:'Taglia',escolher:'scegli',Ver:'Vedi',detalhes:'dettagli',adicionar:'aggiungi','na prévia':'in anteprima','com estes filtros':'con questi filtri','exibidas':'visualizzati','exibida':'visualizzato','da seleção':'della selezione',mais:'altri',Explore:'Scopri','página':'pagina'}
};
function computedText(source:string,to:Exclude<BelleLocale,'pt'>):string{
 const w=words[to];
 const number=source.match(/^(\d+)\s+(peças?|itens)\s+(.+)$/i);
 if(number){
  const noun=number[1]==='1'?'peça':'peças';
  const tail=number[3]!;
  const targetTail=w[tail]||tail;
  return number[1]+' '+w[noun]+' '+targetTail;
 }
 const explore=source.match(/^Explore mais (\d+) (peças?) da seleção$/);
 if(explore)return w.Explore+' '+explore[1]+' '+w[explore[2]!]+' '+w['da seleção'];
 const fav=source.match(/^Favoritar (.+)$/);
 if(fav)return ({en:'Save ',es:'Guardar ',it:'Aggiungi ai preferiti '}[to])+translate(fav[1]!,to);
 const label=source.match(/^Loja selecionada: (.+)\. Trocar loja$/);
 if(label)return ({en:'Selected store: ',es:'Tienda elegida: ',it:'Negozio selezionato: '}[to])+label[1]+({en:'. Change store',es:'. Cambiar tienda',it:'. Cambia negozio'}[to]);
 const bag=source.match(/^Sacola de interesse(?: de (.+?))?, (\d+) (peças?)$/);
 if(bag)return ({en:'Wishlist bag',es:'Bolsa de interés',it:'Borsa dei preferiti'}[to])+(bag[1]?' · '+bag[1]:'')+', '+bag[2]+' '+w[bag[3]!];
 const wish=source.match(/^Favoritos, (\d+) (peças?)$/);
 if(wish)return w.Favoritos+', '+wish[1]+' '+w[wish[2]!];
 return source;
}
function translate(text:string,to:Exclude<BelleLocale,'pt'>):string{
 const direct=dictionary[to][text]??computedText(text,to);
 if(direct!==text)return direct;
 // Composite labels are assembled from translated category, occasion and
 // live stock values without reconstructing checkout or product state.
 if(text.includes(' · '))return text.split(' · ').map(part=>translate(part,to)).join(' · ');
 return text;
}
function translateText(node:Text){
 const parent=node.parentElement;
 if(!parent||parent.closest(skip))return;
 const now=node.data;
 if(!now.trim())return;
 let state=textOrigins.get(node);
 if(!state||now!==state.last&&now!==state.base){state={base:now,last:now};textOrigins.set(node,state);}
 const lead=state.base.match(/^\s*/)?.[0]??'';
 const trail=state.base.match(/\s*$/)?.[0]??'';
 const src=state.base.trim();
 const result=locale==='pt'?src:translate(src,locale);
 const next=lead+result+trail;
 state.last=next;
 if(next!==now)node.data=next;
}
function translateAttributes(el:Element){
 if(el.matches(skip)||el.closest('[data-i18n-skip]'))return;
 let map=attrOrigins.get(el);
 if(!map){map=new Map();attrOrigins.set(el,map);}
 for(const attr of attributes){
  const now=el.getAttribute(attr);
  if(now===null||!now.trim())continue;
  let state=map.get(attr);
  if(!state||now!==state.last&&now!==state.base){state={base:now,last:now};map.set(attr,state);}
  const next=locale==='pt'?state.base:translate(state.base,locale);
  state.last=next;
  if(next!==now)el.setAttribute(attr,next);
 }
}
function translateTree(root:Node){
 if(root.nodeType===Node.TEXT_NODE){translateText(root as Text);return;}
 if(root.nodeType!==Node.ELEMENT_NODE)return;
 const el=root as Element;
 if(el.matches(skip))return;
 translateAttributes(el);
 const walker=document.createTreeWalker(el,NodeFilter.SHOW_ELEMENT|NodeFilter.SHOW_TEXT);
 let n:Node|null;
 while((n=walker.nextNode())){
  if(n.nodeType===Node.TEXT_NODE)translateText(n as Text);
  else if(n.nodeType===Node.ELEMENT_NODE)translateAttributes(n as Element);
 }
}
function schedule(node:Node){
 pending.add(node);
 if(frame)return;
 frame=requestAnimationFrame(()=>{
  frame=0;const nodes=[...pending];pending.clear();
  if(locale==='pt')return;
  for(const item of nodes)if(item.isConnected)translateTree(item);
 });
}
function watch(){
 if(locale==='pt'){observer?.disconnect();return;}
 if(!observer)observer=new MutationObserver(records=>{
  for(const record of records){
   if(record.type==='characterData'||record.type==='attributes')schedule(record.target);
   else for(const node of record.addedNodes)schedule(node);
  }
 });
 observer.observe(document.body,{
  subtree:true,childList:true,characterData:true,attributes:true,
  attributeFilter:['aria-label','title','alt','placeholder']
 });
}
export function getBelleLocale():BelleLocale{return locale;}
export function setBelleLocale(next:BelleLocale){
 if(!languages.includes(next))return;
 locale=next;
 document.documentElement.lang=next==='pt'?'pt-BR':next;
 document.documentElement.dataset.belleLocale=next;
 document.title=titles[next];
 try{localStorage.setItem(storeKey,next);}catch{}
 observer?.disconnect();pending.clear();
 translateTree(document.body);
 watch();
 window.dispatchEvent(new CustomEvent('belle:localechange',{detail:{locale:next}}));
 requestAnimationFrame(()=>window.dispatchEvent(new Event('resize')));
}
export function initBelleI18n(){
 document.documentElement.lang=locale==='pt'?'pt-BR':locale;
 document.documentElement.dataset.belleLocale=locale;
 document.title=titles[locale];
 if(locale!=='pt')translateTree(document.body);
 watch();
}
