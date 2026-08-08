import { provideZonelessChangeDetection } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of } from 'rxjs';

import { DailyLogRepository } from '../../core/data-access/daily-log.repository';
import type { DailyLog } from '../../core/models/daily-log.model';
import { DayPage } from './day.page';

describe('DayPage', () => {
  let fixture: ComponentFixture<DayPage>;
  let dailyLogRepository: { get: jest.Mock };

  beforeEach(async () => {
    dailyLogRepository = { get: jest.fn(() => of(undefined)) };

    await TestBed.configureTestingModule({
      imports: [DayPage],
      providers: [
        provideZonelessChangeDetection(),
        { provide: DailyLogRepository, useValue: dailyLogRepository },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(DayPage);
    fixture.detectChanges();
  });

  it('creates', () => {
    expect(fixture.componentInstance).toBeTruthy();
  });

  it("defaults selectedDate to today's ISO date", () => {
    const today = new Date().toISOString().slice(0, 10);
    expect(fixture.componentInstance['selectedDate']()).toBe(today);
  });

  it('re-fetches the daily log when selectedDate changes', () => {
    dailyLogRepository.get.mockClear();

    fixture.componentInstance['selectedDate'].set('2026-01-01');
    fixture.detectChanges();

    expect(dailyLogRepository.get).toHaveBeenCalledWith('2026-01-01');
  });

  it('goToPreviousDay moves selectedDate back by one day', () => {
    fixture.componentInstance['selectedDate'].set('2026-08-08');

    fixture.componentInstance['goToPreviousDay']();

    expect(fixture.componentInstance['selectedDate']()).toBe('2026-08-07');
  });

  it('goToNextDay moves selectedDate forward by one day', () => {
    fixture.componentInstance['selectedDate'].set('2026-08-08');

    fixture.componentInstance['goToNextDay']();

    expect(fixture.componentInstance['selectedDate']()).toBe('2026-08-09');
  });

  it('goToToday resets selectedDate to today', () => {
    fixture.componentInstance['selectedDate'].set('2020-01-01');

    fixture.componentInstance['goToToday']();

    expect(fixture.componentInstance['selectedDate']()).toBe(new Date().toISOString().slice(0, 10));
  });

  it('exposes the daily log returned by the repository as a signal', async () => {
    // A date deliberately different from "today" (the signal's initial value) — setting a
    // signal to its current value is a no-op and wouldn't re-trigger the fetch pipeline.
    const dailyLog: DailyLog = {
      id: '2030-05-05',
      date: '2030-05-05',
      meals: [],
      totals: { kcal: 0, protein_g: 0, carbs_g: 0, fat_g: 0, fiber_g: 0 },
    };
    dailyLogRepository.get.mockReturnValue(of(dailyLog));

    fixture.componentInstance['selectedDate'].set('2030-05-05');
    fixture.detectChanges();
    await fixture.whenStable();

    expect(fixture.componentInstance['dailyLog']()).toEqual(dailyLog);
  });
});
