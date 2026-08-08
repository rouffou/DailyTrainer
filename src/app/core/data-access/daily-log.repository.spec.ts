import { provideZonelessChangeDetection } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { doc, docData, Firestore, setDoc } from '@angular/fire/firestore';
import { of } from 'rxjs';

import { AuthService } from '../auth/auth.service';
import type { Meal } from '../models/meal.model';
import type { NutrientProfile } from '../models/nutrient-profile.model';
import { DailyLogRepository } from './daily-log.repository';
import { MealRepository } from './meal.repository';

const withConverterMock = jest.fn(() => 'DOC_REF');

jest.mock('@angular/fire/firestore', () => ({
  Firestore: class Firestore {},
  doc: jest.fn(() => ({ withConverter: withConverterMock })),
  docData: jest.fn(),
  setDoc: jest.fn(),
}));

const docMock = jest.mocked(doc);
const docDataMock = jest.mocked(docData);
const setDocMock = jest.mocked(setDoc);

describe('DailyLogRepository', () => {
  let repository: DailyLogRepository;
  let mealRepository: { getMeals: jest.Mock };

  beforeEach(() => {
    jest.clearAllMocks();
    mealRepository = { getMeals: jest.fn() };

    TestBed.configureTestingModule({
      providers: [
        provideZonelessChangeDetection(),
        { provide: Firestore, useValue: {} },
        { provide: AuthService, useValue: { currentUser: () => ({ uid: 'alice' }) } },
        { provide: MealRepository, useValue: mealRepository },
      ],
    });

    repository = TestBed.inject(DailyLogRepository);
  });

  describe('get', () => {
    it('returns undefined when the document does not exist, without waiting on meals', (done) => {
      docDataMock.mockReturnValue(of(undefined));
      mealRepository.getMeals.mockReturnValue(of([]));

      repository.get('2026-08-08').subscribe((dailyLog) => {
        expect(dailyLog).toBeUndefined();
        expect(docMock).toHaveBeenCalledWith({}, 'users/alice/dailyLogs/2026-08-08');
        done();
      });
    });

    it('folds the document together with its meals', (done) => {
      const totals: NutrientProfile = {
        kcal: 500,
        protein_g: 30,
        carbs_g: 20,
        fat_g: 30,
        fiber_g: 5,
      };
      const meals: Meal[] = [{ id: 'meal1', label: 'Lunch', items: [], totals }];
      docDataMock.mockReturnValue(of({ id: '2026-08-08', date: '2026-08-08', totals }));
      mealRepository.getMeals.mockReturnValue(of(meals));

      repository.get('2026-08-08').subscribe((dailyLog) => {
        expect(dailyLog).toEqual({ id: '2026-08-08', date: '2026-08-08', totals, meals });
        expect(mealRepository.getMeals).toHaveBeenCalledWith('2026-08-08');
        done();
      });
    });
  });

  describe('upsert', () => {
    it('merges date and the given fields into the document', async () => {
      setDocMock.mockResolvedValue(undefined);
      const totals: NutrientProfile = {
        kcal: 500,
        protein_g: 30,
        carbs_g: 20,
        fat_g: 30,
        fiber_g: 5,
      };

      const result = await repository.upsert('2026-08-08', { totals });

      expect(setDocMock).toHaveBeenCalledWith(
        { withConverter: withConverterMock },
        { date: '2026-08-08', totals },
        { merge: true },
      );
      expect(result).toEqual({ ok: true, value: undefined });
    });

    it('returns a Result error instead of throwing when the write fails', async () => {
      setDocMock.mockRejectedValue(new Error('offline'));

      const result = await repository.upsert('2026-08-08', {
        totals: { kcal: 0, protein_g: 0, carbs_g: 0, fat_g: 0, fiber_g: 0 },
      });

      expect(result).toEqual({ ok: false, error: new Error('offline') });
    });
  });

  it('throws when there is no authenticated user', () => {
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      providers: [
        provideZonelessChangeDetection(),
        { provide: Firestore, useValue: {} },
        { provide: AuthService, useValue: { currentUser: () => null } },
        { provide: MealRepository, useValue: { getMeals: jest.fn() } },
      ],
    });
    const unauthenticatedRepository = TestBed.inject(DailyLogRepository);

    expect(() => unauthenticatedRepository.get('2026-08-08')).toThrow(
      'DailyLogRepository requires an authenticated user.',
    );
  });
});
