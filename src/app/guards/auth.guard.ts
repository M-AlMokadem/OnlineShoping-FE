import { CanActivateFn, Router } from '@angular/router';
import { PLATFORM_ID, inject } from '@angular/core';
import { isPlatformServer } from '@angular/common';
import { AuthService } from '../services/auth.service';
import { ToastService } from '../services/toast.service';

export const authGuard: CanActivateFn = (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);
  const toastService = inject(ToastService);

  // The session lives in localStorage, so protected pages are resolved in the browser only.
  if (isPlatformServer(inject(PLATFORM_ID))) {
    return false;
  }

  if (!authService.isAuthenticated()) {
    toastService.showError('Please sign in to access this page.');
    return router.createUrlTree(['/login'], {
      queryParams: { returnUrl: state.url }
    });
  }

  const requiredRoles = route.data?.['roles'] as string[] | undefined;
  const requiredPermissions = route.data?.['permissions'] as string[] | undefined;
  const rolesOk = !requiredRoles?.length || requiredRoles.some((role) => authService.hasRole(role));
  const permissionsOk = !requiredPermissions?.length || authService.hasAnyPermission(requiredPermissions);

  if (!rolesOk || !permissionsOk) {
    toastService.showError('You do not have permission to access this page.');
    return router.createUrlTree(['/']);
  }

  return true;
};
