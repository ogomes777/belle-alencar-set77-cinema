/** Belle editorial runway uses the exact same 48 product catalog IDs as catalog/cart. */
import { DEMO_CATALOG } from '../commerce/catalog.demo';
import type { Product } from '../commerce/types';
export const MODEL_SOURCE = '';
export const PIECE_SOURCE = '';
export const MODEL_SHEET = '';
export const PIECE_SHEET = '';
export const MODEL_BOXES = [[12,176],[178,330],[331,470],[476,633],[634,767],[767,956]] as const;
export const FALLBACKS = ['vestidos-01','croppeds-02','camisas-03','vestidos-02','calcas-02','saias-03'];
const selection = [
 'vestidos-01','bolsas-01',
 'croppeds-02','calcas-01',
 'camisas-03','saias-03',
 'vestidos-02','aneis-02',
 'calcas-02','pulseiras-01',
 'saias-03','bolsas-05',
] as const;
export const RUNWAY_PRODUCTS:Product[]=selection.map(slug=>DEMO_CATALOG.find(p=>p.slug===slug)!).filter(Boolean);
