import { provideZonelessChangeDetection } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';

import { AuthService } from '../../core/auth/auth.service';
import { LoginPage } from './login.page';

describe('LoginPage', () => {
  let fixture: ComponentFixture<LoginPage>;
  let authService: jest.Mocked<Pick<AuthService, 'signIn'>>;

  beforeEach(async () => {
    authService = { signIn: jest.fn() };

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
});
