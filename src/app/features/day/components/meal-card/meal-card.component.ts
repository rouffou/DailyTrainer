import { Component, input, output } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatListModule } from '@angular/material/list';

import type { Meal } from '../../../../core/models/meal.model';
import { IconComponent } from '../../../../shared/ui/icon/icon.component';

@Component({
  selector: 'dt-meal-card',
  imports: [MatCardModule, MatListModule, IconComponent, MatButtonModule],
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
