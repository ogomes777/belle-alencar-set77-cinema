/**
 * Runway editorial groups. Every look is a deliberately coordinated outfit,
 * never three arbitrary catalog slots. All pieces remain synthetic demos.
 * Keep product IDs canonical so favorite, quick-view and shopping bag work.
 */
import { DEMO_CATALOG } from '../commerce/catalog.demo';
import type { Product } from '../commerce/types';

export const RUNWAY_CARDS_PER_LOOK = 3;
interface LookPlan { key:string; name:string; styling:string; slugs: readonly [string,string,string]; }
const LOOK_PLANS: readonly LookPlan[] = [
  { key:'champagne', name:'Champagne', styling:'Vestido + bolsa + anel', slugs:['vestidos-01','bolsas-01','aneis-01'] },
  { key:'vinho', name:'Vinho & areia', styling:'Cropped + saia + bolsa', slugs:['croppeds-02','saias-02','bolsas-02'] },
  { key:'azul', name:'Azul & pérola', styling:'Camisa + calça + pulseira', slugs:['camisas-03','calcas-01','pulseiras-01'] },
  { key:'noite', name:'Noite', styling:'Vestido + bolsa + anel', slugs:['vestidos-02','bolsas-03','aneis-02'] },
  { key:'oliva', name:'Oliva & creme', styling:'Cropped + saia + bolsa', slugs:['croppeds-04','saias-04','bolsas-04'] },
  { key:'azul-claro', name:'Azul delicado', styling:'Vestido + bolsa + anel', slugs:['vestidos-05','bolsas-06','aneis-05'] },
];

export interface RunwayLook { key:string; name:string; styling:string; pieces:readonly [Product,Product,Product]; hero:Product; }
function product(slug:string):Product {
  const found=DEMO_CATALOG.find(p=>p.slug===slug);
  if(!found)throw new Error(`Runway: produto inexistente no catálogo: ${slug}`);
  return found;
}
export const RUNWAY_LOOKS: readonly RunwayLook[] = LOOK_PLANS.map(plan=>{
  const pieces: [Product,Product,Product]=[product(plan.slugs[0]),product(plan.slugs[1]),product(plan.slugs[2])];
  if(new Set(pieces.map(p=>p.category)).size!==RUNWAY_CARDS_PER_LOOK)
    throw new Error(`Runway: categorias repetidas no conjunto ${plan.key}`);
  return { key:plan.key,name:plan.name,styling:plan.styling,pieces,hero:pieces[0] };
});
export const RUNWAY_PRODUCTS:Product[]=RUNWAY_LOOKS.flatMap(look=>look.pieces);
