import { provideZonelessChangeDetection } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import {
  ActivatedRouteSnapshot,
  provideRouter,
  Router,
  RouterStateSnapshot,
  UrlTree,
} from '@angular/router';
import { firstValueFrom, Observable, of } from 'rxjs';
import { User } from '@angular/fire/auth';

import { AuthService } from './auth.service';
import { authGuard } from './auth.guard';

describe('authGuard', () => {
  const route = {} as ActivatedRouteSnapshot;
  const state = {} as RouterStateSnapshot;

  function setup(authState$: Observable<User | null>): void {
    TestBed.configureTestingModule({
      providers: [
        provideZonelessChangeDetection(),
        provideRouter([]),
        { provide: AuthService, useValue: { authState$ } },
      ],
    });
  }

  function runGuard(): Promise<boolean | UrlTree> {
    return TestBed.runInInjectionContext(() =>
      firstValueFrom(authGuard(route, state) as Observable<boolean | UrlTree>),
    );
  }

  it('allows navigation when a user is signed in', async () => {
    setup(of({ uid: 'alice' } as User));

    expect(await runGuard()).toBe(true);
  });

  it('redirects to /login when no user is signed in', async () => {
    setup(of(null));

    const result = await runGuard();

    expect(result).toBeInstanceOf(UrlTree);
    const router = TestBed.inject(Router);
    expect(router.serializeUrl(result as UrlTree)).toBe('/login');
  });
});
