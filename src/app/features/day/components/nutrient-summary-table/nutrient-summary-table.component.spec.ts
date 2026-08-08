import { provideZonelessChangeDetection } from '@angular/core';
import { render, screen } from '@testing-library/angular';

import type { NutrientProfile } from '../../../../core/models/nutrient-profile.model';
import { NutrientSummaryTableComponent } from './nutrient-summary-table.component';

const TOTALS: NutrientProfile = {
  kcal: 1000,
  protein_g: 35,
  carbs_g: 130,
  fat_g: 35,
  fiber_g: 15,
  vitaminC_mg: 40,
};

const TARGETS: NutrientProfile = {
  kcal: 2000,
  protein_g: 70,
  carbs_g: 260,
  fat_g: 70,
  fiber_g: 30,
  vitaminC_mg: 80,
};

describe('NutrientSummaryTableComponent', () => {
  it('renders each macronutrient with its value and % AJR', async () => {
    await render(NutrientSummaryTableComponent, {
      inputs: { totals: TOTALS, targets: TARGETS },
      providers: [provideZonelessChangeDetection()],
    });

    expect(screen.getByText('Calories')).toBeTruthy();
    expect(screen.getByText('1,000 kcal')).toBeTruthy();
    expect(screen.getByText('2,000 kcal')).toBeTruthy();
    expect(screen.getAllByText('50 %').length).toBeGreaterThan(0);
  });

  it('renders a micronutrient present in totals', async () => {
    await render(NutrientSummaryTableComponent, {
      inputs: { totals: TOTALS, targets: TARGETS },
      providers: [provideZonelessChangeDetection()],
    });

    expect(screen.getByText('Vitamine C')).toBeTruthy();
    expect(screen.getByText('40 mg')).toBeTruthy();
  });

  it('does not render the micronutrient table when totals has none', async () => {
    const macroOnlyTotals: NutrientProfile = {
      kcal: 1000,
      protein_g: 35,
      carbs_g: 130,
      fat_g: 35,
      fiber_g: 15,
    };

    await render(NutrientSummaryTableComponent, {
      inputs: { totals: macroOnlyTotals, targets: TARGETS },
      providers: [provideZonelessChangeDetection()],
    });

    expect(screen.queryByText('Micronutriments')).toBeNull();
  });

  it('shows a dash for target and % AJR when no target is defined for a nutrient', async () => {
    const totalsWithUntargetedMicro: NutrientProfile = { ...TOTALS, zinc_mg: 5 };

    await render(NutrientSummaryTableComponent, {
      inputs: { totals: totalsWithUntargetedMicro, targets: TARGETS },
      providers: [provideZonelessChangeDetection()],
    });

    expect(screen.getByText('Zinc')).toBeTruthy();
    expect(screen.getByText('5 mg')).toBeTruthy();
    const zincRow = screen.getByText('Zinc').closest('tr');
    expect(zincRow?.textContent).toContain('—');
  });
});
