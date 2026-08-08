import { provideZonelessChangeDetection } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import {
  collection,
  collectionData,
  doc,
  Firestore,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  where,
} from '@angular/fire/firestore';
import { of } from 'rxjs';

import { AuthService } from '../auth/auth.service';
import type { Food } from '../models/food.model';
import { FoodRepository } from './food.repository';

const withConverterMock = jest.fn(() => 'COLLECTION_REF');

jest.mock('@angular/fire/firestore', () => ({
  // Used purely as a DI token here — the real class carries Firestore SDK internals that
  // don't matter once every function that touches it is itself mocked below.
  Firestore: class Firestore {},
  collection: jest.fn(() => ({ withConverter: withConverterMock })),
  collectionData: jest.fn(),
  doc: jest.fn(() => 'DOC_REF'),
  orderBy: jest.fn((...args: unknown[]) => ({ orderBy: args })),
  query: jest.fn(() => 'QUERY'),
  serverTimestamp: jest.fn(() => 'SERVER_TIMESTAMP'),
  setDoc: jest.fn(),
  where: jest.fn((...args: unknown[]) => ({ where: args })),
}));

const collectionMock = jest.mocked(collection);
const collectionDataMock = jest.mocked(collectionData);
const docMock = jest.mocked(doc);
const queryMock = jest.mocked(query);
const setDocMock = jest.mocked(setDoc);
const whereMock = jest.mocked(where);

describe('FoodRepository', () => {
  let repository: FoodRepository;

  beforeEach(() => {
    jest.clearAllMocks();

    TestBed.configureTestingModule({
      providers: [
        provideZonelessChangeDetection(),
        { provide: Firestore, useValue: {} },
        { provide: AuthService, useValue: { currentUser: () => ({ uid: 'alice' }) } },
      ],
    });

    repository = TestBed.inject(FoodRepository);
  });

  describe('searchByNamePrefix', () => {
    it('queries users/{uid}/foods with a prefix range on name', () => {
      collectionDataMock.mockReturnValue(of([]));

      repository.searchByNamePrefix('bac');

      expect(collectionMock).toHaveBeenCalledWith({}, 'users/alice/foods');
      expect(whereMock).toHaveBeenNthCalledWith(1, 'name', '>=', 'bac');
      expect(whereMock.mock.calls[1]?.[0]).toBe('name');
      expect(whereMock.mock.calls[1]?.[1]).toBe('<=');
      expect((whereMock.mock.calls[1]?.[2] as string).startsWith('bac')).toBe(true);
      expect(orderBy).toHaveBeenCalledWith('name');
      expect(queryMock).toHaveBeenCalledWith(
        'COLLECTION_REF',
        { where: ['name', '>=', 'bac'] },
        { where: expect.arrayContaining(['name', '<=']) },
        { orderBy: ['name'] },
      );
    });

    it('requests the document id via idField', () => {
      collectionDataMock.mockReturnValue(of([]));

      repository.searchByNamePrefix('bac');

      expect(collectionDataMock).toHaveBeenCalledWith('QUERY', { idField: 'id' });
    });
  });

  describe('save', () => {
    const food: Omit<Food, 'createdAt'> = {
      id: '1234567890123',
      name: 'Bacon Aldi',
      source: 'openfoodfacts',
      sourceId: '1234567890123',
      per100g: { kcal: 350, protein_g: 25, carbs_g: 1, fat_g: 28, fiber_g: 0 },
    };

    it('writes to users/{uid}/foods/{id} with a server timestamp', async () => {
      setDocMock.mockResolvedValue(undefined);

      const result = await repository.save(food);

      expect(docMock).toHaveBeenCalledWith({}, 'users/alice/foods/1234567890123');
      expect(setDocMock).toHaveBeenCalledWith('DOC_REF', {
        name: 'Bacon Aldi',
        source: 'openfoodfacts',
        sourceId: '1234567890123',
        per100g: food.per100g,
        ownerUid: 'alice',
        createdAt: 'SERVER_TIMESTAMP',
      });
      expect(serverTimestamp).toHaveBeenCalled();
      expect(result).toEqual({ ok: true, value: undefined });
    });

    it('returns a Result error instead of throwing when the write fails', async () => {
      setDocMock.mockRejectedValue(new Error('offline'));

      const result = await repository.save(food);

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
    const unauthenticatedRepository = TestBed.inject(FoodRepository);

    expect(() => unauthenticatedRepository.searchByNamePrefix('bac')).toThrow(
      'FoodRepository requires an authenticated user.',
    );
  });
});
