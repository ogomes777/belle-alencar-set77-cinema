import type { Commerce } from '../state';
import type { Category, Occasion, StoreId } from '../types';
import type { Silhouette } from '../../core/dress';

export interface Ctx {
  commerce: Commerce;
  reduced: () => boolean;
  openStorePicker(trigger?: HTMLElement | null, then?: () => void): void;
  chooseStore(id: StoreId, trigger?: HTMLElement | null): Promise<void>;
  openQuickView(productId: string, trigger?: HTMLElement | null, flipFrom?: HTMLElement | null): void;
  openBag(trigger?: HTMLElement | null): void;
  openWishlist(trigger?: HTMLElement | null): void;
  openSearch(trigger?: HTMLElement | null): void;
  applyCategory(category: Category | 'todas', silhouette?: Silhouette | null, scroll?: boolean, occasion?: Occasion | 'todas'): void;
  scrollTo(id: string): void;
}
