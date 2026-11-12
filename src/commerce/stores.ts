import type { Store, StoreId } from './types';
import { STORE_IDS } from './types';

/** Fonte: docs/FACTS_AND_GAPS.md. Endereços confirmados nos prints enviados pelo cliente em 12/11/2026. */
export const OFFICIAL_WHATSAPP = 'https://wa.me/message/YYDB5NC7JMUQP1';
export const OFFICIAL_INSTAGRAM = 'https://www.instagram.com/belle.alencar/';

const contact = { whatsappUrl: OFFICIAL_WHATSAPP, contactConfirmed: false, instagramUrl: OFFICIAL_INSTAGRAM };

export const STORES: Record<StoreId, Store> = {
  araxa: {
    id: 'araxa', slug: 'araxa', city: 'Araxá', state: 'MG',
    address: 'Av. Vereador João Sena, 103, Centro',
    addressSource: 'bio do Instagram informada pelo cliente',
    active: true, contact, openingHours: null, fulfillmentRules: null,
  },
  frutal: {
    id: 'frutal', slug: 'frutal', city: 'Frutal', state: 'MG',
    address: 'Av. Coronel Delfino Nunes, 382', addressSource: 'bio do Instagram enviada pelo cliente em 12/11/2026', active: true, contact, openingHours: null, fulfillmentRules: null,
  },
  catalao: {
    id: 'catalao', slug: 'catalao', city: 'Catalão', state: 'GO',
    address: 'Av. José Marcelino, 206, Centro', addressSource: 'bio do Instagram enviada pelo cliente em 12/11/2026', active: true, contact, openingHours: null, fulfillmentRules: null,
  },
  mineiros: {
    id: 'mineiros', slug: 'mineiros', city: 'Mineiros', state: 'GO',
    address: 'Quarta Avenida, 76, Centro', addressSource: 'bio do Instagram enviada pelo cliente em 12/11/2026', active: true, contact, openingHours: null, fulfillmentRules: null,
  },
};

export const STORE_LIST: Store[] = STORE_IDS.map((id) => STORES[id]);

export function isStoreId(v: unknown): v is StoreId {
  return typeof v === 'string' && (STORE_IDS as readonly string[]).includes(v);
}
