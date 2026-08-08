import { Component, computed, input } from '@angular/core';
import { BarChartModule, Color, ScaleType, type SingleSeries } from '@swimlane/ngx-charts';

import { computeAjrPercentages } from '../../../../core/domain/targets';
import type { NutrientProfile } from '../../../../core/models/nutrient-profile.model';
import { MICRO_METADATA } from '../../nutrient-metadata';

const COLOR_SCHEME: Color = {
  name: 'micronutrients',
  selectable: false,
  group: ScaleType.Ordinal,
  domain: ['#009688'],
};

@Component({
  selector: 'dt-micronutrient-chart',
  imports: [BarChartModule],
  templateUrl: './micronutrient-chart.component.html',
  styleUrl: './micronutrient-chart.component.css',
})
export class MicronutrientChartComponent {
  readonly totals = input.required<NutrientProfile>();
  readonly targets = input.required<NutrientProfile>();

  protected readonly scheme = COLOR_SCHEME;

  // Only micronutrients with both a tracked total and a defined target have a meaningful
  // % AJR — computeAjrPercentages already skips the rest, so whatever it returns is exactly
  // what belongs on this chart.
  protected readonly series = computed<SingleSeries>(() => {
    const percentages = computeAjrPercentages(this.totals(), this.targets());

    return MICRO_METADATA.filter(({ key }) => percentages[key] !== undefined).map(
      ({ key, label }) => ({
        name: label,
        value: Math.round((percentages[key] as number) * 10) / 10,
      }),
    );
  });

  protected readonly hasData = computed(() => this.series().length > 0);
}
