import { Component, inject, signal } from '@angular/core';
import { toObservable, toSignal } from '@angular/core/rxjs-interop';
import { MatIconModule } from '@angular/material/icon';
import { MatListModule } from '@angular/material/list';
import { MatToolbarModule } from '@angular/material/toolbar';
import { switchMap } from 'rxjs';

import { DailyLogRepository } from '../../core/data-access/daily-log.repository';

const ONE_DAY_MS = 24 * 60 * 60 * 1000;

function toIsoDate(value: Date): string {
  return value.toISOString().slice(0, 10);
}

function shiftDate(date: string, days: number): string {
  return toIsoDate(new Date(new Date(date).getTime() + days * ONE_DAY_MS));
}

@Component({
  selector: 'dt-day-page',
  imports: [MatToolbarModule, MatIconModule, MatListModule],
  templateUrl: './day.page.html',
  styleUrl: './day.page.css',
})
export class DayPage {
  private readonly dailyLogRepository = inject(DailyLogRepository);

  protected readonly selectedDate = signal(toIsoDate(new Date()));
  protected readonly dailyLog = toSignal(
    toObservable(this.selectedDate).pipe(switchMap((date) => this.dailyLogRepository.get(date))),
    { initialValue: undefined },
  );

  protected onDateInput(event: Event): void {
    this.selectedDate.set((event.target as HTMLInputElement).value);
  }

  protected goToToday(): void {
    this.selectedDate.set(toIsoDate(new Date()));
  }

  protected goToPreviousDay(): void {
    this.selectedDate.set(shiftDate(this.selectedDate(), -1));
  }

  protected goToNextDay(): void {
    this.selectedDate.set(shiftDate(this.selectedDate(), 1));
  }
}
