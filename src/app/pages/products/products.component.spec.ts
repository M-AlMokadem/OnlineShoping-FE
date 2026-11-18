/// <reference types="jasmine" />

import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { AuthService } from '../../services/auth.service';
import { ProductsComponent } from './products.component';

async function render(roles: string[]): Promise<HTMLElement> {
  TestBed.configureTestingModule({
    imports: [ProductsComponent],
    providers: [
      provideHttpClient(),
      provideHttpClientTesting(),
      provideNoopAnimations(),
      { provide: AuthService, useValue: { hasRole: (role: string) => roles.includes(role) } }
    ]
  });
  const httpTesting = TestBed.inject(HttpTestingController);
  const fixture = TestBed.createComponent(ProductsComponent);
  fixture.detectChanges();

  httpTesting.expectOne((req) => req.url.endsWith('/products')).flush({
    success: true,
    statusCode: 200,
    data: {
      items: [{
        id: 'p1', name: 'Phone', nameAr: '', description: '', descriptionAr: '', brand: 'Samsung', category: 'MobilePhone',
        price: 1000, currency: 'EGP', availability: 'InStock', imageUrl: null, specifications: {}, sourceName: 'S', sourceUrl: null,
        verificationStatus: 'Pending', verifiedOn: null, isActive: true
      }],
      totalCount: 1, pageNumber: 1, pageSize: 10, totalPages: 1, hasNextPage: false, hasPreviousPage: false
    }
  });
  await fixture.whenStable();
  fixture.detectChanges();
  return fixture.nativeElement as HTMLElement;
}

describe('ProductsComponent role-based actions', () => {
  it('lets a seller edit but not verify or delete', async () => {
    const text = (await render(['Seller'])).querySelector('td.row-actions')?.textContent ?? '';
    expect(text).toContain('Edit');
    expect(text).not.toContain('Verify');
    expect(text).not.toContain('Delete');
  });

  it('lets an admin verify and delete', async () => {
    const text = (await render(['Admin'])).querySelector('td.row-actions')?.textContent ?? '';
    expect(text).toContain('Verify');
    expect(text).toContain('Delete');
  });
});
