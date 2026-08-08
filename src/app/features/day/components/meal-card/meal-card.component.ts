import { Component, input, output } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatListModule } from '@angular/material/list';

import type { Meal } from '../../../../core/models/meal.model';

@Component({
  selector: 'dt-meal-card',
  imports: [MatCardModule, MatListModule, MatIconModule, MatButtonModule],
  templateUrl: './meal-card.component.html',
  styleUrl: './meal-card.component.css',
})
export class MealCardComponent {
  readonly meal = input.required<Meal>();
  readonly deleteItem = output<string>();

  protected onDeleteItem(itemId: string): void {
    this.deleteItem.emit(itemId);
  }
}
