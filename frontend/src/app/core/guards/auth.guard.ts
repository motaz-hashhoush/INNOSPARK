import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { catchError, map, of } from 'rxjs';
import { AuthService } from '../services/auth.service';

export const authGuard: CanActivateFn = (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  if (authService.isLoggedIn()) {
    return true;
  }

  router.navigate(['/auth/login'], { queryParams: { returnUrl: state.url } });
  return false;
};

/** Guard factory: only allows users whose role is in the given list. */
export const roleGuard = (...roles: string[]): CanActivateFn => (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  if (!authService.isLoggedIn()) {
    router.navigate(['/auth/login'], { queryParams: { returnUrl: state.url } });
    return false;
  }

  const user = authService.currentUser;
  if (user) {
    if (roles.includes(user.role)) return true;
    router.navigate(['/booth']);
    return false;
  }

  // User not loaded yet (e.g. page refresh) — resolve from the API first
  return authService.getMe().pipe(
    map(u => {
      if (roles.includes(u.role)) return true;
      router.navigate(['/booth']);
      return false;
    }),
    catchError(() => {
      router.navigate(['/auth/login'], { queryParams: { returnUrl: state.url } });
      return of(false);
    }),
  );
};
