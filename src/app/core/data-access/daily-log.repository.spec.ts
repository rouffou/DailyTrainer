import { provideZonelessChangeDetection } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import {
  collection,
  collectionData,
  doc,
  docData,
  Firestore,
  orderBy,
  query,
  setDoc,
  where,
} from '@angular/fire/firestore';
import { of } from 'rxjs';

import { AuthService } from '../auth/auth.service';
import type { Meal } from '../models/meal.model';
import type { NutrientProfile } from '../models/nutrient-profile.model';
import { DailyLogRepository } from './daily-log.repository';
import { MealRepository } from './meal.repository';

const withConverterMock = jest.fn(() => 'DOC_REF');

jest.mock('@angular/fire/firestore', () => ({
  Firestore: class Firestore {},
  collection: jest.fn(() => ({ withConverter: withConverterMock })),
  collectionData: jest.fn(),
  doc: jest.fn(() => ({ withConverter: withConverterMock })),
  docData: jest.fn(),
  orderBy: jest.fn((...args: unknown[]) => ({ orderBy: args })),
  query: jest.fn(() => 'QUERY'),
  setDoc: jest.fn(),
  where: jest.fn((...args: unknown[]) => ({ where: args })),
}));

const collectionMock = jest.mocked(collection);
const collectionDataMock = jest.mocked(collectionData);
const docMock = jest.mocked(doc);
const docDataMock = jest.mocked(docData);
const queryMock = jest.mocked(query);
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

  describe('getRange', () => {
    it('queries users/{uid}/dailyLogs with a date range, ordered by date', () => {
      collectionDataMock.mockReturnValue(of([]));

      repository.getRange('2026-08-01', '2026-08-08');

      expect(collectionMock).toHaveBeenCalledWith({}, 'users/alice/dailyLogs');
      expect(where).toHaveBeenNthCalledWith(1, 'date', '>=', '2026-08-01');
      expect(where).toHaveBeenNthCalledWith(2, 'date', '<=', '2026-08-08');
      expect(orderBy).toHaveBeenCalledWith('date');
      expect(queryMock).toHaveBeenCalledWith(
        'DOC_REF',
        { where: ['date', '>=', '2026-08-01'] },
        { where: ['date', '<=', '2026-08-08'] },
        { orderBy: ['date'] },
      );
    });

    it('returns the documents in range, requesting the document id via idField', async () => {
      const docs = [
        {
          id: '2026-08-01',
          date: '2026-08-01',
          totals: { kcal: 100, protein_g: 10, carbs_g: 5, fat_g: 2, fiber_g: 1 },
        },
      ];
      collectionDataMock.mockReturnValue(of(docs));

      const result = await new Promise((resolve) => {
        repository.getRange('2026-08-01', '2026-08-08').subscribe(resolve);
      });

      expect(result).toEqual(docs);
      expect(collectionDataMock).toHaveBeenCalledWith('QUERY', { idField: 'id' });
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

    it('merges just targets, leaving totals untouched, when totals is omitted', async () => {
      setDocMock.mockResolvedValue(undefined);
      const targets: NutrientProfile = {
        kcal: 1978.5,
        protein_g: 69,
        carbs_g: 257,
        fat_g: 69,
        fiber_g: 30,
      };

      const result = await repository.upsert('2026-08-08', { targets });

      expect(setDocMock).toHaveBeenCalledWith(
        { withConverter: withConverterMock },
        { date: '2026-08-08', targets },
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
