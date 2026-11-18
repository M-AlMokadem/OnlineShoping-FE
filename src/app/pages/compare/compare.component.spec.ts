/// <reference types="jasmine" />

import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { ProductDto } from '../../models/product.model';
import { CompareSelectionService } from '../../services/compare-selection.service';
import { CompareComponent } from './compare.component';

function product(id: string, specifications: Record<string, string>, price = 1000): ProductDto {
  return {
    id,
    name: `Phone ${id}`,
    nameAr: '',
    sku: `SKU-${id}`,
    shortDescription: '',
    shortDescriptionAr: '',
    description: '',
    descriptionAr: '',
    categoryId: 'cat-1',
    categoryName: 'Phones',
    categoryNameAr: '',
    brandId: 'brand-1',
    brandName: 'Samsung',
    price,
    originalPrice: null,
    currency: 'EGP',
    stockQuantity: 5,
    availability: 'InStock',
    imageUrl: null,
    specifications,
    status: 'Published',
    createdOn: '2026-01-01T00:00:00Z',
    lastUpdatedOn: '2026-01-01T00:00:00Z',
    lastUpdatedBy: 'admin'
  };
}

describe('CompareComponent', () => {
  let httpTesting: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [CompareComponent],
      providers: [provideRouter([]), provideHttpClient(), provideHttpClientTesting()]
    });
    httpTesting = TestBed.inject(HttpTestingController);
  });

  it('highlights only the rows whose values differ', async () => {
    const selection = TestBed.inject(CompareSelectionService);
    selection.add({ id: 'a', categoryId: 'cat-1' });
    selection.add({ id: 'b', categoryId: 'cat-1' });

    const fixture = TestBed.createComponent(CompareComponent);
    fixture.detectChanges();

    const request = httpTesting.expectOne((req) => req.url.endsWith('/catalogue/compare'));
    request.flush({
      success: true,
      statusCode: 200,
      data: [product('a', { RAM: '8 GB', Storage: '128 GB' }), product('b', { RAM: '8 GB', Storage: '256 GB' }, 1200)]
    });
    await fixture.whenStable();
    fixture.detectChanges();

    const rows = (fixture.componentInstance as unknown as { rows(): { label: string; differs: boolean }[] }).rows();
    expect(rows.find((row) => row.label === 'RAM')?.differs).toBeFalse();
    expect(rows.find((row) => row.label === 'Storage')?.differs).toBeTrue();
    expect(rows.find((row) => row.label === 'Price')?.differs).toBeTrue();
    expect(rows.find((row) => row.label === 'Brand')?.differs).toBeFalse();
  });

  it('does not call the API with fewer than two products', () => {
    const fixture = TestBed.createComponent(CompareComponent);
    fixture.detectChanges();
    httpTesting.expectNone((req) => req.url.endsWith('/catalogue/compare'));
    expect(TestBed.inject(CompareSelectionService).count()).toBe(0);
  });
});
