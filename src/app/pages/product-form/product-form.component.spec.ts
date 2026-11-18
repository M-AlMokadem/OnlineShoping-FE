/// <reference types="jasmine" />

import { signal } from '@angular/core';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { ActivatedRoute, convertToParamMap, provideRouter } from '@angular/router';
import { ProductStatus } from '../../models/product.model';
import { AuthService } from '../../services/auth.service';
import { ProductFormComponent } from './product-form.component';

function productPayload(status: ProductStatus) {
  return {
    id: 'p1', name: 'Phone', nameAr: '', sku: 'SKU-1', shortDescription: '', shortDescriptionAr: '', description: '', descriptionAr: '',
    categoryId: 'c1', categoryName: 'Phones', categoryNameAr: '', brandId: 'b1', brandName: 'Acme', price: 10, originalPrice: null, currency: 'EGP',
    stockQuantity: 2, availability: 'InStock', imageUrl: null, specifications: {}, status,
    createdOn: '2026-01-01T00:00:00Z', lastUpdatedOn: '2026-01-01T00:00:00Z', lastUpdatedBy: 'admin'
  };
}

describe('ProductFormComponent', () => {
  let httpTesting: HttpTestingController;

  async function render(status: ProductStatus, permissions: string[], readiness = { isReady: false, missingFields: ['price', 'image'] }) {
    TestBed.configureTestingModule({
      imports: [ProductFormComponent],
      providers: [
        provideRouter([]),
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: ActivatedRoute, useValue: { snapshot: { paramMap: convertToParamMap({ id: 'p1' }) } } },
        { provide: AuthService, useValue: { hasPermission: (permission: string) => permissions.includes(permission), currentUser: signal(null) } }
      ]
    });
    httpTesting = TestBed.inject(HttpTestingController);
    const fixture = TestBed.createComponent(ProductFormComponent);
    fixture.detectChanges();

    httpTesting.expectOne((req) => req.url.endsWith('/categories')).flush({ success: true, data: [] });
    httpTesting.expectOne((req) => req.url.endsWith('/brands')).flush({ success: true, data: [] });
    httpTesting.expectOne('http://localhost:5186/api/products/p1').flush({ success: true, data: productPayload(status) });
    await fixture.whenStable();
    httpTesting.expectOne('http://localhost:5186/api/products/p1/readiness').flush({ success: true, data: readiness });
    httpTesting.expectOne('http://localhost:5186/api/products/p1/audit').flush({ success: true, data: [] });
    await new Promise((resolve) => setTimeout(resolve));
    fixture.detectChanges();
    return fixture.nativeElement as HTMLElement;
  }

  const actions = (element: HTMLElement) => Array.from(element.querySelectorAll('[data-action]')).map((node) => node.getAttribute('data-action'));

  afterEach(() => httpTesting.verify());

  it('lists the missing readiness fields translated', async () => {
    const element = await render('Draft', ['Products.View', 'Products.Edit']);
    const items = Array.from(element.querySelectorAll('[data-testid="readiness"] li')).map((node) => node.textContent?.trim());
    expect(items).toEqual(['Price', 'Main image']);
  });

  it('shows only the status actions the permissions allow', async () => {
    const element = await render('Draft', ['Products.View', 'Products.Edit']);
    expect(actions(element)).toEqual(['Inactive']);
  });

  it('offers publish and archive to an approver on a draft', async () => {
    const element = await render('Draft', ['Products.View', 'Products.Publish', 'Products.Archive']);
    expect(actions(element)).toEqual(['Published', 'Inactive', 'Archived']);
  });

  it('shows restore and a read-only form for archived products', async () => {
    const element = await render('Archived', ['Products.View', 'Products.Edit', 'Products.Archive']);
    expect(actions(element)).toEqual(['Inactive']);
    expect(element.querySelector('[data-testid="archived-notice"]')).not.toBeNull();
    expect(element.querySelector('button[type="submit"]')).toBeNull();
    expect((element.querySelector('input[formcontrolname="name"]') as HTMLInputElement).disabled).toBeTrue();
  });

  it('disables the SKU field without Products.EditSku', async () => {
    const element = await render('Draft', ['Products.View', 'Products.Edit']);
    expect((element.querySelector('input[formcontrolname="sku"]') as HTMLInputElement).disabled).toBeTrue();
    expect((element.querySelector('input[formcontrolname="name"]') as HTMLInputElement).disabled).toBeFalse();
  });
});
