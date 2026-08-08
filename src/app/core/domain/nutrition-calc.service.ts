import type { Food } from '../models/food.model';
import type { NutrientProfile } from '../models/nutrient-profile.model';

export function computeNutrients(food: Food, quantityG: number): NutrientProfile {
  const factor = quantityG / 100;

  // Object.entries loses the precise key type; food.per100g is already a well-formed
  // NutrientProfile, so restoring it here is safe — every key really is one of its keys.
  const entries = Object.entries(food.per100g) as Array<[keyof NutrientProfile, number]>;
  const scaledEntries = entries.map(([key, value]) => [key, value * factor] as const);

  // Object.fromEntries only knows it built a Record<string, number>, not that every required
  // key of NutrientProfile is present — but scaledEntries has exactly the same keys as
  // food.per100g (itself a NutrientProfile) with only the values transformed, so it does.
  return Object.fromEntries(scaledEntries) as unknown as NutrientProfile;
}

const REQUIRED_NUTRIENT_KEYS: ReadonlyArray<keyof NutrientProfile> = [
  'kcal',
  'protein_g',
  'carbs_g',
  'fat_g',
  'fiber_g',
];

// Used for both Meal.totals (summing MealItem.computed) and DailyLog.totals (summing
// Meal.totals) — DailyTrainer_SPEC.md section 5.2 defines both as the same plain sum.
export function aggregateTotals(profiles: readonly NutrientProfile[]): NutrientProfile {
  const totals: Partial<Record<keyof NutrientProfile, number>> = {};

  for (const key of REQUIRED_NUTRIENT_KEYS) {
    totals[key] = 0;
  }

  for (const profile of profiles) {
    const entries = Object.entries(profile) as Array<[keyof NutrientProfile, number]>;
    for (const [key, value] of entries) {
      totals[key] = (totals[key] ?? 0) + value;
    }
  }

  // Same reasoning as computeNutrients above: every required key was seeded to 0, and any
  // optional key present here came straight from a real NutrientProfile, so the shape holds.
  return totals as unknown as NutrientProfile;
}
