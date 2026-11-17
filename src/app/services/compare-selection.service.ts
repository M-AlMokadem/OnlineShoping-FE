import { Injectable, computed, signal } from '@angular/core';
import { ProductCategory, ProductDto } from '../models/product.model';

export const MAX_COMPARE_ITEMS = 4;
export type AddResult = 'added' | 'limit' | 'category';

@Injectable({ providedIn: 'root' })
export class CompareSelectionService {
  private readonly items = signal<Pick<ProductDto, 'id' | 'category'>[]>([]);

  readonly ids = computed(() => this.items().map((item) => item.id));
  readonly count = computed(() => this.items().length);
  readonly category = computed<ProductCategory | null>(() => this.items()[0]?.category ?? null);

  has(id: string): boolean {
    return this.items().some((item) => item.id === id);
  }

  add(product: Pick<ProductDto, 'id' | 'category'>): AddResult {
    if (this.has(product.id)) {
      return 'added';
    }
    if (this.items().length >= MAX_COMPARE_ITEMS) {
      return 'limit';
    }
    if (this.category() && this.category() !== product.category) {
      return 'category';
    }

    this.items.update((current) => [...current, { id: product.id, category: product.category }]);
    return 'added';
  }

  remove(id: string): void {
    this.items.update((current) => current.filter((item) => item.id !== id));
  }

  toggle(product: Pick<ProductDto, 'id' | 'category'>): AddResult {
    if (this.has(product.id)) {
      this.remove(product.id);
      return 'added';
    }
    return this.add(product);
  }

  clear(): void {
    this.items.set([]);
  }
}
