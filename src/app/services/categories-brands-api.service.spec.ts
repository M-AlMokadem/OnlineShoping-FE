/// <reference types="jasmine" />

import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { BrandsApiService } from './brands-api.service';
import { CategoriesApiService } from './categories-api.service';

describe('Categories and brands API services', () => {
  let httpTesting: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [provideHttpClient(), provideHttpClientTesting()] });
    httpTesting = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpTesting.verify());

  it('lists categories with the archive and active flags', () => {
    TestBed.inject(CategoriesApiService).getAll(true, true).subscribe((result) => expect(result.data.length).toBe(1));
    const request = httpTesting.expectOne((req) => req.url === 'http://localhost:5186/api/categories');
    expect(request.request.params.get('includeArchived')).toBe('true');
    expect(request.request.params.get('activeOnly')).toBe('true');
    request.flush({ success: true, statusCode: 200, data: [{ id: 'c' }] });
  });

  it('reorders, activates, archives and restores categories', () => {
    const service = TestBed.inject(CategoriesApiService);
    service.reorder(['b', 'a']).subscribe();
    const reorder = httpTesting.expectOne('http://localhost:5186/api/categories/reorder');
    expect(reorder.request.method).toBe('PUT');
    expect(reorder.request.body).toEqual({ ids: ['b', 'a'] });
    reorder.flush({ success: true, data: [] });

    service.setActive('a', false).subscribe();
    const active = httpTesting.expectOne('http://localhost:5186/api/categories/a/active');
    expect(active.request.body).toEqual({ isActive: false });
    active.flush({ success: true, data: {} });

    service.archive('a').subscribe();
    httpTesting.expectOne('http://localhost:5186/api/categories/a/archive').flush({ success: true, data: {} });
    service.restore('a').subscribe();
    httpTesting.expectOne('http://localhost:5186/api/categories/a/restore').flush({ success: true, data: {} });
  });

  it('manages brands including delete', () => {
    const service = TestBed.inject(BrandsApiService);
    service.getAll(true).subscribe();
    const list = httpTesting.expectOne((req) => req.url === 'http://localhost:5186/api/brands');
    expect(list.request.params.get('activeOnly')).toBe('true');
    list.flush({ success: true, data: [] });

    service.create({ name: 'Acme', description: '', logoUrl: null, isActive: true }).subscribe();
    const create = httpTesting.expectOne('http://localhost:5186/api/brands');
    expect(create.request.method).toBe('POST');
    create.flush({ success: true, data: {} });

    service.remove('b').subscribe();
    const remove = httpTesting.expectOne('http://localhost:5186/api/brands/b');
    expect(remove.request.method).toBe('DELETE');
    remove.flush({ success: true, data: true });
  });
});
