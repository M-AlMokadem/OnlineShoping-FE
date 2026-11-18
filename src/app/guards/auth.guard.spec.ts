/// <reference types="jasmine" />

import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { ActivatedRouteSnapshot, Router, RouterStateSnapshot, UrlTree, provideRouter } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { ToastService } from '../services/toast.service';
import { authGuard } from './auth.guard';

describe('authGuard', () => {
  const authenticated = signal(true);
  let permissions: string[];
  let roles: string[];

  beforeEach(() => {
    authenticated.set(true);
    permissions = [];
    roles = [];
    TestBed.configureTestingModule({
      providers: [
        provideRouter([]),
        { provide: ToastService, useValue: { showError: jasmine.createSpy('showError') } },
        {
          provide: AuthService,
          useValue: {
            isAuthenticated: authenticated,
            hasRole: (role: string) => roles.includes(role),
            hasAnyPermission: (required: string[]) => required.some((permission) => permissions.includes(permission))
          }
        }
      ]
    });
  });

  function run(data: Record<string, unknown>): boolean | UrlTree {
    const route = { data } as unknown as ActivatedRouteSnapshot;
    return TestBed.runInInjectionContext(() => authGuard(route, { url: '/products' } as RouterStateSnapshot)) as boolean | UrlTree;
  }

  it('allows a user holding any of the required permissions', () => {
    permissions = ['Products.View'];
    expect(run({ permissions: ['Categories.Manage', 'Products.View'] })).toBeTrue();
  });

  it('redirects home when no required permission is held', () => {
    permissions = ['Products.View'];
    const result = run({ permissions: ['Categories.Manage'] });
    expect(TestBed.inject(Router).serializeUrl(result as UrlTree)).toBe('/');
  });

  it('still supports role checks', () => {
    roles = ['Admin'];
    expect(run({ roles: ['Admin'] })).toBeTrue();
    roles = [];
    expect(run({ roles: ['Admin'] })).not.toBeTrue();
  });

  it('redirects anonymous users to login with the return url', () => {
    authenticated.set(false);
    const result = run({ permissions: ['Products.View'] });
    expect(TestBed.inject(Router).serializeUrl(result as UrlTree)).toBe('/login?returnUrl=%2Fproducts');
  });
});
