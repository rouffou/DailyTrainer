import { provideZonelessChangeDetection } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import {
  Auth,
  authState,
  createUserWithEmailAndPassword,
  FacebookAuthProvider,
  GoogleAuthProvider,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut,
} from '@angular/fire/auth';
import { of } from 'rxjs';

import { AuthService } from './auth.service';

jest.mock('@angular/fire/auth', () => ({
  Auth: class Auth {},
  authState: jest.fn(),
  createUserWithEmailAndPassword: jest.fn(),
  FacebookAuthProvider: jest.fn().mockImplementation(() => ({ providerId: 'facebook.com' })),
  GoogleAuthProvider: jest.fn().mockImplementation(() => ({ providerId: 'google.com' })),
  signInWithEmailAndPassword: jest.fn(),
  signInWithPopup: jest.fn(),
  signOut: jest.fn(),
}));

const authStateMock = jest.mocked(authState);
const createUserMock = jest.mocked(createUserWithEmailAndPassword);
const signInMock = jest.mocked(signInWithEmailAndPassword);
const signInWithPopupMock = jest.mocked(signInWithPopup);
const signOutMock = jest.mocked(signOut);

describe('AuthService', () => {
  let service: AuthService;

  beforeEach(() => {
    jest.clearAllMocks();
    authStateMock.mockReturnValue(of(null));

    TestBed.configureTestingModule({
      providers: [provideZonelessChangeDetection(), { provide: Auth, useValue: {} }],
    });

    service = TestBed.inject(AuthService);
  });

  it('signIn calls signInWithEmailAndPassword and returns ok on success', async () => {
    signInMock.mockResolvedValue({} as never);

    const result = await service.signIn('alice@example.com', 'hunter2');

    expect(signInMock).toHaveBeenCalledWith({}, 'alice@example.com', 'hunter2');
    expect(result).toEqual({ ok: true, value: undefined });
  });

  it('signIn returns a Result error instead of throwing when it fails', async () => {
    signInMock.mockRejectedValue(new Error('wrong password'));

    const result = await service.signIn('alice@example.com', 'wrong');

    expect(result).toEqual({ ok: false, error: new Error('wrong password') });
  });

  it('register calls createUserWithEmailAndPassword and returns ok on success', async () => {
    createUserMock.mockResolvedValue({} as never);

    const result = await service.register('bob@example.com', 'hunter2');

    expect(createUserMock).toHaveBeenCalledWith({}, 'bob@example.com', 'hunter2');
    expect(result).toEqual({ ok: true, value: undefined });
  });

  it('signInWithGoogle calls signInWithPopup with a GoogleAuthProvider', async () => {
    signInWithPopupMock.mockResolvedValue({} as never);

    const result = await service.signInWithGoogle();

    expect(GoogleAuthProvider).toHaveBeenCalled();
    expect(signInWithPopupMock).toHaveBeenCalledWith({}, { providerId: 'google.com' });
    expect(result).toEqual({ ok: true, value: undefined });
  });

  it('signInWithGoogle returns a Result error instead of throwing when it fails', async () => {
    signInWithPopupMock.mockRejectedValue(new Error('popup closed by user'));

    const result = await service.signInWithGoogle();

    expect(result).toEqual({ ok: false, error: new Error('popup closed by user') });
  });

  it('signInWithFacebook calls signInWithPopup with a FacebookAuthProvider', async () => {
    signInWithPopupMock.mockResolvedValue({} as never);

    const result = await service.signInWithFacebook();

    expect(FacebookAuthProvider).toHaveBeenCalled();
    expect(signInWithPopupMock).toHaveBeenCalledWith({}, { providerId: 'facebook.com' });
    expect(result).toEqual({ ok: true, value: undefined });
  });

  it('signInWithFacebook returns a Result error instead of throwing when it fails', async () => {
    signInWithPopupMock.mockRejectedValue(new Error('popup closed by user'));

    const result = await service.signInWithFacebook();

    expect(result).toEqual({ ok: false, error: new Error('popup closed by user') });
  });

  it('signOut calls the Firebase signOut function and returns ok on success', async () => {
    signOutMock.mockResolvedValue(undefined);

    const result = await service.signOut();

    expect(signOutMock).toHaveBeenCalledWith({});
    expect(result).toEqual({ ok: true, value: undefined });
  });

  it('exposes the current user from authState as a signal', () => {
    const user = { uid: 'alice' };
    authStateMock.mockReturnValue(of(user as never));
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      providers: [provideZonelessChangeDetection(), { provide: Auth, useValue: {} }],
    });

    const freshService = TestBed.inject(AuthService);

    expect(freshService.currentUser()).toEqual(user);
  });
});
