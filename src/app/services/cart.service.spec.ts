/// <reference types="jasmine" />

import { TestBed } from '@angular/core/testing';
import { CART_STORAGE_KEY, CartItem, CartService } from './cart.service';

const phone: Omit<CartItem, 'quantity'> = { productId: 'p1', name: 'Phone', imageUrl: null, price: 1000, maxStock: 3 };
const watch: Omit<CartItem, 'quantity'> = { productId: 'p2', name: 'Watch', imageUrl: null, price: 250, maxStock: 5 };

describe('CartService', () => {
  let cart: CartService;

  beforeEach(() => {
    localStorage.removeItem(CART_STORAGE_KEY);
    TestBed.configureTestingModule({});
    cart = TestBed.inject(CartService);
  });

  afterEach(() => localStorage.removeItem(CART_STORAGE_KEY));

  it('increments an existing item and stops at the stock limit', () => {
    expect(cart.add(phone, 2)).toBe('added');
    expect(cart.add(phone, 5)).toBe('added');
    expect(cart.items()[0].quantity).toBe(3);
    expect(cart.add(phone)).toBe('limit');
    expect(cart.items().length).toBe(1);
  });

  it('rejects out-of-stock items', () => {
    expect(cart.add({ ...phone, maxStock: 0 })).toBe('unavailable');
    expect(cart.count()).toBe(0);
  });

  it('bounds quantity changes between 1 and stock', () => {
    cart.add(phone);
    cart.setQuantity('p1', 99);
    expect(cart.items()[0].quantity).toBe(3);
    cart.setQuantity('p1', 0);
    expect(cart.items()[0].quantity).toBe(1);
  });

  it('removes items, clears the cart and computes totals', () => {
    cart.add(phone, 2);
    cart.add(watch);
    expect(cart.count()).toBe(3);
    expect(cart.subtotal()).toBe(2250);
    cart.remove('p1');
    expect(cart.subtotal()).toBe(250);
    cart.clear();
    expect(cart.items()).toEqual([]);
  });

  it('persists to localStorage and restores on hydrate', () => {
    cart.add(phone, 2);
    expect(JSON.parse(localStorage.getItem(CART_STORAGE_KEY) ?? '[]').length).toBe(1);

    TestBed.resetTestingModule();
    const restored = TestBed.inject(CartService);
    expect(restored.count()).toBe(0);
    restored.hydrate();
    expect(restored.count()).toBe(2);
  });
});
