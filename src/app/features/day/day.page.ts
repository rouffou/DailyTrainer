import { Component, inject, signal } from '@angular/core';
import { toObservable, toSignal } from '@angular/core/rxjs-interop';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatToolbarModule } from '@angular/material/toolbar';
import { switchMap } from 'rxjs';

import { DailyLogRepository } from '../../core/data-access/daily-log.repository';
import { FoodRepository } from '../../core/data-access/food.repository';
import { MealRepository } from '../../core/data-access/meal.repository';
import { computeNutrients } from '../../core/domain/nutrition-calc.service';
import { DEFAULT_TARGETS } from '../../core/domain/targets';
import type { Food } from '../../core/models/food.model';
import type { FoodSearchSelection } from '../../core/models/food-search-selection.model';
import { FoodSearchComponent } from '../food-search/food-search.component';
import { MacroChartComponent } from './components/macro-chart/macro-chart.component';
import { MealCardComponent } from './components/meal-card/meal-card.component';
import { MicronutrientChartComponent } from './components/micronutrient-chart/micronutrient-chart.component';
import { NutrientSummaryTableComponent } from './components/nutrient-summary-table/nutrient-summary-table.component';

const ONE_DAY_MS = 24 * 60 * 60 * 1000;

function toIsoDate(value: Date): string {
  return value.toISOString().slice(0, 10);
}

function shiftDate(date: string, days: number): string {
  return toIsoDate(new Date(new Date(date).getTime() + days * ONE_DAY_MS));
}

@Component({
  selector: 'dt-day-page',
  imports: [
    MatToolbarModule,
    MatIconModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MealCardComponent,
    FoodSearchComponent,
    NutrientSummaryTableComponent,
    MacroChartComponent,
    MicronutrientChartComponent,
  ],
  templateUrl: './day.page.html',
  styleUrl: './day.page.css',
})
export class DayPage {
  private readonly dailyLogRepository = inject(DailyLogRepository);
  private readonly mealRepository = inject(MealRepository);
  private readonly foodRepository = inject(FoodRepository);

  protected readonly selectedDate = signal(toIsoDate(new Date()));
  protected readonly dailyLog = toSignal(
    toObservable(this.selectedDate).pipe(switchMap((date) => this.dailyLogRepository.get(date))),
    { initialValue: undefined },
  );

  protected readonly newMealLabel = signal('');
  protected readonly targets = DEFAULT_TARGETS;

  protected onDateInput(event: Event): void {
    this.selectedDate.set((event.target as HTMLInputElement).value);
  }

  protected goToToday(): void {
    this.selectedDate.set(toIsoDate(new Date()));
  }

  protected goToPreviousDay(): void {
    this.selectedDate.set(shiftDate(this.selectedDate(), -1));
  }

  protected goToNextDay(): void {
    this.selectedDate.set(shiftDate(this.selectedDate(), 1));
  }

  protected onNewMealLabelInput(event: Event): void {
    this.newMealLabel.set((event.target as HTMLInputElement).value);
  }

  protected async onCreateMeal(): Promise<void> {
    const label = this.newMealLabel().trim();
    if (!label) {
      return;
    }
    const result = await this.mealRepository.createMeal(this.selectedDate(), label);
    if (result.ok) {
      this.newMealLabel.set('');
    }
  }

  protected async onFoodSelected(mealId: string, selection: FoodSearchSelection): Promise<void> {
    const food = await this.resolveFood(selection.food);
    if (!food) {
      return;
    }

    await this.mealRepository.addItem(this.selectedDate(), mealId, {
      foodId: food.id,
      foodName: food.name,
      quantity_g: selection.parsed.quantity,
      computed: computeNutrients(food.per100g, selection.parsed.quantity),
    });
  }

  protected async onDeleteItem(mealId: string, itemId: string): Promise<void> {
    await this.mealRepository.deleteItem(this.selectedDate(), mealId, itemId);
  }

  // A FoodSearchResult (external, not yet in users/{uid}/foods) has no id — cache it first,
  // keyed by sourceId, so it becomes a real Food. A local Food already has one.
  private async resolveFood(
    candidate: FoodSearchSelection['food'],
  ): Promise<Pick<Food, 'id' | 'name' | 'per100g'> | null> {
    if ('id' in candidate) {
      return candidate;
    }

    const food: Omit<Food, 'createdAt'> = {
      id: candidate.sourceId,
      name: candidate.name,
      source: candidate.source,
      sourceId: candidate.sourceId,
      per100g: candidate.per100g,
    };
    const result = await this.foodRepository.save(food);
    return result.ok ? food : null;
  }
}
