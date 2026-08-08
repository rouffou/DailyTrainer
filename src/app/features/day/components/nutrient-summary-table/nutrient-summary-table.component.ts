import { DecimalPipe } from '@angular/common';
import { Component, computed, input } from '@angular/core';
import { MatCardModule } from '@angular/material/card';

import { computeAjrPercentages } from '../../../../core/domain/targets';
import type { NutrientProfile } from '../../../../core/models/nutrient-profile.model';
import {
  MACRO_METADATA,
  MICRO_METADATA,
  type NutrientMetadataEntry,
} from '../../nutrient-metadata';

interface NutrientRow {
  key: keyof NutrientProfile;
  label: string;
  unit: string;
  value: number;
  target?: number;
  percent?: number;
}

@Component({
  selector: 'dt-nutrient-summary-table',
  imports: [MatCardModule, DecimalPipe],
  templateUrl: './nutrient-summary-table.component.html',
  styleUrl: './nutrient-summary-table.component.css',
})
export class NutrientSummaryTableComponent {
  readonly totals = input.required<NutrientProfile>();
  readonly targets = input.required<NutrientProfile>();

  protected readonly macroRows = computed(() => this.buildRows(MACRO_METADATA));
  protected readonly microRows = computed(() => this.buildRows(MICRO_METADATA));

  private buildRows(metadata: readonly NutrientMetadataEntry[]): NutrientRow[] {
    const totals = this.totals();
    const targets = this.targets();
    const percentages = computeAjrPercentages(totals, targets);

    return metadata
      .filter(({ key }) => totals[key] !== undefined)
      .map(({ key, label, unit }) => ({
        key,
        label,
        unit,
        value: totals[key] as number,
        target: targets[key],
        percent: percentages[key],
      }));
  }
}
