/** Drawers: sacola de interesse (por filial) e favoritos. */
import { h } from '../../core/dom';
import { announce } from '../../core/a11y';
import { productImage } from '../media';
import { createOverlay } from './overlay';
import { STORES } from '../stores';
import { countItems, MAX_QTY } from '../cart';
import { AVAILABILITY_LABEL } from '../availability';
import { buildStoreMessage, checkoutGateway } from '../checkout';
import { plural } from '../format';
import { minus, plus, trash, heart } from './icons';
import type { Ctx } from './context';

async function copyText(text: string, area: HTMLTextAreaElement): Promise<boolean> {
  try {
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(text);
      return true;
    }
  } catch {
    /* tenta fallback */
  }
  try {
    area.focus();
    area.select();
    return document.execCommand('copy');
  } catch {
    return false;
  }
}

const mini = (image: Node) => {
  const s = h('span', { class: 'mini-ill', 'aria-hidden': 'true' });
  s.append(image);
  return s;
};

export function createBag(ctx: Ctx) {
  const ov = createOverlay({ id: 'bagDrawer', labelledBy: 'bagTitle', variant: 'drawer', className: 'ov--bag' });

  function render() {
    const { storeId } = ctx.commerce.get();
    const store = storeId ? STORES[storeId] : null;
    const items = ctx.commerce.currentBag();
    const others = ctx.commerce.otherBags();
    const head = h('header', { class: 'drawer-head' },
      h('p', { class: 'eyebrow', text: 'Sacola de interesse' }),
      h('h2', { class: 'ov__title', id: 'bagTitle', html: store ? `Belle <em>${store.city}</em>` : 'Sua <em>sacola</em>' }),
      store
        ? h('p', { class: 'drawer-head__store' }, `${plural(countItems(items), 'peça', 'peças')} · loja de ${store.city}/${store.state} `,
            h('button', { type: 'button', class: 'link-btn', 'data-change-store': true, text: 'trocar loja' }))
        : null,
    );

    if (!store) {
      ov.body.replaceChildren(head,
        h('div', { class: 'drawer-empty' },
          h('p', { text: 'Cada loja tem a própria sacola e o próprio estoque. Escolha a sua para começar.' }),
          h('button', { type: 'button', class: 'btn btn--solid', 'data-change-store': true, text: 'Escolher minha loja' })));
      return;
    }

    const list = h('ul', { class: 'bag-list' }, ...items.map((it) => {
      const p = ctx.commerce.product(it.productId);
      if (!p) return h('li', {});
      const st = ctx.commerce.statusOf(storeId, it.variantId);
      return h('li', { class: `bag-item${st === 'out' ? ' is-out' : ''}` },
        mini(productImage(p, { alt: '' })),
        h('div', { class: 'bag-item__info' },
          h('p', { class: 'bag-item__title', text: p.title }),
          h('p', { class: 'bag-item__meta', text: `${p.sku} · ${it.size === 'Único' ? 'tamanho único' : `tam. ${it.size}`}` }),
          h('p', { class: `avail avail--${st}`, text: st === 'unknown' ? `Consultar a loja de ${store.city}` : AVAILABILITY_LABEL[st] }),
        ),
        h('div', { class: 'qty', role: 'group', 'aria-label': `Quantidade de ${p.title}` },
          h('button', { type: 'button', class: 'qty__btn', 'data-dec': it.variantId, 'aria-label': `Diminuir quantidade de ${p.title}`, html: minus }),
          h('output', { class: 'qty__val', 'aria-live': 'polite', text: String(it.qty) }),
          h('button', { type: 'button', class: 'qty__btn', 'data-inc': it.variantId, 'aria-label': `Aumentar quantidade de ${p.title}`, disabled: it.qty >= MAX_QTY, html: plus }),
        ),
        h('button', { type: 'button', class: 'icon-mini', 'data-remove': it.variantId, 'aria-label': `Remover ${p.title} da sacola`, html: trash }),
      );
    }));

    const otherNote = others.length
      ? h('p', { class: 'bag-other' }, `Você também tem peças salvas na sacola de ${others.map((id) => STORES[id].city).join(', ')}. `,
          ...others.map((id) => h('button', { type: 'button', class: 'link-btn', 'data-goto-store': id, text: `Abrir ${STORES[id].city}` })))
      : null;

    if (!items.length) {
      ov.body.replaceChildren(head,
        h('div', { class: 'drawer-empty' },
          h('p', { text: `Sua sacola de ${store.city} está vazia.` }),
          h('button', { type: 'button', class: 'btn btn--line', 'data-browse': true, text: 'Ver a coleção' })),
        otherNote ?? '');
      return;
    }

    const message = buildStoreMessage(store, items);
    const area = h('textarea', { class: 'send-msg', readonly: true, rows: 7, 'aria-label': 'Mensagem para a loja' }) as HTMLTextAreaElement;
    area.value = message;
    const send = h('div', { class: 'send-box', hidden: true },
      h('p', { class: 'send-box__status', role: 'status', 'data-send-status': true }),
      area,
      h('p', { class: 'fineprint', text: 'O link oficial do WhatsApp da Belle não aceita texto pré-preenchido: cole a mensagem na conversa. O contato de cada unidade ainda está em confirmação; a equipe direciona você para a loja certa.' }),
      h('a', { class: 'link-btn', href: store.contact.whatsappUrl, target: '_blank', rel: 'noopener noreferrer', text: 'Abrir o WhatsApp de novo' }),
    );
    const co = checkoutGateway.status();
    const foot = h('footer', { class: 'drawer-foot' },
      h('p', { class: 'drawer-foot__sum' }, h('span', { text: plural(countItems(items), 'peça', 'peças') }), h('strong', { text: 'Preço sob consulta' })),
      h('button', { type: 'button', class: 'btn btn--solid btn--block', 'data-send': true, text: `Enviar para a Belle ${store.city}` }),
      send,
      h('button', { type: 'button', class: 'btn btn--line btn--block', disabled: true, 'aria-describedby': 'checkoutReason', text: 'Checkout online' }),
      h('p', { class: 'fineprint', id: 'checkoutReason', text: co.enabled ? '' : co.reason }),
    );
    ov.body.replaceChildren(head, list, otherNote ?? '', foot);
  }

  ov.body.addEventListener('click', (e) => {
    const t = e.target as HTMLElement;
    const sid = ctx.commerce.get().storeId;
    const inc = t.closest<HTMLElement>('[data-inc]');
    const dec = t.closest<HTMLElement>('[data-dec]');
    const rem = t.closest<HTMLElement>('[data-remove]');
    const item = (id: string) => ctx.commerce.currentBag().find((x) => x.variantId === id);
    if (inc) { const it = item(inc.dataset.inc!); if (it) ctx.commerce.updateQty(it.variantId, it.qty + 1); focusAfter(`[data-inc="${inc.dataset.inc}"]`); return; }
    if (dec) {
      const it = item(dec.dataset.dec!);
      if (it) { ctx.commerce.updateQty(it.variantId, it.qty - 1); if (it.qty - 1 <= 0) announce('Peça removida da sacola.'); }
      focusAfter(`[data-dec="${dec.dataset.dec}"]`);
      return;
    }
    if (rem) { ctx.commerce.remove(rem.dataset.remove!); announce('Peça removida da sacola.'); focusAfter('.bag-item [data-remove], [data-browse], .ov__close'); return; }
    if (t.closest('[data-change-store]')) { ctx.openStorePicker(document.getElementById('bagButton')); return; }
    const g = t.closest<HTMLElement>('[data-goto-store]');
    if (g) { void ctx.chooseStore(g.dataset.gotoStore as never, document.getElementById('bagButton')); return; }
    if (t.closest('[data-browse]')) { ov.close({ restoreFocus: false }); ctx.scrollTo('colecao'); return; }
    if (t.closest('[data-send]') && sid) {
      const box = ov.body.querySelector<HTMLElement>('.send-box')!;
      const area = box.querySelector<HTMLTextAreaElement>('textarea')!;
      const status = box.querySelector<HTMLElement>('[data-send-status]')!;
      box.hidden = false;
      // abre o canal oficial dentro do gesto do usuário (evita bloqueio de pop-up)
      window.open(STORES[sid].contact.whatsappUrl, '_blank', 'noopener,noreferrer');
      void copyText(area.value, area).then((ok) => {
        status.textContent = ok
          ? 'Mensagem copiada. Cole na conversa do WhatsApp que abrimos em outra aba.'
          : 'Não conseguimos copiar automaticamente. Selecione e copie a mensagem abaixo.';
        announce(status.textContent);
      });
    }
  });

  function focusAfter(sel: string) {
    requestAnimationFrame(() => {
      const el = ov.body.querySelector<HTMLElement>(sel) ?? ov.body.querySelector<HTMLElement>('button');
      el?.focus({ preventScroll: true });
    });
  }

  ctx.commerce.subscribe((s, prev) => {
    if (ov.isOpen() && (s.bags !== prev.bags || s.storeId !== prev.storeId || s.availability !== prev.availability)) render();
  });

  return {
    open(trigger?: HTMLElement | null) {
      render();
      ov.open(trigger);
      void ctx.commerce.refreshAvailability();
    },
  };
}

