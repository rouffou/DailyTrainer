import { Component, input } from '@angular/core';

// DailyTrainer_CHARTE_GRAPHIQUE.md section 7 — mark (filled circle + checkmark, brand green)
// always renders; the wordmark is dropped in the 'mark' variant (favicon/app-icon usage,
// anywhere the full horizontal lockup wouldn't fit).
@Component({
  selector: 'dt-logo',
  imports: [],
  templateUrl: './logo.component.html',
  styleUrl: './logo.component.css',
})
export class LogoComponent {
  readonly variant = input<'full' | 'mark'>('full');
}
