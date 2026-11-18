/// <reference types="jasmine" />

import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { DEFAULT_PRODUCT_QUERY } from '../models/product.model';
import { ProductRequest, ProductsApiService } from './products-api.service';

describe('ProductsApiService', () => {
  let service: ProductsApiService;
  let httpTesting: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [ProductsApiService, provideHttpClient(), provideHttpClientTesting()] });
    service = TestBed.inject(ProductsApiService);
    httpTesting = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpTesting.verify());

  it('sends list filters, sorting and paging as query params', () => {
    service.getPaged({
      ...DEFAULT_PRODUCT_QUERY,
      search: ' phone ',
      categoryId: 'cat-1',
      status: 'Draft',
      sortBy: 'price',
      sortDirection: 'asc',
      pageSize: 50,
      pageNumber: 2
    }).subscribe((result) => {
      expect(result.success).toBeTrue();
      expect(result.data.items[0].name).toBe('Phone');
    });

    const request = httpTesting.expectOne((req) => req.url === 'http://localhost:5186/api/products');
    expect(request.request.method).toBe('GET');
    expect(request.request.params.get('search')).toBe('phone');
    expect(request.request.params.get('categoryId')).toBe('cat-1');
    expect(request.request.params.get('status')).toBe('Draft');
    expect(request.request.params.get('sortBy')).toBe('price');
    expect(request.request.params.get('sortDirection')).toBe('asc');
    expect(request.request.params.get('pageSize')).toBe('50');
    expect(request.request.params.get('pageNumber')).toBe('2');
    expect(request.request.params.has('brandId')).toBeFalse();
    request.flush({ success: true, statusCode: 200, message: '', data: { items: [{ id: 'p', name: 'Phone' }], totalCount: 1, pageNumber: 2, pageSize: 50, totalPages: 1 } });
  });

  it('creates a product and changes its status', () => {
    const payload: ProductRequest = {
      name: 'New Product', nameAr: '', sku: 'SKU-1', shortDescription: '', shortDescriptionAr: '', description: '', descriptionAr: '',
      categoryId: null, brandId: null, price: 12.5, originalPrice: null, stockQuantity: 3, imageUrl: null, specifications: { Storage: '128 GB' }
    };
    service.create(payload).subscribe();
    const create = httpTesting.expectOne('http://localhost:5186/api/products');
    expect(create.request.method).toBe('POST');
    expect(create.request.body).toEqual(payload);
    create.flush({ success: true, statusCode: 201, data: { id: 'p' } });

    service.setStatus('p', 'Published').subscribe();
    const status = httpTesting.expectOne('http://localhost:5186/api/products/p/status');
    expect(status.request.method).toBe('PUT');
    expect(status.request.body).toEqual({ status: 'Published' });
    status.flush({ success: true, statusCode: 200, data: { id: 'p' } });
  });

  it('reads readiness and audit history', () => {
    service.getReadiness('p').subscribe((result) => expect(result.data.missingFields).toEqual(['price']));
    httpTesting.expectOne('http://localhost:5186/api/products/p/readiness').flush({ success: true, data: { isReady: false, missingFields: ['price'] } });
    service.getAudit('p').subscribe((result) => expect(result.data).toEqual([]));
    httpTesting.expectOne('http://localhost:5186/api/products/p/audit').flush({ success: true, data: [] });
  });
});
