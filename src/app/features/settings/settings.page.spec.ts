import { provideZonelessChangeDetection } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DailyLogRepository } from '../../core/data-access/daily-log.repository';
import { computeTdee } from '../../core/domain/targets';
import { SettingsPage } from './settings.page';

describe('SettingsPage', () => {
  let fixture: ComponentFixture<SettingsPage>;
  let dailyLogRepository: { upsert: jest.Mock };

  beforeEach(async () => {
    dailyLogRepository = { upsert: jest.fn(async () => ({ ok: true, value: undefined })) };

    await TestBed.configureTestingModule({
      imports: [SettingsPage],
      providers: [
        provideZonelessChangeDetection(),
        { provide: DailyLogRepository, useValue: dailyLogRepository },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(SettingsPage);
    fixture.detectChanges();
  });

  it('creates', () => {
    expect(fixture.componentInstance).toBeTruthy();
  });

  it('computes personalized targets from the form profile and saves them to today', async () => {
    fixture.componentInstance['age'].set(30);
    fixture.componentInstance['weightKg'].set(70);
    fixture.componentInstance['heightCm'].set(175);
    fixture.componentInstance['sex'].set('male');
    fixture.componentInstance['activityLevel'].set('sedentary');

    await fixture.componentInstance['onSubmit']();

    const today = new Date().toISOString().slice(0, 10);
    const tdee = computeTdee({
      age: 30,
      weightKg: 70,
      heightCm: 175,
      sex: 'male',
      activityLevel: 'sedentary',
    });

    expect(dailyLogRepository.upsert).toHaveBeenCalledTimes(1);
    const [date, fields] = dailyLogRepository.upsert.mock.calls[0];
    expect(date).toBe(today);
    expect(fields.targets.kcal).toBeCloseTo(tdee);
    expect(fixture.componentInstance['savedTargetsKcal']()).toBe(Math.round(tdee));
  });

  it('surfaces the error message and leaves savedTargetsKcal unset when the save fails', async () => {
    dailyLogRepository.upsert.mockResolvedValueOnce({ ok: false, error: new Error('offline') });

    await fixture.componentInstance['onSubmit']();

    expect(fixture.componentInstance['errorMessage']()).toBe('offline');
    expect(fixture.componentInstance['savedTargetsKcal']()).toBeNull();
  });
});
