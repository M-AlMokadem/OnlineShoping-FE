/// <reference types="jasmine" />

import { signal } from '@angular/core';
import { provideHttpClient } from '@angular/common/http';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { AdminLayoutComponent, adminTitleKey } from './admin-layout.component';

describe('AdminLayoutComponent', () => {
  function render(permissions: string[]): HTMLElement {
    TestBed.configureTestingModule({
      imports: [AdminLayoutComponent],
      providers: [
        provideRouter([]),
        provideHttpClient(),
        {
          provide: AuthService,
          useValue: {
            hasPermission: (permission: string) => permissions.includes(permission),
            currentUser: signal({ fullName: 'Ada Admin', roles: ['Seller'], permissions })
          }
        }
      ]
    });
    const fixture = TestBed.createComponent(AdminLayoutComponent);
    fixture.detectChanges();
    return fixture.nativeElement as HTMLElement;
  }

  const links = (element: HTMLElement) => Array.from(element.querySelectorAll('a.nav-item')).map((node) => node.getAttribute('href'));

  it('shows only the sections the permissions allow', () => {
    expect(links(render(['Products.View']))).toEqual(['/admin', '/admin/products']);
  });

  it('shows management sections for admins and lists the coming-soon items as disabled', () => {
    const element = render(['Products.View', 'Categories.Manage', 'Brands.Manage', 'Users.Manage']);
    expect(links(element)).toEqual(['/admin', '/admin/products', '/admin/categories', '/admin/brands', '/admin/users']);
    expect(element.querySelectorAll('.nav-item.disabled').length).toBe(6);
    expect(element.querySelector('.user-text')?.textContent).toContain('Ada Admin');
  });

  it('derives the page title from the URL', () => {
    expect(adminTitleKey('/admin')).toBe('adm.title.dashboard');
    expect(adminTitleKey('/admin/products?page=2')).toBe('adm.title.products');
    expect(adminTitleKey('/admin/products/new')).toBe('adm.title.productNew');
    expect(adminTitleKey('/admin/products/abc')).toBe('adm.title.productEdit');
  });
});
