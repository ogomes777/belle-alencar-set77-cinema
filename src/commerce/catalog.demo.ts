/**
 * Belle Alencar: 48 editorial demo assets with real alpha channels.
 * IMPORTANT: AI-generated concepts, NOT merchandise from Belle.
 * Checkout never enabled; availability not confirmed by store.
 */
import type { Category, Occasion, Product, Size, CatalogSource } from './types';
import type { Silhouette, Tone } from '../core/dress';
import type { IllustrationKind } from '../core/illustration';
interface Seed {slug:string;category:Category;title:string;description:string;color:string}
const seeds: Seed[] = [
  {
    "slug": "camisas-01",
    "category": "camisas",
    "title": "Camisa de popelina branca",
    "description": "camisa de popelina estruturada de gola clássica, manga longa e abotoamento discreto",
    "color": "Branco"
  },
  {
    "slug": "camisas-02",
    "category": "camisas",
    "title": "Camisa de linho areia",
    "description": "camisa de linho natural de manga dobrada e corte soltinho",
    "color": "Areia"
  },
  {
    "slug": "camisas-03",
    "category": "camisas",
    "title": "Camisa listrada azul",
    "description": "camisa de algodão com listras verticais e punhos amplos",
    "color": "Azul claro"
  },
  {
    "slug": "camisas-04",
    "category": "camisas",
    "title": "Camisa laço rosé",
    "description": "camisa fluida de gola laço, elegante e romântica",
    "color": "Rosé"
  },
  {
    "slug": "camisas-05",
    "category": "camisas",
    "title": "Camisa acetinada chocolate",
    "description": "camisa acetinada de decote drapeado e caimento leve",
    "color": "Chocolate"
  },
  {
    "slug": "camisas-06",
    "category": "camisas",
    "title": "Camisa bordado inglês",
    "description": "camisa leve em bordado inglês com mangas curtas",
    "color": "Off-white"
  },
  {
    "slug": "croppeds-01",
    "category": "croppeds",
    "title": "Cropped alfaiataria",
    "description": "top estruturado de decote reto e costuras de alfaiataria",
    "color": "Off-white"
  },
  {
    "slug": "croppeds-02",
    "category": "croppeds",
    "title": "Cropped drapeado vinho",
    "description": "top drapeado com textura acetinada e decote tomara que caia",
    "color": "Vinho"
  },
  {
    "slug": "croppeds-03",
    "category": "croppeds",
    "title": "Cropped corset",
    "description": "top estruturado com desenho de corset e acabamento liso",
    "color": "Preto"
  },
  {
    "slug": "croppeds-04",
    "category": "croppeds",
    "title": "Cropped babados",
    "description": "cropped de alças com aplicação delicada de babados",
    "color": "Branco"
  },
  {
    "slug": "croppeds-05",
    "category": "croppeds",
    "title": "Cropped frente única",
    "description": "cropped frente única de tecido leve com nó no busto",
    "color": "Verde oliva"
  },
  {
    "slug": "croppeds-06",
    "category": "croppeds",
    "title": "Cropped tricô delicado",
    "description": "cropped de malha fina, alças discretas e caimento ajustado",
    "color": "Bege"
  },
  {
    "slug": "vestidos-01",
    "category": "vestidos",
    "title": "Vestido cetim champagne",
    "description": "vestido longo acetinado, alças finas e saia fluida",
    "color": "Champagne"
  },
  {
    "slug": "vestidos-02",
    "category": "vestidos",
    "title": "Vestido drapeado vinho",
    "description": "vestido midi com drapeado e cintura marcada",
    "color": "Vinho"
  },
  {
    "slug": "vestidos-03",
    "category": "vestidos",
    "title": "Vestido renda off-white",
    "description": "vestido em renda com saia fluida e detalhes delicados",
    "color": "Off-white"
  },
  {
    "slug": "vestidos-04",
    "category": "vestidos",
    "title": "Vestido azul nuvem",
    "description": "vestido longo com caimento leve e decote assimétrico",
    "color": "Azul claro"
  },
  {
    "slug": "vestidos-05",
    "category": "vestidos",
    "title": "Vestido preto escultural",
    "description": "vestido de festa preto com linhas marcantes",
    "color": "Preto"
  },
  {
    "slug": "vestidos-06",
    "category": "vestidos",
    "title": "Vestido floral romântico",
    "description": "vestido longo com estampa floral delicada e saia ampla",
    "color": "Floral"
  },
  {
    "slug": "saias-01",
    "category": "saias",
    "title": "Saia godê off-white",
    "description": "saia midi rodada em tecido estruturado",
    "color": "Off-white"
  },
  {
    "slug": "saias-02",
    "category": "saias",
    "title": "Saia couro chocolate",
    "description": "saia midi em material com acabamento de couro",
    "color": "Chocolate"
  },
  {
    "slug": "saias-03",
    "category": "saias",
    "title": "Saia plissada champagne",
    "description": "saia midi com pregas finas e movimento delicado",
    "color": "Champagne"
  },
  {
    "slug": "saias-04",
    "category": "saias",
    "title": "Saia alfaiataria botões",
    "description": "saia curta alfaiatada com botões dourados",
    "color": "Branco"
  },
  {
    "slug": "saias-05",
    "category": "saias",
    "title": "Saia drapeada vinho",
    "description": "saia midi drapeada em tecido acetinado",
    "color": "Vinho"
  },
  {
    "slug": "saias-06",
    "category": "saias",
    "title": "Saia mini preta",
    "description": "saia curta de alfaiataria minimalista",
    "color": "Preto"
  },
  {
    "slug": "calcas-01",
    "category": "calcas",
    "title": "Calça alfaiataria off-white",
    "description": "calça de cintura alta e pernas amplas",
    "color": "Off-white"
  },
  {
    "slug": "calcas-02",
    "category": "calcas",
    "title": "Calça pantalona chocolate",
    "description": "pantalona de tecido fluido, pregas frontais",
    "color": "Chocolate"
  },
  {
    "slug": "calcas-03",
    "category": "calcas",
    "title": "Calça linho natural",
    "description": "calça de linho com corte reto e cintura confortável",
    "color": "Bege"
  },
  {
    "slug": "calcas-04",
    "category": "calcas",
    "title": "Calça reta preta",
    "description": "calça de alfaiataria reta e vinco marcado",
    "color": "Preto"
  },
  {
    "slug": "calcas-05",
    "category": "calcas",
    "title": "Calça cargo sofisticada",
    "description": "cargo de modelagem refinada com bolsos laterais",
    "color": "Bege"
  },
  {
    "slug": "calcas-06",
    "category": "calcas",
    "title": "Calça jeans wide leg",
    "description": "jeans de cintura alta com pernas amplas",
    "color": "Azul jeans"
  },
  {
    "slug": "pulseiras-01",
    "category": "pulseiras",
    "title": "Pulseira elos dourados",
    "description": "pulseira de elos largos polidos",
    "color": "Dourado"
  },
  {
    "slug": "pulseiras-02",
    "category": "pulseiras",
    "title": "Pulseira riviera delicada",
    "description": "pulseira fina com fileira de pedras claras",
    "color": "Dourado"
  },
  {
    "slug": "pulseiras-03",
    "category": "pulseiras",
    "title": "Bracelete orgânico",
    "description": "bracelete de metal com formas orgânicas",
    "color": "Dourado"
  },
  {
    "slug": "pulseiras-04",
    "category": "pulseiras",
    "title": "Pulseira trevos",
    "description": "pulseira fina com pequenas aplicações florais",
    "color": "Dourado"
  },
  {
    "slug": "pulseiras-05",
    "category": "pulseiras",
    "title": "Pulseira pérolas",
    "description": "pulseira com contas de pérolas e detalhes dourados",
    "color": "Pérola"
  },
  {
    "slug": "pulseiras-06",
    "category": "pulseiras",
    "title": "Bracelete texturizado",
    "description": "bracelete largo com textura gravada",
    "color": "Dourado"
  },
  {
    "slug": "bolsas-01",
    "category": "bolsas",
    "title": "Bolsa estruturada ivory",
    "description": "bolsa pequena estruturada com alça curta",
    "color": "Off-white"
  },
  {
    "slug": "bolsas-02",
    "category": "bolsas",
    "title": "Bolsa shoulder vinho",
    "description": "bolsa de ombro em couro de aparência lisa",
    "color": "Vinho"
  },
  {
    "slug": "bolsas-03",
    "category": "bolsas",
    "title": "Bolsa matelassê preta",
    "description": "bolsa de corrente com textura acolchoada",
    "color": "Preto"
  },
  {
    "slug": "bolsas-04",
    "category": "bolsas",
    "title": "Bolsa tote areia",
    "description": "bolsa tote de linhas geométricas simples",
    "color": "Areia"
  },
  {
    "slug": "bolsas-05",
    "category": "bolsas",
    "title": "Bolsa festa dourada",
    "description": "bolsa de festa pequena com acabamento metalizado",
    "color": "Dourado"
  },
  {
    "slug": "bolsas-06",
    "category": "bolsas",
    "title": "Bolsa hobo caramelo",
    "description": "bolsa hobo de linhas orgânicas e alça larga",
    "color": "Caramelo"
  },
  {
    "slug": "aneis-01",
    "category": "aneis",
    "title": "Anel orgânico dourado",
    "description": "anel escultural de metal polido",
    "color": "Dourado"
  },
  {
    "slug": "aneis-02",
    "category": "aneis",
    "title": "Anel solitário cristal",
    "description": "anel com aro delicado e pedra clara central",
    "color": "Dourado"
  },
  {
    "slug": "aneis-03",
    "category": "aneis",
    "title": "Anel trançado dourado",
    "description": "anel com desenho entrelaçado",
    "color": "Dourado"
  },
  {
    "slug": "aneis-04",
    "category": "aneis",
    "title": "Anel nó minimalista",
    "description": "anel delicado com detalhe de nó",
    "color": "Dourado"
  },
  {
    "slug": "aneis-05",
    "category": "aneis",
    "title": "Anel polido statement",
    "description": "anel largo de metal dourado com superfície espelhada",
    "color": "Dourado"
  },
  {
    "slug": "aneis-06",
    "category": "aneis",
    "title": "Anel duplo texturizado",
    "description": "anel com bandas sobrepostas e textura delicada",
    "color": "Dourado"
  }
];
const clothing: Size[] = ['PP','P','M','G','GG'], accessory: Size[] = ['Único'];
function kind(category: Category):IllustrationKind {
 return category==='vestidos'?'dress':category==='bolsas'?'bag':category==='aneis'?'earring':category==='pulseiras'?'belt':'set';
}
function tone(color:string):Tone {
 const x=color.toLowerCase();
 if(x.includes('vinho'))return 'vinho';
 if(x.includes('rosa')||x.includes('rosé'))return 'rosa';
 if(x.includes('chocolate')||x.includes('preto'))return 'noite';
 if(x.includes('azul'))return 'gelo';
 if(x.includes('oliva')||x.includes('verde'))return 'salvia';
 if(x.includes('dourado'))return 'dourado';
 return x.includes('branco')||x.includes('off-white')?'perola':'champagne';
}
function silhouette(i:number):Silhouette { return (['fluido','marcante','classico'] as const)[i%3]!; }
function occasion(category:Category, i:number):Occasion {
 if(category==='vestidos')return (['celebrar','noite','celebrar','dia','noite','celebrar'] as const)[i%6]!;
 if(category==='bolsas'||category==='aneis'||category==='pulseiras')return i%2?'noite':'celebrar';
 return i%3===1?'noite':'dia';
}
export const DEMO_CATALOG: Product[] = seeds.map((s,i)=>{
 const id='belle-demo-'+s.slug, sku='DEMO-'+s.slug.toUpperCase(), sizes=['aneis','bolsas','pulseiras'].includes(s.category)?accessory:clothing;
 const sil = s.category==='vestidos'?silhouette(i):undefined, t=tone(s.color);
 return {
 id, slug:s.slug, sku, title:s.title, description:s.description,
 category:s.category, occasion:occasion(s.category,i), tone:t, silhouette:sil,
 illustration:{kind:kind(s.category),tone:t,silhouette:sil,seed:i+400},
 cutout:'/editorial/'+s.slug+'.webp',
 variants:sizes.map(size=>({id:sku+'-'+size,productId:id,sku:sku+'-'+size,size})),
 price:{priceCents:null,currency:'BRL'},isDemo:true,active:true,
 mediaRights:{source:'Produção editorial sintética SET77 Labs',status:'demo',note:'Imagem gerada para prototipação. Não representa produtos reais, preço ou estoque Belle Alencar.'},
 };
});
export const demoCatalogSource:CatalogSource={
 async list(){return DEMO_CATALOG;},
 async bySlug(slug){return DEMO_CATALOG.find(p=>p.slug===slug);}
};
export const productById=(id:string)=>DEMO_CATALOG.find(p=>p.id===id);
export const productBySlug=(slug:string)=>DEMO_CATALOG.find(p=>p.slug===slug);
