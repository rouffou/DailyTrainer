import { Injectable, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import {
  Auth,
  authState,
  createUserWithEmailAndPassword,
  FacebookAuthProvider,
  GoogleAuthProvider,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut,
  User,
} from '@angular/fire/auth';

import type { Result } from '../models/result.model';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly auth = inject(Auth);

  readonly authState$ = authState(this.auth);
  readonly currentUser = toSignal<User | null>(this.authState$, { initialValue: null });

  async signIn(email: string, password: string): Promise<Result<void>> {
    return this.run(() => signInWithEmailAndPassword(this.auth, email, password));
  }

  async register(email: string, password: string): Promise<Result<void>> {
    return this.run(() => createUserWithEmailAndPassword(this.auth, email, password));
  }

  // Firebase creates the account on first sign-in automatically — no separate "register with
  // Google/Facebook" flow needed, unlike email/password.
  async signInWithGoogle(): Promise<Result<void>> {
    return this.run(() => signInWithPopup(this.auth, new GoogleAuthProvider()));
  }

  async signInWithFacebook(): Promise<Result<void>> {
    return this.run(() => signInWithPopup(this.auth, new FacebookAuthProvider()));
  }

  async signOut(): Promise<Result<void>> {
    return this.run(() => signOut(this.auth));
  }

  private async run(operation: () => Promise<unknown>): Promise<Result<void>> {
    try {
      await operation();
      return { ok: true, value: undefined };
    } catch (error) {
      return { ok: false, error: error instanceof Error ? error : new Error(String(error)) };
    }
  }
}
