import { Injectable, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import {
  Auth,
  authState,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  User,
} from '@angular/fire/auth';

import type { Result } from '../models/result.model';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly auth = inject(Auth);

  readonly currentUser = toSignal<User | null>(authState(this.auth), { initialValue: null });

  async signIn(email: string, password: string): Promise<Result<void>> {
    return this.run(() => signInWithEmailAndPassword(this.auth, email, password));
  }

  async register(email: string, password: string): Promise<Result<void>> {
    return this.run(() => createUserWithEmailAndPassword(this.auth, email, password));
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