export function createWishlist(ctx: Ctx) {
  const ov = createOverlay({ id: 'wishlistDrawer', labelledBy: 'wishTitle', variant: 'drawer', className: 'ov--wish' });

  function render() {
    const ids = ctx.commerce.get().wishlist;
    const head = h('header', { class: 'drawer-head' },
      h('p', { class: 'eyebrow', text: 'Favoritos' }),
      h('h2', { class: 'ov__title', id: 'wishTitle', html: 'Peças que <em>ficaram</em>' }),
      h('p', { class: 'drawer-head__store', text: 'Salvos neste navegador.' }));
    if (!ids.length) {
      ov.body.replaceChildren(head, h('div', { class: 'drawer-empty' },
        h('p', { text: 'Toque no coração de uma peça para guardar aqui.' }),
        h('button', { type: 'button', class: 'btn btn--line', 'data-browse': true, text: 'Ver a coleção' })));
      return;
    }
    ov.body.replaceChildren(head, h('ul', { class: 'bag-list' }, ...ids.map((id) => {
      const p = ctx.commerce.product(id);
      if (!p) return h('li', {});
      return h('li', { class: 'bag-item' },
        mini(productImage(p, { alt: '' })),
        h('div', { class: 'bag-item__info' },
          h('p', { class: 'bag-item__title', text: p.title }),
          h('p', { class: 'bag-item__meta', text: `${p.sku} · referência demonstrativa` }),
          h('button', { type: 'button', class: 'link-btn', 'data-open': p.id, text: 'Ver detalhes' })),
        h('button', { type: 'button', class: 'icon-mini wish-btn', 'aria-pressed': 'true', 'data-unwish': p.id, 'aria-label': `Remover ${p.title} dos favoritos`, html: heart }));
    })));
  }

  ov.body.addEventListener('click', (e) => {
    const t = e.target as HTMLElement;
    const un = t.closest<HTMLElement>('[data-unwish]');
    if (un) { ctx.commerce.toggleWishlist(un.dataset.unwish!); announce('Removido dos favoritos.'); render(); ov.body.querySelector<HTMLElement>('button')?.focus(); return; }
    const op = t.closest<HTMLElement>('[data-open]');
    if (op) { ctx.openQuickView(op.dataset.open!, document.getElementById('wishlistButton')); return; }
    if (t.closest('[data-browse]')) { ov.close({ restoreFocus: false }); ctx.scrollTo('colecao'); }
  });

  return { open(trigger?: HTMLElement | null) { render(); ov.open(trigger); } };
}
