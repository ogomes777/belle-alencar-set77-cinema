/** Seletor de loja + diálogo de resolução explícita ao trocar com sacola. */
import { h } from '../../core/dom';
import { createOverlay } from './overlay';
import { STORE_LIST, STORES } from '../stores';
import type { StoreId } from '../types';
import type { SwitchChoice, SwitchPlan } from '../state';
import type { Ctx } from './context';
import { plural } from '../format';
import { pin } from './icons';

export function createStorePicker(ctx: Ctx) {
  const ov = createOverlay({ id: 'storeDialog', labelledBy: 'storeDialogTitle', variant: 'dialog', className: 'ov--store' });
  const list = h('ul', { class: 'store-options' });
  ov.body.append(
    h('p', { class: 'eyebrow', text: 'Sua loja Belle' }),
    h('h2', { class: 'ov__title', id: 'storeDialogTitle', html: 'Em qual cidade<br><em>você está?</em>' }),
    h('p', { class: 'ov__lede', text: 'A sacola e a disponibilidade seguem a loja escolhida. Você pode trocar quando quiser.' }),
    list,
    h('p', { class: 'fineprint', text: 'Preferência salva somente neste navegador. Não criamos conta nem pedimos dados pessoais.' }),
  );

  function render() {
    const current = ctx.commerce.get().storeId;
    list.replaceChildren(
      ...STORE_LIST.map((s) => {
        const active = s.id === current;
        const btn = h('button', { type: 'button', class: `store-option${active ? ' is-active' : ''}`, 'data-choose-store': s.id, 'aria-pressed': String(active) },
          h('span', { class: 'store-option__pin', html: pin }),
          h('span', { class: 'store-option__city' }, s.city, h('small', { text: s.state })),
          h('span', { class: `store-option__addr${s.address ? '' : ' is-pending'}`, text: s.address ?? 'Endereço a confirmar com a loja' }),
          active ? h('span', { class: 'store-option__current', text: 'Sua loja' }) : null,
        );
        return h('li', {}, btn);
      }),
    );
  }

  let pending: (() => void) | null = null;
  list.addEventListener('click', (e) => {
    const b = (e.target as HTMLElement).closest<HTMLElement>('[data-choose-store]');
    if (!b) return;
    const then = pending;
    pending = null;
    void ctx.chooseStore(b.dataset.chooseStore as StoreId).then(() => {
      if (ctx.commerce.get().storeId === b.dataset.chooseStore) then?.();
    });
  });

  return {
    open(trigger?: HTMLElement | null, then?: () => void) {
      pending = then ?? null;
      render();
      ov.open(trigger, { focus: ov.body.querySelector<HTMLElement>('.store-option.is-active') });
    },
    close: () => ov.close({ restoreFocus: false }),
    isOpen: ov.isOpen,
  };
}

export function createSwitchDialog() {
  let resolver: ((c: SwitchChoice) => void) | null = null;
  // fechar por Esc ou backdrop = cancelar
  const ov = createOverlay({
    id: 'storeSwitchDialog', labelledBy: 'switchTitle', variant: 'dialog', className: 'ov--switch',
    onClose: () => { const r = resolver; resolver = null; r?.('cancel'); },
  });
  const finish = (c: SwitchChoice) => {
    const r = resolver;
    resolver = null;
    ov.close();
    r?.(c);
  };
  ov.root.addEventListener('click', (e) => {
    const b = (e.target as HTMLElement).closest<HTMLElement>('[data-switch]');
    if (b) finish(b.dataset.switch as SwitchChoice);
  });

  return {
    ask(plan: SwitchPlan, trigger?: HTMLElement | null): Promise<SwitchChoice> {
      const from = plan.from ? STORES[plan.from].city : '';
      const to = STORES[plan.to].city;
      ov.body.replaceChildren(
        h('p', { class: 'eyebrow', text: 'Trocar de loja' }),
        h('h2', { class: 'ov__title', id: 'switchTitle', html: `Sua sacola de ${from}<br><em>tem ${plural(plan.count, 'peça', 'peças')}.</em>` }),
        h('p', { class: 'ov__lede', text: `Cada loja tem o próprio estoque. Como você quer seguir em ${to}?` }),
        h('div', { class: 'switch-options' },
          h('button', { type: 'button', class: 'btn btn--solid', 'data-switch': 'move' }, `Levar as peças para ${to}`),
          h('p', { class: 'fineprint', text: `A disponibilidade é consultada de novo em ${to}. Nada é removido sem você ver.` }),
          h('button', { type: 'button', class: 'btn btn--line', 'data-switch': 'keep' }, `Manter a sacola de ${from} e começar outra`),
          h('button', { type: 'button', class: 'btn btn--ghost', 'data-switch': 'cancel' }, `Continuar em ${from}`),
        ),
      );
      return new Promise((resolve) => {
        resolver = resolve;
        ov.open(trigger, { focus: ov.body.querySelector<HTMLElement>('[data-switch="move"]') });
      });
    },
  };
}
