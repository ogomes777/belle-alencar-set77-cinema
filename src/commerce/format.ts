import type { Price } from './types';

export function formatPrice(p: Price): string {
  if (p.priceCents === null) return 'Preço sob consulta';
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: p.currency }).format(p.priceCents / 100);
}

export const plural = (n: number, one: string, many: string) => `${n} ${n === 1 ? one : many}`;
