import { DecimalPipe } from '@angular/common';
import { Component, computed, input } from '@angular/core';
import { MatCardModule } from '@angular/material/card';

import { computeAjrPercentages } from '../../../../core/domain/targets';
import type { NutrientProfile } from '../../../../core/models/nutrient-profile.model';

interface NutrientRow {
  key: keyof NutrientProfile;
  label: string;
  unit: string;
  value: number;
  target?: number;
  percent?: number;
}

const MACRO_METADATA: ReadonlyArray<{ key: keyof NutrientProfile; label: string; unit: string }> = [
  { key: 'kcal', label: 'Calories', unit: 'kcal' },
  { key: 'protein_g', label: 'Protéines', unit: 'g' },
  { key: 'carbs_g', label: 'Glucides', unit: 'g' },
  { key: 'fat_g', label: 'Lipides', unit: 'g' },
  { key: 'fiber_g', label: 'Fibres', unit: 'g' },
];

const MICRO_METADATA: ReadonlyArray<{ key: keyof NutrientProfile; label: string; unit: string }> = [
  { key: 'sugar_g', label: 'Sucres', unit: 'g' },
  { key: 'sodium_mg', label: 'Sodium', unit: 'mg' },
  { key: 'vitaminA_mcg', label: 'Vitamine A', unit: 'µg' },
  { key: 'vitaminC_mg', label: 'Vitamine C', unit: 'mg' },
  { key: 'vitaminD_mcg', label: 'Vitamine D', unit: 'µg' },
  { key: 'vitaminB12_mcg', label: 'Vitamine B12', unit: 'µg' },
  { key: 'calcium_mg', label: 'Calcium', unit: 'mg' },
  { key: 'iron_mg', label: 'Fer', unit: 'mg' },
  { key: 'magnesium_mg', label: 'Magnésium', unit: 'mg' },
  { key: 'potassium_mg', label: 'Potassium', unit: 'mg' },
  { key: 'zinc_mg', label: 'Zinc', unit: 'mg' },
];

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

  private buildRows(
    metadata: ReadonlyArray<{ key: keyof NutrientProfile; label: string; unit: string }>,
  ): NutrientRow[] {
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
