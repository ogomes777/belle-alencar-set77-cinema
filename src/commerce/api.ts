/**
 * Fachada pública do comércio para a arara viva, a ficha editorial e o voo até a bolsa.
 * Uma única fonte de verdade (state.ts). Nada aqui cria pedido: é a sacola de interesse.
 */
import type { Product, Size } from './types';

export interface CommerceApi {
  product(id: string): Product | undefined;
  /** adiciona e persiste; chame no IMPACTO com a bolsa (contador só muda aí) */
  add(productId: string, size: Size): { ok: boolean; reason?: string };
  count(): number;
  storeCity(): string | null;
  hasStore(): boolean;
  /** abre o seletor de loja e executa `then` após a escolha */
  ensureStore(trigger: HTMLElement | null, then: () => void): void;
  openBag(trigger?: HTMLElement | null): void;
  availabilityText(productId: string, size: Size | null): string;
  onChange(fn: () => void): () => void;
}

let api: CommerceApi | null = null;
export function setCommerceApi(a: CommerceApi): void { api = a; }
export function commerceApi(): CommerceApi | null { return api; }
