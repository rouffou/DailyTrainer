import { provideZonelessChangeDetection } from '@angular/core';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { render } from '@testing-library/angular';

import type { NutrientProfile } from '../../../../core/models/nutrient-profile.model';
import { MacroChartComponent } from './macro-chart.component';

const TOTALS: NutrientProfile = {
  kcal: 1000,
  protein_g: 25,
  carbs_g: 150,
  fat_g: 100 / 3,
  fiber_g: 10,
};

describe('MacroChartComponent', () => {
  it('renders a bar chart', async () => {
    const { container } = await render(MacroChartComponent, {
      inputs: { totals: TOTALS },
      providers: [provideZonelessChangeDetection(), provideNoopAnimations()],
    });

    expect(container.querySelector('ngx-charts-bar-vertical')).toBeTruthy();
  });

  it('derives its series from computeMacroDistribution, rounded to one decimal', async () => {
    const { fixture } = await render(MacroChartComponent, {
      inputs: { totals: TOTALS },
      providers: [provideZonelessChangeDetection(), provideNoopAnimations()],
    });

    expect(fixture.componentInstance['series']()).toEqual([
      { name: 'Protéines', value: 10 },
      { name: 'Glucides', value: 60 },
      { name: 'Lipides', value: 30 },
    ]);
  });

  it('recomputes the series when totals changes', async () => {
    const { fixture } = await render(MacroChartComponent, {
      inputs: { totals: TOTALS },
      providers: [provideZonelessChangeDetection(), provideNoopAnimations()],
    });

    fixture.componentRef.setInput('totals', {
      kcal: 0,
      protein_g: 0,
      carbs_g: 0,
      fat_g: 0,
      fiber_g: 0,
    });
    fixture.detectChanges();

    expect(fixture.componentInstance['series']()).toEqual([
      { name: 'Protéines', value: 0 },
      { name: 'Glucides', value: 0 },
      { name: 'Lipides', value: 0 },
    ]);
  });
});
