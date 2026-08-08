import { Component, computed, inject, signal } from '@angular/core';
import { toObservable, toSignal } from '@angular/core/rxjs-interop';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatToolbarModule } from '@angular/material/toolbar';
import { switchMap } from 'rxjs';

import { DailyLogRepository } from '../../core/data-access/daily-log.repository';

const ONE_DAY_MS = 24 * 60 * 60 * 1000;
const DEFAULT_RANGE_DAYS = 6;

function toIsoDate(value: Date): string {
  return value.toISOString().slice(0, 10);
}

function daysAgo(days: number): string {
  return toIsoDate(new Date(Date.now() - days * ONE_DAY_MS));
}

@Component({
  selector: 'dt-history-page',
  imports: [MatToolbarModule, MatFormFieldModule, MatInputModule],
  templateUrl: './history.page.html',
  styleUrl: './history.page.css',
})
export class HistoryPage {
  private readonly dailyLogRepository = inject(DailyLogRepository);

  protected readonly fromDate = signal(daysAgo(DEFAULT_RANGE_DAYS));
  protected readonly toDate = signal(daysAgo(0));

  private readonly range = computed(() => ({ from: this.fromDate(), to: this.toDate() }));

  protected readonly dailyLogs = toSignal(
    toObservable(this.range).pipe(
      switchMap(({ from, to }) => this.dailyLogRepository.getRange(from, to)),
    ),
    { initialValue: [] },
  );

  protected onFromDateInput(event: Event): void {
    this.fromDate.set((event.target as HTMLInputElement).value);
  }

  protected onToDateInput(event: Event): void {
    this.toDate.set((event.target as HTMLInputElement).value);
  }
}
