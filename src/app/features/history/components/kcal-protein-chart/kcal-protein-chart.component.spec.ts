import { provideZonelessChangeDetection } from '@angular/core';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { render } from '@testing-library/angular';

import type { DailyLogDocument } from '../../../../core/data-access/daily-log.repository';
import { KcalProteinChartComponent } from './kcal-protein-chart.component';

const DAILY_LOGS: DailyLogDocument[] = [
  {
    id: '2026-08-01',
    date: '2026-08-01',
    totals: { kcal: 1800, protein_g: 90, carbs_g: 200, fat_g: 60, fiber_g: 20 },
  },
  {
    id: '2026-08-02',
    date: '2026-08-02',
    totals: { kcal: 2000, protein_g: 100, carbs_g: 220, fat_g: 65, fiber_g: 25 },
  },
];

describe('KcalProteinChartComponent', () => {
  it('renders a line chart when there is at least one day of data', async () => {
    const { container } = await render(KcalProteinChartComponent, {
      inputs: { dailyLogs: DAILY_LOGS },
      providers: [provideZonelessChangeDetection(), provideNoopAnimations()],
    });

    expect(container.querySelector('ngx-charts-line-chart')).toBeTruthy();
  });

  it('derives a kcal series and a protein series, one point per day', async () => {
    const { fixture } = await render(KcalProteinChartComponent, {
      inputs: { dailyLogs: DAILY_LOGS },
      providers: [provideZonelessChangeDetection(), provideNoopAnimations()],
    });

    expect(fixture.componentInstance['series']()).toEqual([
      {
        name: 'Calories (kcal)',
        series: [
          { name: '2026-08-01', value: 1800 },
          { name: '2026-08-02', value: 2000 },
        ],
      },
      {
        name: 'Protéines (g)',
        series: [
          { name: '2026-08-01', value: 90 },
          { name: '2026-08-02', value: 100 },
        ],
      },
    ]);
  });

  it('renders an empty state instead of a chart when there is no data', async () => {
    const { container, getByText } = await render(KcalProteinChartComponent, {
      inputs: { dailyLogs: [] },
      providers: [provideZonelessChangeDetection(), provideNoopAnimations()],
    });

    expect(container.querySelector('ngx-charts-line-chart')).toBeNull();
    expect(getByText('Aucune donnée pour cette période.')).toBeTruthy();
  });
});
