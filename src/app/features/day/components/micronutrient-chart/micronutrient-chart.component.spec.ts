import { provideZonelessChangeDetection } from '@angular/core';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { render } from '@testing-library/angular';

import type { NutrientProfile } from '../../../../core/models/nutrient-profile.model';
import { MicronutrientChartComponent } from './micronutrient-chart.component';

const TARGETS: NutrientProfile = {
  kcal: 2000,
  protein_g: 70,
  carbs_g: 260,
  fat_g: 70,
  fiber_g: 30,
  vitaminC_mg: 80,
  iron_mg: 14,
};

describe('MicronutrientChartComponent', () => {
  it('renders a horizontal bar chart when a tracked micronutrient has a target', async () => {
    const totals: NutrientProfile = {
      kcal: 1000,
      protein_g: 35,
      carbs_g: 130,
      fat_g: 35,
      fiber_g: 15,
      vitaminC_mg: 40,
    };

    const { container } = await render(MicronutrientChartComponent, {
      inputs: { totals, targets: TARGETS },
      providers: [provideZonelessChangeDetection(), provideNoopAnimations()],
    });

    expect(container.querySelector('ngx-charts-bar-horizontal')).toBeTruthy();
  });

  it('derives its series from computeAjrPercentages, skipping micronutrients without a target', async () => {
    const totals: NutrientProfile = {
      kcal: 1000,
      protein_g: 35,
      carbs_g: 130,
      fat_g: 35,
      fiber_g: 15,
      vitaminC_mg: 40,
      zinc_mg: 5,
    };

    const { fixture } = await render(MicronutrientChartComponent, {
      inputs: { totals, targets: TARGETS },
      providers: [provideZonelessChangeDetection(), provideNoopAnimations()],
    });

    expect(fixture.componentInstance['series']()).toEqual([{ name: 'Vitamine C', value: 50 }]);
  });

  it('renders nothing when no tracked micronutrient has a defined target', async () => {
    const totals: NutrientProfile = {
      kcal: 1000,
      protein_g: 35,
      carbs_g: 130,
      fat_g: 35,
      fiber_g: 15,
      zinc_mg: 5,
    };

    const { container } = await render(MicronutrientChartComponent, {
      inputs: { totals, targets: TARGETS },
      providers: [provideZonelessChangeDetection(), provideNoopAnimations()],
    });

    expect(container.querySelector('ngx-charts-bar-horizontal')).toBeNull();
  });
});
