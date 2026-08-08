import { provideZonelessChangeDetection } from '@angular/core';
import { render, screen } from '@testing-library/angular';
import userEvent from '@testing-library/user-event';

import type { Meal } from '../../../../core/models/meal.model';
import { MealCardComponent } from './meal-card.component';

const MEAL: Meal = {
  id: 'meal1',
  label: 'Déjeuner',
  totals: { kcal: 450, protein_g: 30, carbs_g: 10, fat_g: 32, fiber_g: 1 },
  items: [
    {
      id: 'item1',
      foodId: 'food1',
      foodName: 'Bacon Aldi',
      quantity_g: 100,
      computed: { kcal: 350, protein_g: 25, carbs_g: 1, fat_g: 28, fiber_g: 0 },
    },
    {
      id: 'item2',
      foodId: 'food2',
      foodName: 'Œufs',
      quantity_g: 100,
      computed: { kcal: 100, protein_g: 5, carbs_g: 9, fat_g: 4, fiber_g: 1 },
    },
  ],
};

describe('MealCardComponent', () => {
  it('renders the meal label and total kcal', async () => {
    await render(MealCardComponent, {
      inputs: { meal: MEAL },
      providers: [provideZonelessChangeDetection()],
    });

    expect(screen.getByText('Déjeuner')).toBeTruthy();
    expect(screen.getByText('450 kcal')).toBeTruthy();
  });

  it('renders each item with its quantity and kcal', async () => {
    await render(MealCardComponent, {
      inputs: { meal: MEAL },
      providers: [provideZonelessChangeDetection()],
    });

    expect(screen.getByText('Bacon Aldi')).toBeTruthy();
    expect(screen.getByText('100 g — 350 kcal')).toBeTruthy();
    expect(screen.getByText('Œufs')).toBeTruthy();
    expect(screen.getByText('100 g — 100 kcal')).toBeTruthy();
  });

  it('shows an empty state when the meal has no items', async () => {
    await render(MealCardComponent, {
      inputs: { meal: { ...MEAL, items: [] } },
      providers: [provideZonelessChangeDetection()],
    });

    expect(screen.getByText('Aucun aliment ajouté.')).toBeTruthy();
  });

  it('emits deleteItem with the item id when its delete button is clicked', async () => {
    const { fixture } = await render(MealCardComponent, {
      inputs: { meal: MEAL },
      providers: [provideZonelessChangeDetection()],
    });
    const emitted: string[] = [];
    fixture.componentInstance.deleteItem.subscribe((itemId: string) => emitted.push(itemId));

    await userEvent.click(screen.getByRole('button', { name: 'Supprimer Bacon Aldi' }));

    expect(emitted).toEqual(['item1']);
  });
});
