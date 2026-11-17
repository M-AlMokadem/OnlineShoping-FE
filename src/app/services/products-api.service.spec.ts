/// <reference types="jasmine" />

import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { ProductsApiService } from './products-api.service';

describe('ProductsApiService', () => {
  let service: ProductsApiService;
  let httpTesting: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        ProductsApiService,
        provideHttpClient(),
        provideHttpClientTesting()
      ]
    });

    service = TestBed.inject(ProductsApiService);
    httpTesting = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpTesting.verify());

  it('normalizes a paged product response from the API wrapper', () => {
    service.getPaged(1, 10, 'notebook').subscribe((result) => {
      expect(result.success).toBeTrue();
      expect(result.statusCode).toBe(200);
      expect(result.data.items[0].name).toBe('Blue Notebook');
    });

    const request = httpTesting.expectOne((request) => request.url === 'http://localhost:5186/api/products');
    expect(request.request.method).toBe('GET');
    expect(request.request.params.get('SearchedValue')).toBe('notebook');
    expect(request.request.params.get('PageNumber')).toBe('1');
    expect(request.request.params.get('PageSize')).toBe('10');
    request.flush({
      success: true,
      statusCode: 200,
      message: 'Products retrieved successfully.',
      data: {
        items: [{
          id: 'product-id',
          name: 'Blue Notebook',
          description: 'A notebook',
          price: 5,
          isActive: true
        }],
        totalCount: 1,
        pageNumber: 1,
        pageSize: 10,
        totalPages: 1,
        hasNextPage: false,
        hasPreviousPage: false
      }
    });
  });

  it('sends a product create request to the products endpoint', () => {
    service.create({ name: 'New Product', description: 'Description', price: 12.5 }).subscribe();

    const request = httpTesting.expectOne('http://localhost:5186/api/products');
    expect(request.request.method).toBe('POST');
    expect(request.request.body).toEqual({
      name: 'New Product',
      description: 'Description',
      price: 12.5
    });
    request.flush({
      success: true,
      statusCode: 201,
      data: {
        id: 'product-id',
        name: 'New Product',
        description: 'Description',
        price: 12.5,
        isActive: true
      }
    });
  });
});
