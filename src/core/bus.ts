/** Barramento de eventos entre shell, filme e comércio (tipado). */
import type { DressParams } from './dress';

export interface BusEvents {
  /** Catálogo pede para o provador 3D vestir um estudo. */
  'dress:try': DressParams;
  /** Filme informa o capítulo ativo. */
  'film:chapter': { id: string; index: number };
  /** Pedido de navegação para um capítulo do filme. */
  'film:goto': { id: string };
  /** Filtro de categoria vindo dos arcos do filme. */
  'catalog:filter': { category: string; silhouette?: import('./dress').Silhouette };
  /** Intensidade do motion mudou. */
  'motion:intensity': { intensity: 'cinema' | 'essential' };
}

type Handler<K extends keyof BusEvents> = (payload: BusEvents[K]) => void;
const handlers = new Map<keyof BusEvents, Set<Handler<never>>>();

export const bus = {
  on<K extends keyof BusEvents>(type: K, fn: Handler<K>): () => void {
    let set = handlers.get(type);
    if (!set) handlers.set(type, (set = new Set()));
    set.add(fn as Handler<never>);
    return () => set!.delete(fn as Handler<never>);
  },
  emit<K extends keyof BusEvents>(type: K, payload: BusEvents[K]): void {
    handlers.get(type)?.forEach((fn) => (fn as Handler<K>)(payload));
  },
};
