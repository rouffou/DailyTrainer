import { provideZonelessChangeDetection } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import {
  addDoc,
  collection,
  collectionData,
  deleteDoc,
  doc,
  Firestore,
} from '@angular/fire/firestore';
import { of } from 'rxjs';

import { AuthService } from '../auth/auth.service';
import type { MealItem } from '../models/meal-item.model';
import { MealRepository } from './meal.repository';

const withConverterMock = jest.fn(() => 'COLLECTION_REF');

jest.mock('@angular/fire/firestore', () => ({
  Firestore: class Firestore {},
  addDoc: jest.fn(),
  collection: jest.fn(() => ({ withConverter: withConverterMock })),
  collectionData: jest.fn(),
  deleteDoc: jest.fn(),
  doc: jest.fn(() => 'DOC_REF'),
}));

const addDocMock = jest.mocked(addDoc);
const collectionMock = jest.mocked(collection);
const collectionDataMock = jest.mocked(collectionData);
const deleteDocMock = jest.mocked(deleteDoc);
const docMock = jest.mocked(doc);

describe('MealRepository', () => {
  let repository: MealRepository;

  beforeEach(() => {
    jest.clearAllMocks();

    TestBed.configureTestingModule({
      providers: [
        provideZonelessChangeDetection(),
        { provide: Firestore, useValue: {} },
        { provide: AuthService, useValue: { currentUser: () => ({ uid: 'alice' }) } },
      ],
    });

    repository = TestBed.inject(MealRepository);
  });

  describe('getMeals', () => {
    it('returns an empty array when there are no meals', (done) => {
      collectionDataMock.mockReturnValue(of([]));

      repository.getMeals('2026-08-08').subscribe((meals) => {
        expect(meals).toEqual([]);
        expect(collectionMock).toHaveBeenCalledWith({}, 'users/alice/dailyLogs/2026-08-08/meals');
        done();
      });
    });

    it('folds each meal together with its items subcollection', (done) => {
      const mealDoc = { id: 'meal1', label: 'Lunch', totals: { kcal: 100 } };
      const item: MealItem = {
        id: 'item1',
        foodId: 'food1',
        foodName: 'Bacon',
        quantity_g: 100,
        computed: { kcal: 350, protein_g: 25, carbs_g: 1, fat_g: 28, fiber_g: 0 },
      };

      collectionDataMock.mockReturnValueOnce(of([mealDoc])).mockReturnValueOnce(of([item]));

      repository.getMeals('2026-08-08').subscribe((meals) => {
        expect(meals).toEqual([{ ...mealDoc, items: [item] }]);
        expect(collectionMock).toHaveBeenCalledWith(
          {},
          'users/alice/dailyLogs/2026-08-08/meals/meal1/items',
        );
        done();
      });
    });
  });

  describe('createMeal', () => {
    it('adds a meal document with zeroed totals', async () => {
      addDocMock.mockResolvedValue({ id: 'new-meal' } as never);

      const result = await repository.createMeal('2026-08-08', 'Lunch');

      expect(collectionMock).toHaveBeenCalledWith({}, 'users/alice/dailyLogs/2026-08-08/meals');
      expect(addDocMock).toHaveBeenCalledWith(
        { withConverter: withConverterMock },
        {
          label: 'Lunch',
          totals: { kcal: 0, protein_g: 0, carbs_g: 0, fat_g: 0, fiber_g: 0 },
        },
      );
      expect(result).toEqual({ ok: true, value: 'new-meal' });
    });
  });

  describe('addItem', () => {
    it('adds the item to the meal items subcollection', async () => {
      addDocMock.mockResolvedValue({ id: 'item1' } as never);
      const item: Omit<MealItem, 'id'> = {
        foodId: 'food1',
        foodName: 'Bacon',
        quantity_g: 100,
        computed: { kcal: 350, protein_g: 25, carbs_g: 1, fat_g: 28, fiber_g: 0 },
      };

      const result = await repository.addItem('2026-08-08', 'meal1', item);

      expect(collectionMock).toHaveBeenCalledWith(
        {},
        'users/alice/dailyLogs/2026-08-08/meals/meal1/items',
      );
      expect(addDocMock).toHaveBeenCalledWith({ withConverter: withConverterMock }, item);
      expect(result).toEqual({ ok: true, value: undefined });
    });
  });

  describe('deleteItem', () => {
    it('deletes the item document', async () => {
      deleteDocMock.mockResolvedValue(undefined);

      const result = await repository.deleteItem('2026-08-08', 'meal1', 'item1');

      expect(docMock).toHaveBeenCalledWith(
        {},
        'users/alice/dailyLogs/2026-08-08/meals/meal1/items/item1',
      );
      expect(deleteDocMock).toHaveBeenCalledWith('DOC_REF');
      expect(result).toEqual({ ok: true, value: undefined });
    });

    it('returns a Result error instead of throwing when the delete fails', async () => {
      deleteDocMock.mockRejectedValue(new Error('offline'));

      const result = await repository.deleteItem('2026-08-08', 'meal1', 'item1');

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
      ],
    });
    const unauthenticatedRepository = TestBed.inject(MealRepository);

    expect(() => unauthenticatedRepository.getMeals('2026-08-08')).toThrow(
      'MealRepository requires an authenticated user.',
    );
  });
});
