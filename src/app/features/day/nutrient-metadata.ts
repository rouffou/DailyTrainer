import type { NutrientProfile } from '../../core/models/nutrient-profile.model';

export interface NutrientMetadataEntry {
  key: keyof NutrientProfile;
  label: string;
  unit: string;
}

export const MACRO_METADATA: readonly NutrientMetadataEntry[] = [
  { key: 'kcal', label: 'Calories', unit: 'kcal' },
  { key: 'protein_g', label: 'Protéines', unit: 'g' },
  { key: 'carbs_g', label: 'Glucides', unit: 'g' },
  { key: 'fat_g', label: 'Lipides', unit: 'g' },
  { key: 'fiber_g', label: 'Fibres', unit: 'g' },
];

export const MICRO_METADATA: readonly NutrientMetadataEntry[] = [
  { key: 'sugar_g', label: 'Sucres', unit: 'g' },
  { key: 'sodium_mg', label: 'Sodium', unit: 'mg' },
  { key: 'vitaminA_mcg', label: 'Vitamine A', unit: 'µg' },
  { key: 'vitaminC_mg', label: 'Vitamine C', unit: 'mg' },
  { key: 'vitaminD_mcg', label: 'Vitamine D', unit: 'µg' },
  { key: 'vitaminB12_mcg', label: 'Vitamine B12', unit: 'µg' }, // gitleaks:allow — nutrient key, not a secret
  { key: 'calcium_mg', label: 'Calcium', unit: 'mg' },
  { key: 'iron_mg', label: 'Fer', unit: 'mg' },
  { key: 'magnesium_mg', label: 'Magnésium', unit: 'mg' },
  { key: 'potassium_mg', label: 'Potassium', unit: 'mg' },
  { key: 'zinc_mg', label: 'Zinc', unit: 'mg' },
];
