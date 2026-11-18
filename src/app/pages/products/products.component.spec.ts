/// <reference types="jasmine" />

import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { Router, provideRouter } from '@angular/router';
import { DEFAULT_PRODUCT_QUERY } from '../../models/product.model';
import { ProductsComponent, parseProductQuery, toQueryParams } from './products.component';

const emptyPage = { success: true, statusCode: 200, message: '', data: { items: [], totalCount: 0, pageNumber: 1, pageSize: 20, totalPages: 1 } };

describe('product list query params', () => {
  it('round-trips non-default state and omits defaults', () => {
    const query = { ...DEFAULT_PRODUCT_QUERY, search: 'abc', status: 'Draft' as const, sortBy: 'price' as const, sortDirection: 'asc' as const, pageSize: 50, pageNumber: 3 };
    const params = toQueryParams(query);
    expect(params).toEqual({ search: 'abc', status: 'Draft', sortBy: 'price', sortDirection: 'asc', pageSize: 50, page: 3 });
    expect(parseProductQuery(new URLSearchParams(Object.entries(params).map(([k, v]) => [k, String(v)])))).toEqual(query);
    expect(toQueryParams(DEFAULT_PRODUCT_QUERY)).toEqual({});
  });

  it('falls back to defaults for invalid values', () => {
    const parsed = parseProductQuery(new URLSearchParams('pageSize=7&page=-1&status=Nope&sortBy=x'));
    expect(parsed).toEqual(DEFAULT_PRODUCT_QUERY);
  });
});

describe('ProductsComponent', () => {
  let httpTesting: HttpTestingController;
  let router: Router;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [ProductsComponent],
      providers: [provideRouter([{ path: 'products', component: ProductsComponent }]), provideHttpClient(), provideHttpClientTesting()]
    });
    httpTesting = TestBed.inject(HttpTestingController);
    router = TestBed.inject(Router);
  });

  it('loads using the query params from the URL and syncs filter changes back to the URL', async () => {
    await router.navigateByUrl('/products?status=Draft&page=2&pageSize=50');
    const fixture = TestBed.createComponent(ProductsComponent);
    fixture.detectChanges();
    await fixture.whenStable();

    const list = httpTesting.expectOne((req) => req.url === 'http://localhost:5186/api/products');
    expect(list.request.params.get('status')).toBe('Draft');
    expect(list.request.params.get('pageNumber')).toBe('2');
    expect(list.request.params.get('pageSize')).toBe('50');
    list.flush(emptyPage);
    httpTesting.match((req) => req.url.endsWith('/categories') || req.url.endsWith('/brands')).forEach((req) => req.flush({ success: true, data: [] }));

    (fixture.componentInstance as unknown as { setFilter(key: string, value: string): void }).setFilter('availability', 'OutOfStock');
    await fixture.whenStable();

    expect(router.url).toContain('availability=OutOfStock');
    expect(router.url).toContain('status=Draft');
    expect(router.url).toContain('pageSize=50');
    expect(router.url).not.toContain('page=2');

    const reload = httpTesting.expectOne((req) => req.url === 'http://localhost:5186/api/products');
    expect(reload.request.params.get('availability')).toBe('OutOfStock');
    expect(reload.request.params.get('pageNumber')).toBe('1');
    reload.flush(emptyPage);
  });
});
