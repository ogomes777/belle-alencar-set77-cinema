/** Belle V38: busca local rápida, determinística, sem rede ou promessas de estoque. */
import { CATEGORY_LABEL, type Category, type Product } from './types';

export function searchKey(value:string):string {
  return value.toLocaleLowerCase('pt-BR').normalize('NFD')
    .replace(/[\u0300-\u036f]/g,'').replace(/[^a-z0-9]+/g,' ').trim().replace(/\s+/g,' ');
}
const ALIASES:Record<string,string>={
  vestido:'vestidos',vestidos:'vestidos',dress:'vestidos',dresses:'vestidos',
  bolsa:'bolsas',bolsas:'bolsas',bag:'bolsas',purse:'bolsas',
  saia:'saias',saias:'saias',skirt:'saias',
  calca:'calcas',calcas:'calcas',pants:'calcas',
  camisa:'camisas',camisas:'camisas',blusa:'camisas',
  cropped:'croppeds',croppeds:'croppeds',crop:'croppeds',
  pulseira:'pulseiras',pulseiras:'pulseiras',
  anel:'aneis',aneis:'aneis',ring:'aneis',
  acessorio:'acessorios',acessorios:'acessorios',
  casamento:'celebrar',formatura:'celebrar',festa:'celebrar',festas:'celebrar',
  balada:'noite',jantar:'noite',evento:'celebrar',eventos:'celebrar',
  cotidiano:'dia',casual:'dia',
};
export const SEARCH_SUGGESTIONS=[
  {code:'01',eyebrow:'VESTIDOS',label:'Vestidos de ocasião',term:'vestidos'},
  {code:'02',eyebrow:'CURADORIA',label:'Saias e movimento',term:'saias'},
  {code:'03',eyebrow:'ACESSÓRIOS',label:'Bolsas para compor',term:'bolsas'},
  {code:'04',eyebrow:'DETALHES',label:'Anéis e brilho',term:'aneis'},
] as const;
export const SEARCH_QUICK_TERMS=['Vestidos','Saias','Bolsas','Anéis','Croppeds','Camisas','Calças','Pulseiras'] as const;
const occWords:Record<string,string>={dia:'dia dia casual cotidiano',noite:'noite balada jantar',celebrar:'celebrar evento festa casamento formatura'};
export function rankProducts(products:readonly Product[],query:string):Product[] {
  const raw=searchKey(query);
  if(!raw)return [];
  const tokens=raw.split(' ').filter(Boolean).map(t=>ALIASES[t]||t);
  const scored:{product:Product;score:number;index:number}[]=[];
  products.forEach((p,index)=>{
    if(!p.active)return;
    const title=searchKey(p.title);
    const category=searchKey(CATEGORY_LABEL[p.category as Category]||p.category);
    const categoryWords=searchKey(p.category+' '+CATEGORY_LABEL[p.category as Category]);
    const description=searchKey(p.description);
    const occasion=searchKey(occWords[p.occasion]||p.occasion);
    const sku=searchKey(p.sku);
    const all=title+' '+categoryWords+' '+description+' '+occasion+' '+sku;
    const scoreToken=(t:string):number=>{
      if(t==='acessorios' && ['bolsas','aneis','pulseiras'].includes(p.category))return 32;
      if(category===t || categoryWords.split(' ').includes(t))return 38;
      if(title===t)return 75;
      if(title.startsWith(t+' '))return 65;
      if(title.split(' ').some(w=>w.startsWith(t)))return 51;
      if(categoryWords.split(' ').some(w=>w.startsWith(t)))return 32;
      if(occasion.split(' ').includes(t))return 24;
      if(description.split(' ').some(w=>w.startsWith(t)))return 14;
      if(sku.includes(t))return 12;
      if(all.includes(t))return 6;
      return 0;
    };
    const values=tokens.map(scoreToken);
    if(values.some(v=>v===0))return;
    const score=values.reduce((acc,n)=>acc+n,0)+(title.includes(raw)?22:0);
    scored.push({product:p,score,index});
  });
  scored.sort((a,b)=>b.score-a.score || a.index-b.index);
  return scored.map(s=>s.product);
}
export function searchHints(query:string,products:readonly Product[],limit=5):string[]{
  const q=searchKey(query);
  if(!q || q.length<2)return [];
  const out=new Map<string,string>();
  const add=(v:string)=>{
    const key=searchKey(v);
    if(key && key!==q && (key.includes(q)||q.includes(key.split(' ')[0]!)))out.set(key,v);
  };
  SEARCH_QUICK_TERMS.forEach(add);
  for(const p of rankProducts(products,query).slice(0,8))add(p.title);
  return [...out.values()].slice(0,limit);
}
