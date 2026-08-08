import { provideZonelessChangeDetection } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';

import { AuthService } from '../../core/auth/auth.service';
import { RegisterPage } from './register.page';

describe('RegisterPage', () => {
  let fixture: ComponentFixture<RegisterPage>;
  let authService: jest.Mocked<Pick<AuthService, 'register'>>;

  beforeEach(async () => {
    authService = { register: jest.fn() };

    await TestBed.configureTestingModule({
      imports: [RegisterPage],
      providers: [
        provideZonelessChangeDetection(),
        provideRouter([]),
        { provide: AuthService, useValue: authService },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(RegisterPage);
  });

  it('creates', () => {
    expect(fixture.componentInstance).toBeTruthy();
  });

  it('registers with the entered email and password on submit', async () => {
    authService.register.mockResolvedValue({ ok: true, value: undefined });
    const router = TestBed.inject(Router);
    jest.spyOn(router, 'navigateByUrl').mockResolvedValue(true);

    fixture.componentInstance['email'].set('alice@example.com');
    fixture.componentInstance['password'].set('secret123');

    await fixture.componentInstance['onSubmit']();

    expect(authService.register).toHaveBeenCalledWith('alice@example.com', 'secret123');
    expect(router.navigateByUrl).toHaveBeenCalledWith('/day');
  });

  it('shows an error message when registration fails', async () => {
    authService.register.mockResolvedValue({ ok: false, error: new Error('Email already in use') });

    await fixture.componentInstance['onSubmit']();

    expect(fixture.componentInstance['errorMessage']()).toBe('Email already in use');
  });
});
