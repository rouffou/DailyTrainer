import { provideZonelessChangeDetection } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import type { MatAutocompleteSelectedEvent } from '@angular/material/autocomplete';
import { of } from 'rxjs';

import { FoodRepository } from '../../core/data-access/food.repository';
import { SearchFoodService } from '../../core/data-access/search-food.service';
import type { Food } from '../../core/models/food.model';
import type { FoodSearchResult } from '../../core/models/food-search-result.model';
import { FoodSearchComponent } from './food-search.component';

const LOCAL_FOOD: Food = {
  id: 'food1',
  name: 'Bacon Aldi',
  source: 'local',
  per100g: { kcal: 350, protein_g: 25, carbs_g: 1, fat_g: 28, fiber_g: 0 },
  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- Timestamp isn't relevant here, see nutrition-calc.service.spec.ts for the same rationale.
  createdAt: {} as any,
};

const REMOTE_RESULT: FoodSearchResult = {
  name: 'Carrots, raw',
  source: 'usda',
  sourceId: '170393',
  per100g: { kcal: 41, protein_g: 0.93, carbs_g: 9.58, fat_g: 0.24, fiber_g: 2.8 },
};

describe('FoodSearchComponent', () => {
  let fixture: ComponentFixture<FoodSearchComponent>;
  let foodRepository: { searchByNamePrefix: jest.Mock };
  let searchFoodService: { search: jest.Mock };

  beforeEach(async () => {
    foodRepository = { searchByNamePrefix: jest.fn(() => of([])) };
    searchFoodService = { search: jest.fn() };

    await TestBed.configureTestingModule({
      imports: [FoodSearchComponent],
      providers: [
        provideZonelessChangeDetection(),
        { provide: FoodRepository, useValue: foodRepository },
        { provide: SearchFoodService, useValue: searchFoodService },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(FoodSearchComponent);
    fixture.detectChanges();
  });

  it('creates', () => {
    expect(fixture.componentInstance).toBeTruthy();
  });

  it('does not search when the query has no parseable quantity', async () => {
    fixture.componentInstance['query'].set('bacon aldi');
    fixture.detectChanges();
    await fixture.whenStable();

    expect(foodRepository.searchByNamePrefix).not.toHaveBeenCalled();
    expect(fixture.componentInstance['candidates']()).toEqual([]);
  });

  it('searches FoodRepository once a quantity + name is parseable', async () => {
    foodRepository.searchByNamePrefix.mockReturnValue(of([LOCAL_FOOD]));

    fixture.componentInstance['query'].set('100g de bacon aldi');
    fixture.detectChanges();
    await fixture.whenStable();

    expect(foodRepository.searchByNamePrefix).toHaveBeenCalledWith('bacon aldi');
    expect(fixture.componentInstance['candidates']()).toEqual([LOCAL_FOOD]);
    expect(searchFoodService.search).not.toHaveBeenCalled();
  });

  it('falls back to searchFood when FoodRepository finds nothing', async () => {
    foodRepository.searchByNamePrefix.mockReturnValue(of([]));
    searchFoodService.search.mockResolvedValue({ ok: true, value: [REMOTE_RESULT] });

    fixture.componentInstance['query'].set('100g de carotte');
    fixture.detectChanges();
    await fixture.whenStable();

    expect(searchFoodService.search).toHaveBeenCalledWith('carotte');
    expect(fixture.componentInstance['candidates']()).toEqual([REMOTE_RESULT]);
  });

  it('returns no candidates when searchFood fails', async () => {
    foodRepository.searchByNamePrefix.mockReturnValue(of([]));
    searchFoodService.search.mockResolvedValue({ ok: false, error: new Error('offline') });

    fixture.componentInstance['query'].set('100g de carotte');
    fixture.detectChanges();
    await fixture.whenStable();

    expect(fixture.componentInstance['candidates']()).toEqual([]);
  });

  it('emits foodSelected with the parsed input and the chosen candidate', () => {
    fixture.componentInstance['query'].set('100g de bacon aldi');
    const emitted: unknown[] = [];
    fixture.componentInstance.foodSelected.subscribe((selection) => emitted.push(selection));

    fixture.componentInstance['onOptionSelected']({
      option: { value: LOCAL_FOOD },
    } as MatAutocompleteSelectedEvent);

    expect(emitted).toEqual([
      { parsed: { quantity: 100, unit: 'g', name: 'bacon aldi' }, food: LOCAL_FOOD },
    ]);
  });
});
