import { Injectable, PLATFORM_ID, computed, inject, signal } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { ProductDto } from '../models/product.model';

export const CART_STORAGE_KEY = 'onlineshoping.cart';

export interface CartItem {
  productId: string;
  name: string;
  imageUrl: string | null;
  price: number;
  quantity: number;
  maxStock: number;
}

export type CartAddResult = 'added' | 'limit' | 'unavailable';

export function toCartItem(product: ProductDto): Omit<CartItem, 'quantity'> {
  return {
    productId: product.id,
    name: product.name,
    imageUrl: product.imageUrl,
    price: product.price ?? 0,
    maxStock: product.availability === 'OutOfStock' ? 0 : product.stockQuantity
  };
}

@Injectable({ providedIn: 'root' })
export class CartService {
  private readonly isBrowser = isPlatformBrowser(inject(PLATFORM_ID));
  private readonly state = signal<CartItem[]>([]);

  readonly items = this.state.asReadonly();
  readonly count = computed(() => this.state().reduce((sum, item) => sum + item.quantity, 0));
  readonly subtotal = computed(() => this.state().reduce((sum, item) => sum + item.price * item.quantity, 0));

  // Called after hydration so server and first client render match.
  hydrate(): void {
    if (!this.isBrowser) {
      return;
    }
    try {
      const parsed = JSON.parse(localStorage.getItem(CART_STORAGE_KEY) ?? '[]') as CartItem[];
      this.state.set(Array.isArray(parsed) ? parsed.filter((item) => item?.productId && item.quantity > 0) : []);
    } catch {
      this.state.set([]);
    }
  }

  add(item: Omit<CartItem, 'quantity'>, quantity = 1): CartAddResult {
    if (item.maxStock <= 0 || item.price <= 0) {
      return 'unavailable';
    }
    const existing = this.state().find((entry) => entry.productId === item.productId);
    const current = existing?.quantity ?? 0;
    if (current >= item.maxStock) {
      return 'limit';
    }
    const next = Math.min(current + Math.max(quantity, 1), item.maxStock);
    this.update(existing
      ? this.state().map((entry) => entry.productId === item.productId ? { ...entry, ...item, quantity: next } : entry)
      : [...this.state(), { ...item, quantity: next }]);
    return 'added';
  }

  setQuantity(productId: string, quantity: number): void {
    this.update(this.state().map((item) =>
      item.productId === productId ? { ...item, quantity: Math.min(Math.max(quantity, 1), Math.max(item.maxStock, 1)) } : item));
  }

  remove(productId: string): void {
    this.update(this.state().filter((item) => item.productId !== productId));
  }

  clear(): void {
    this.update([]);
  }

  private update(items: CartItem[]): void {
    this.state.set(items);
    if (this.isBrowser) {
      localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(items));
    }
  }
}
