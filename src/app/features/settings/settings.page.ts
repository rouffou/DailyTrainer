import { Component, inject, signal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatRadioModule } from '@angular/material/radio';
import { MatSelectModule } from '@angular/material/select';
import { MatToolbarModule } from '@angular/material/toolbar';

import { DailyLogRepository } from '../../core/data-access/daily-log.repository';
import { computePersonalizedTargets } from '../../core/domain/targets';
import type {
  ActivityLevel,
  BiologicalSex,
  UserProfile,
} from '../../core/models/user-profile.model';

interface ActivityLevelOption {
  value: ActivityLevel;
  label: string;
}

const ACTIVITY_LEVEL_OPTIONS: readonly ActivityLevelOption[] = [
  { value: 'sedentary', label: 'Sédentaire (peu ou pas d’exercice)' },
  { value: 'light', label: 'Légèrement actif (1-3 jours/semaine)' },
  { value: 'moderate', label: 'Modérément actif (3-5 jours/semaine)' },
  { value: 'active', label: 'Actif (6-7 jours/semaine)' },
  { value: 'veryActive', label: 'Très actif (sport intense quotidien)' },
];

function toIsoDate(value: Date): string {
  return value.toISOString().slice(0, 10);
}

@Component({
  selector: 'dt-settings-page',
  imports: [
    MatToolbarModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatRadioModule,
    MatSelectModule,
    MatButtonModule,
  ],
  templateUrl: './settings.page.html',
  styleUrl: './settings.page.css',
})
export class SettingsPage {
  private readonly dailyLogRepository = inject(DailyLogRepository);

  protected readonly activityLevelOptions = ACTIVITY_LEVEL_OPTIONS;

  protected readonly age = signal(30);
  protected readonly weightKg = signal(70);
  protected readonly heightCm = signal(170);
  protected readonly sex = signal<BiologicalSex>('female');
  protected readonly activityLevel = signal<ActivityLevel>('sedentary');

  protected readonly isSubmitting = signal(false);
  protected readonly errorMessage = signal<string | null>(null);
  protected readonly savedTargetsKcal = signal<number | null>(null);

  protected onAgeInput(event: Event): void {
    this.age.set(Number((event.target as HTMLInputElement).value));
  }

  protected onWeightInput(event: Event): void {
    this.weightKg.set(Number((event.target as HTMLInputElement).value));
  }

  protected onHeightInput(event: Event): void {
    this.heightCm.set(Number((event.target as HTMLInputElement).value));
  }

  protected async onSubmit(): Promise<void> {
    this.isSubmitting.set(true);
    this.errorMessage.set(null);
    this.savedTargetsKcal.set(null);

    const profile: UserProfile = {
      age: this.age(),
      weightKg: this.weightKg(),
      heightCm: this.heightCm(),
      sex: this.sex(),
      activityLevel: this.activityLevel(),
    };
    const targets = computePersonalizedTargets(profile);

    const result = await this.dailyLogRepository.upsert(toIsoDate(new Date()), { targets });

    this.isSubmitting.set(false);
    if (!result.ok) {
      this.errorMessage.set(result.error.message);
      return;
    }
    this.savedTargetsKcal.set(Math.round(targets.kcal));
  }
}
