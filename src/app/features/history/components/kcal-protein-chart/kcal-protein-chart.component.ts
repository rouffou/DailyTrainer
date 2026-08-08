import { Component, computed, input } from '@angular/core';
import { Color, LineChartModule, ScaleType, type MultiSeries } from '@swimlane/ngx-charts';

import type { DailyLogDocument } from '../../../../core/data-access/daily-log.repository';

const COLOR_SCHEME: Color = {
  name: 'kcal-protein',
  selectable: false,
  group: ScaleType.Ordinal,
  domain: ['#3f51b5', '#e91e63'],
};

@Component({
  selector: 'dt-kcal-protein-chart',
  imports: [LineChartModule],
  templateUrl: './kcal-protein-chart.component.html',
  styleUrl: './kcal-protein-chart.component.css',
})
export class KcalProteinChartComponent {
  readonly dailyLogs = input.required<readonly DailyLogDocument[]>();

  protected readonly scheme = COLOR_SCHEME;

  protected readonly series = computed<MultiSeries>(() => {
    const logs = this.dailyLogs();

    return [
      {
        name: 'Calories (kcal)',
        series: logs.map((log) => ({ name: log.date, value: log.totals.kcal })),
      },
      {
        name: 'Protéines (g)',
        series: logs.map((log) => ({ name: log.date, value: log.totals.protein_g })),
      },
    ];
  });

  protected readonly hasData = computed(() => this.dailyLogs().length > 0);
}
