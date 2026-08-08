import { Component, computed, input } from '@angular/core';
import { BarChartModule, Color, ScaleType, type SingleSeries } from '@swimlane/ngx-charts';

import { computeMacroDistribution } from '../../../../core/domain/nutrition-calc.service';
import type { NutrientProfile } from '../../../../core/models/nutrient-profile.model';

const COLOR_SCHEME: Color = {
  name: 'macro',
  selectable: false,
  group: ScaleType.Ordinal,
  domain: ['#3f51b5', '#ff9800', '#e91e63'],
};

@Component({
  selector: 'dt-macro-chart',
  imports: [BarChartModule],
  templateUrl: './macro-chart.component.html',
  styleUrl: './macro-chart.component.css',
})
export class MacroChartComponent {
  readonly totals = input.required<NutrientProfile>();

  protected readonly scheme = COLOR_SCHEME;

  protected readonly series = computed<SingleSeries>(() =>
    computeMacroDistribution(this.totals()).map((entry) => ({
      name: entry.label,
      value: Math.round(entry.percentOfKcal * 10) / 10,
    })),
  );
}
