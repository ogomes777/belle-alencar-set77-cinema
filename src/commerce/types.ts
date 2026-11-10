/**
 * Contratos do comércio multiloja (docs/STORE_COMMERCE_CONTRACT.md).
 * Tudo que é demonstrativo carrega `isDemo: true` e nunca pode ser cobrado.
 */
import type { IllustrationSpec } from '../core/illustration';
import type { Silhouette, Tone } from '../core/dress';

export type StoreId = 'araxa' | 'frutal' | 'catalao' | 'mineiros';
export const STORE_IDS: readonly StoreId[] = ['araxa', 'frutal', 'catalao', 'mineiros'];

export interface Store {
  id: StoreId;
  slug: string;
  city: string;
  state: 'MG' | 'GO';
  /** null = não confirmado; não inventar */
  address: string | null;
  addressSource: string | null;
  active: boolean;
  contact: {
    whatsappUrl: string;
    /** false enquanto o contato por unidade não for confirmado pelo cliente */
    contactConfirmed: boolean;
    instagramUrl: string;
  };
  openingHours: string | null;
  fulfillmentRules: string | null;
}

export type Category = 'camisas' | 'croppeds' | 'vestidos' | 'saias' | 'calcas' | 'pulseiras' | 'bolsas' | 'aneis';
export const SHOP_CATEGORIES = ['vestidos', 'camisas', 'croppeds', 'saias', 'calcas', 'bolsas', 'pulseiras', 'aneis'] as const satisfies readonly Category[];
export type Occasion = 'dia' | 'noite' | 'celebrar';
export type Size = 'PP' | 'P' | 'M' | 'G' | 'GG' | 'Único';

export const CATEGORY_LABEL: Record<Category, string> = {
  camisas: 'Camisas', croppeds: 'Croppeds', vestidos: 'Vestidos', saias: 'Saias',
  calcas: 'Calças', pulseiras: 'Pulseiras', bolsas: 'Bolsas', aneis: 'Anéis',
};
export const OCCASION_LABEL: Record<Occasion, string> = {
  dia: 'Dia a dia',
  noite: 'Para sair',
  celebrar: 'Para celebrar',
};

export interface Variant {
  id: string;
  productId: string;
  size: Size;
  sku: string;
}

export interface Price {
  /** null = preço não informado pela loja ("Preço sob consulta") */
  priceCents: number | null;
  currency: 'BRL';
}

export interface MediaRights {
  source: string;
  status: 'demo' | 'approved';
  note: string;
}

export interface Product {
  id: string;
  slug: string;
  sku: string;
  title: string;
  description: string;
  category: Category;
  occasion: Occasion;
  silhouette?: Silhouette;
  tone: Tone;
  illustration: IllustrationSpec;
  /** Recorte com fundo transparente (render do estudo 3D ou, no futuro, foto oficial). */
  cutout?: string;
  /** Stable public kit identity; product.id stays compatible with saved interest bags. */
  demoId?: string;
  packshot?: string;
  cutoutSize?: readonly [number, number];
  /** Absolute-pixel alpha bounds x0/y0/x1/y1, for physical anchoring without distortion. */
  cutoutBounds?: readonly [number, number, number, number];
  packshotBounds?: readonly [number, number, number, number];
  inventoryConfirmed?: false;
  sprite?: { src: string; box: [number, number, number, number]; sheet: [number, number] };
  variants: Variant[];
  price: Price;
  isDemo: boolean;
  mediaRights: MediaRights;
  active: boolean;
}

export type AvailabilityStatus = 'in_stock' | 'low' | 'out' | 'unknown';
export type AvailabilityMap = Record<string, AvailabilityStatus>;

export interface CartItem {
  productId: string;
  variantId: string;
  size: Size;
  qty: number;
  storeId: StoreId;
  addedAt: number;
}

export type Bags = Partial<Record<StoreId, CartItem[]>>;

export interface CatalogSource {
  list(): Promise<Product[]>;
  bySlug(slug: string): Promise<Product | undefined>;
}

export interface AvailabilityProvider {
  check(storeId: StoreId, variantIds: string[]): Promise<AvailabilityMap>;
}

export interface CheckoutGateway {
  status(): { enabled: false; reason: string } | { enabled: true };
}

/** Sincroniza a loja preferida no perfil server-side. No-op até existir Auth + RLS. */
export interface PreferenceSync {
  push(storeId: StoreId): Promise<void>;
  pull(): Promise<StoreId | null>;
}
