/// <reference types="jasmine" />

import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { AuthService } from './auth.service';

describe('AuthService password recovery', () => {
  let service: AuthService;
  let httpTesting: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [provideHttpClient(), provideHttpClientTesting()] });
    service = TestBed.inject(AuthService);
    httpTesting = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpTesting.verify());

  it('posts the email to forgot-password', async () => {
    const pending = service.forgotPassword('a@x.com');
    const request = httpTesting.expectOne((req) => req.url.endsWith('/auth/forgot-password'));
    expect(request.request.method).toBe('POST');
    expect(request.request.body).toEqual({ email: 'a@x.com' });
    request.flush({});
    await pending;
  });

  it('posts email, token and new password to reset-password', async () => {
    const pending = service.resetPassword('a@x.com', 'tok', 'Passw0rd!');
    const request = httpTesting.expectOne((req) => req.url.endsWith('/auth/reset-password'));
    expect(request.request.body).toEqual({ email: 'a@x.com', token: 'tok', newPassword: 'Passw0rd!' });
    request.flush(null);
    await pending;
  });
});
