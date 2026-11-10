import type { CartItem, CheckoutGateway, PreferenceSync, Store } from './types';
import { productById } from './catalog.demo';

export const checkoutGateway: CheckoutGateway = {
  status() {
    return {
      enabled: false,
      reason:
        'O checkout online ainda não está ativo: não há catálogo oficial, estoque por loja nem pagamento autorizado. Envie sua sacola para a loja e finalize no atendimento.',
    };
  },
};

export const preferenceSync: PreferenceSync = {
  async push() {
    /* sem Auth: preferência fica só no navegador */
  },
  async pull() {
    return null;
  },
};

/** Mensagem de texto para o atendimento (o link curto do WhatsApp não aceita texto pré-preenchido). */
export function buildStoreMessage(store: Store, items: CartItem[]): string {
  const lines = items.map((it, i) => {
    const p = productById(it.productId);
    const name = p ? p.title : it.productId;
    const sku = p ? p.sku : it.variantId;
    const size = it.size === 'Único' ? 'tamanho único' : `tam. ${it.size}`;
    return `${i + 1}. ${name} (${sku}) · ${size} · ${it.qty} un.`;
  });
  return [
    `Olá, Belle ${store.city}! Separei estas peças no site:`,
    ...lines,
    '',
    'Obs.: são referências demonstrativas do pré-lançamento do site.',
    'Pode me ajudar com disponibilidade, preço e retirada?',
  ].join('\n');
}
