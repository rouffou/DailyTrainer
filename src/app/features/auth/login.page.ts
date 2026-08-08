import { Component, inject, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';

import { AuthService } from '../../core/auth/auth.service';

@Component({
  selector: 'dt-login-page',
  imports: [RouterLink],
  templateUrl: './login.page.html',
  styleUrl: './auth-form.css',
})
export class LoginPage {
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);

  protected readonly email = signal('');
  protected readonly password = signal('');
  protected readonly isSubmitting = signal(false);
  protected readonly errorMessage = signal<string | null>(null);

  protected onEmailInput(event: Event): void {
    this.email.set((event.target as HTMLInputElement).value);
  }

  protected onPasswordInput(event: Event): void {
    this.password.set((event.target as HTMLInputElement).value);
  }

  protected async onSubmit(): Promise<void> {
    this.isSubmitting.set(true);
    this.errorMessage.set(null);

    const result = await this.authService.signIn(this.email(), this.password());

    this.isSubmitting.set(false);
    if (!result.ok) {
      this.errorMessage.set(result.error.message);
      return;
    }
    await this.router.navigateByUrl('/day');
  }
}
