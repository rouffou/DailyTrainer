import { provideZonelessChangeDetection } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';

import { AuthService } from '../../core/auth/auth.service';
import { LoginPage } from './login.page';

describe('LoginPage', () => {
  let fixture: ComponentFixture<LoginPage>;
  let authService: jest.Mocked<
    Pick<AuthService, 'signIn' | 'signInWithGoogle' | 'signInWithFacebook'>
  >;

  beforeEach(async () => {
    authService = { signIn: jest.fn(), signInWithGoogle: jest.fn(), signInWithFacebook: jest.fn() };

    await TestBed.configureTestingModule({
      imports: [LoginPage],
      providers: [
        provideZonelessChangeDetection(),
        provideRouter([]),
        { provide: AuthService, useValue: authService },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(LoginPage);
  });

  it('creates', () => {
    expect(fixture.componentInstance).toBeTruthy();
  });

  it('signs in with the entered email and password on submit', async () => {
    authService.signIn.mockResolvedValue({ ok: true, value: undefined });
    const router = TestBed.inject(Router);
    jest.spyOn(router, 'navigateByUrl').mockResolvedValue(true);

    fixture.componentInstance['email'].set('alice@example.com');
    fixture.componentInstance['password'].set('secret123');

    await fixture.componentInstance['onSubmit']();

    expect(authService.signIn).toHaveBeenCalledWith('alice@example.com', 'secret123');
    expect(router.navigateByUrl).toHaveBeenCalledWith('/day');
  });

  it('shows an error message when sign-in fails', async () => {
    authService.signIn.mockResolvedValue({ ok: false, error: new Error('Invalid credentials') });

    await fixture.componentInstance['onSubmit']();

    expect(fixture.componentInstance['errorMessage']()).toBe('Invalid credentials');
  });

  it('signs in with Google and navigates to /day on success', async () => {
    authService.signInWithGoogle.mockResolvedValue({ ok: true, value: undefined });
    const router = TestBed.inject(Router);
    jest.spyOn(router, 'navigateByUrl').mockResolvedValue(true);

    await fixture.componentInstance['onGoogleSignIn']();

    expect(authService.signInWithGoogle).toHaveBeenCalled();
    expect(router.navigateByUrl).toHaveBeenCalledWith('/day');
  });

  it('shows an error message when Google sign-in fails', async () => {
    authService.signInWithGoogle.mockResolvedValue({
      ok: false,
      error: new Error('popup closed by user'),
    });

    await fixture.componentInstance['onGoogleSignIn']();

    expect(fixture.componentInstance['errorMessage']()).toBe('popup closed by user');
  });

  it('signs in with Facebook and navigates to /day on success', async () => {
    authService.signInWithFacebook.mockResolvedValue({ ok: true, value: undefined });
    const router = TestBed.inject(Router);
    jest.spyOn(router, 'navigateByUrl').mockResolvedValue(true);

    await fixture.componentInstance['onFacebookSignIn']();

    expect(authService.signInWithFacebook).toHaveBeenCalled();
    expect(router.navigateByUrl).toHaveBeenCalledWith('/day');
  });

  it('shows an error message when Facebook sign-in fails', async () => {
    authService.signInWithFacebook.mockResolvedValue({
      ok: false,
      error: new Error('popup closed by user'),
    });

    await fixture.componentInstance['onFacebookSignIn']();

    expect(fixture.componentInstance['errorMessage']()).toBe('popup closed by user');
  });
});
