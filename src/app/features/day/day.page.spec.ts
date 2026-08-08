import { provideZonelessChangeDetection } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of } from 'rxjs';

import { DailyLogRepository } from '../../core/data-access/daily-log.repository';
import { FoodRepository } from '../../core/data-access/food.repository';
import { MealRepository } from '../../core/data-access/meal.repository';
import type { DailyLog } from '../../core/models/daily-log.model';
import type { FoodSearchSelection } from '../../core/models/food-search-selection.model';
import { DayPage } from './day.page';

describe('DayPage', () => {
  let fixture: ComponentFixture<DayPage>;
  let dailyLogRepository: { get: jest.Mock };
  let mealRepository: { createMeal: jest.Mock; addItem: jest.Mock; deleteItem: jest.Mock };
  let foodRepository: { save: jest.Mock };

  beforeEach(async () => {
    dailyLogRepository = { get: jest.fn(() => of(undefined)) };
    mealRepository = {
      createMeal: jest.fn(async () => ({ ok: true, value: 'meal-1' })),
      addItem: jest.fn(async () => ({ ok: true, value: undefined })),
      deleteItem: jest.fn(async () => ({ ok: true, value: undefined })),
    };
    foodRepository = { save: jest.fn(async () => ({ ok: true, value: undefined })) };

    await TestBed.configureTestingModule({
      imports: [DayPage],
      providers: [
        provideZonelessChangeDetection(),
        { provide: DailyLogRepository, useValue: dailyLogRepository },
        { provide: MealRepository, useValue: mealRepository },
        { provide: FoodRepository, useValue: foodRepository },
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

  describe('onCreateMeal', () => {
    it('creates a meal with the trimmed label and clears newMealLabel on success', async () => {
      fixture.componentInstance['newMealLabel'].set('  Petit-déjeuner  ');
      fixture.componentInstance['selectedDate'].set('2026-01-01');

      await fixture.componentInstance['onCreateMeal']();

      expect(mealRepository.createMeal).toHaveBeenCalledWith('2026-01-01', 'Petit-déjeuner');
      expect(fixture.componentInstance['newMealLabel']()).toBe('');
    });

    it('does nothing when the label is blank', async () => {
      fixture.componentInstance['newMealLabel'].set('   ');

      await fixture.componentInstance['onCreateMeal']();

      expect(mealRepository.createMeal).not.toHaveBeenCalled();
    });

    it('keeps newMealLabel when creation fails', async () => {
      mealRepository.createMeal.mockResolvedValueOnce({ ok: false, error: new Error('boom') });
      fixture.componentInstance['newMealLabel'].set('Dîner');

      await fixture.componentInstance['onCreateMeal']();

      expect(fixture.componentInstance['newMealLabel']()).toBe('Dîner');
    });
  });

  describe('onFoodSelected', () => {
    it('adds an item using an already-cached Food as-is', async () => {
      fixture.componentInstance['selectedDate'].set('2026-01-01');
      const selection: FoodSearchSelection = {
        parsed: { name: 'pomme', quantity: 150, unit: 'g' },
        food: {
          id: 'food-1',
          name: 'Pomme',
          per100g: { kcal: 52, protein_g: 0.3, carbs_g: 14, fat_g: 0.2, fiber_g: 2.4 },
        } as never,
      };

      await fixture.componentInstance['onFoodSelected']('meal-1', selection);

      expect(foodRepository.save).not.toHaveBeenCalled();
      const [date, mealId, item] = mealRepository.addItem.mock.calls[0];
      expect(date).toBe('2026-01-01');
      expect(mealId).toBe('meal-1');
      expect(item).toEqual(
        expect.objectContaining({ foodId: 'food-1', foodName: 'Pomme', quantity_g: 150 }),
      );
      expect(item.computed.kcal).toBeCloseTo(78);
      expect(item.computed.protein_g).toBeCloseTo(0.45);
      expect(item.computed.carbs_g).toBeCloseTo(21);
      expect(item.computed.fat_g).toBeCloseTo(0.3);
      expect(item.computed.fiber_g).toBeCloseTo(3.6);
    });

    it('caches an uncached FoodSearchResult before adding the item', async () => {
      fixture.componentInstance['selectedDate'].set('2026-01-01');
      const selection: FoodSearchSelection = {
        parsed: { name: 'banane', quantity: 100, unit: 'g' },
        food: {
          sourceId: 'off-1',
          source: 'openfoodfacts',
          name: 'Banane',
          per100g: { kcal: 89, protein_g: 1.1, carbs_g: 23, fat_g: 0.3, fiber_g: 2.6 },
        } as never,
      };

      await fixture.componentInstance['onFoodSelected']('meal-1', selection);

      expect(foodRepository.save).toHaveBeenCalledWith(
        expect.objectContaining({ id: 'off-1', name: 'Banane', sourceId: 'off-1' }),
      );
      expect(mealRepository.addItem).toHaveBeenCalledWith(
        '2026-01-01',
        'meal-1',
        expect.objectContaining({ foodId: 'off-1', foodName: 'Banane' }),
      );
    });

    it('does not add an item when caching the food fails', async () => {
      foodRepository.save.mockResolvedValueOnce({ ok: false, error: new Error('boom') });
      const selection: FoodSearchSelection = {
        parsed: { name: 'banane', quantity: 100, unit: 'g' },
        food: {
          sourceId: 'off-1',
          source: 'openfoodfacts',
          name: 'Banane',
          per100g: { kcal: 89, protein_g: 1.1, carbs_g: 23, fat_g: 0.3, fiber_g: 2.6 },
        } as never,
      };

      await fixture.componentInstance['onFoodSelected']('meal-1', selection);

      expect(mealRepository.addItem).not.toHaveBeenCalled();
    });
  });

  describe('onDeleteItem', () => {
    it('deletes the item via the meal repository', async () => {
      fixture.componentInstance['selectedDate'].set('2026-01-01');

      await fixture.componentInstance['onDeleteItem']('meal-1', 'item-1');

      expect(mealRepository.deleteItem).toHaveBeenCalledWith('2026-01-01', 'meal-1', 'item-1');
    });
  });
});
