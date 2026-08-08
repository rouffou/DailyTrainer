import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { map, take } from 'rxjs';

import { AuthService } from './auth.service';

// Waits for the first (resolved) emission of authState$ rather than reading the
// currentUser signal synchronously — on a hard refresh / direct navigation, Firebase
// hasn't finished restoring the persisted session yet and the signal's initial value
// (null) would otherwise redirect an already-logged-in user to /login.
export const authGuard: CanActivateFn = () => {
  const authService = inject(AuthService);
  const router = inject(Router);

  return authService.authState$.pipe(
    take(1),
    map((user) => (user ? true : router.createUrlTree(['/login']))),
  );
};
