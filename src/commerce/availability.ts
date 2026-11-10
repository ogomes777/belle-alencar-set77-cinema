import type { AvailabilityMap, AvailabilityProvider, AvailabilityStatus, StoreId } from './types';

/**
 * Sem integração de estoque: tudo é "consultar a loja".
 * Substituir por provider server-side com reserva transacional quando autorizado.
 */
export class DemoAvailabilityProvider implements AvailabilityProvider {
  async check(_storeId: StoreId, variantIds: string[]): Promise<AvailabilityMap> {
    const out: AvailabilityMap = {};
    for (const id of variantIds) out[id] = 'unknown';
    return out;
  }
}

export const AVAILABILITY_LABEL: Record<AvailabilityStatus, string> = {
  in_stock: 'Disponível',
  low: 'Últimas unidades',
  out: 'Indisponível nesta loja',
  unknown: 'Consultar a loja',
};
