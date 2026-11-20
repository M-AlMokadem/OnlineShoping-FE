import { Injectable, PLATFORM_ID, computed, inject, signal } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { ProductDto } from '../models/product.model';

export const WISHLIST_STORAGE_KEY = 'onlineshoping.wishlist';

@Injectable({ providedIn: 'root' })
export class WishlistService {
  private readonly isBrowser = isPlatformBrowser(inject(PLATFORM_ID));
  private readonly state = signal<ProductDto[]>([]);

  readonly items = this.state.asReadonly();
  readonly count = computed(() => this.state().length);

  hydrate(): void {
    if (!this.isBrowser) {
      return;
    }
    try {
      const parsed = JSON.parse(localStorage.getItem(WISHLIST_STORAGE_KEY) ?? '[]') as ProductDto[];
      this.state.set(Array.isArray(parsed) ? parsed.filter((item) => item?.id) : []);
    } catch {
      this.state.set([]);
    }
  }

  has(id: string): boolean {
    return this.state().some((item) => item.id === id);
  }

  toggle(product: ProductDto): boolean {
    const added = !this.has(product.id);
    this.update(added ? [...this.state(), product] : this.state().filter((item) => item.id !== product.id));
    return added;
  }

  private update(items: ProductDto[]): void {
    this.state.set(items);
    if (this.isBrowser) {
      localStorage.setItem(WISHLIST_STORAGE_KEY, JSON.stringify(items));
    }
  }
}
