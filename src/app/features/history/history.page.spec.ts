import { provideZonelessChangeDetection } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { of } from 'rxjs';

import { DailyLogRepository } from '../../core/data-access/daily-log.repository';
import type { DailyLogDocument } from '../../core/data-access/daily-log.repository';
import { HistoryPage } from './history.page';

describe('HistoryPage', () => {
  let fixture: ComponentFixture<HistoryPage>;
  let dailyLogRepository: { getRange: jest.Mock };

  beforeEach(async () => {
    dailyLogRepository = { getRange: jest.fn(() => of([])) };

    await TestBed.configureTestingModule({
      imports: [HistoryPage],
      providers: [
        provideZonelessChangeDetection(),
        provideNoopAnimations(),
        { provide: DailyLogRepository, useValue: dailyLogRepository },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(HistoryPage);
    fixture.detectChanges();
  });

  it('creates', () => {
    expect(fixture.componentInstance).toBeTruthy();
  });

  it('defaults to a 7-day range ending today', () => {
    const today = new Date().toISOString().slice(0, 10);
    const sevenDaysAgo = new Date(Date.now() - 6 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);

    expect(fixture.componentInstance['toDate']()).toBe(today);
    expect(fixture.componentInstance['fromDate']()).toBe(sevenDaysAgo);
  });

  it('queries the repository with the default range on init', () => {
    expect(dailyLogRepository.getRange).toHaveBeenCalledWith(
      fixture.componentInstance['fromDate'](),
      fixture.componentInstance['toDate'](),
    );
  });

  it('re-queries when fromDate or toDate changes', () => {
    dailyLogRepository.getRange.mockClear();

    fixture.componentInstance['fromDate'].set('2026-01-01');
    fixture.detectChanges();

    expect(dailyLogRepository.getRange).toHaveBeenCalledWith(
      '2026-01-01',
      fixture.componentInstance['toDate'](),
    );
  });

  it('exposes the range results returned by the repository as a signal', async () => {
    const docs: DailyLogDocument[] = [
      {
        id: '2026-08-01',
        date: '2026-08-01',
        totals: { kcal: 1500, protein_g: 80, carbs_g: 150, fat_g: 50, fiber_g: 20 },
      },
    ];
    dailyLogRepository.getRange.mockReturnValue(of(docs));

    fixture.componentInstance['fromDate'].set('2026-07-25');
    fixture.detectChanges();
    await fixture.whenStable();

    expect(fixture.componentInstance['dailyLogs']()).toEqual(docs);
  });
});
