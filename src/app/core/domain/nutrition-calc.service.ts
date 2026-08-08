import type { NutrientProfile } from '../models/nutrient-profile.model';

// Takes per100g directly rather than a whole Food: the only thing this ever needed was that one
// field, and requiring a full Food (id, name, source, createdAt...) just to scale some numbers
// made every caller assemble or fake fields it had no use for (see #27's add-item flow).
export function computeNutrients(per100g: NutrientProfile, quantityG: number): NutrientProfile {
  const factor = quantityG / 100;

  // Object.entries loses the precise key type; per100g is already a well-formed NutrientProfile,
  // so restoring it here is safe — every key really is one of its keys.
  const entries = Object.entries(per100g) as Array<[keyof NutrientProfile, number]>;
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

export interface MacroDistributionEntry {
  label: string;
  percentOfKcal: number;
}

const KCAL_PER_G_PROTEIN = 4;
const KCAL_PER_G_CARBS = 4;
const KCAL_PER_G_FAT = 9;

// DailyTrainer_SPEC.md section 7 — "répartition macro en % des kcal totaux". Grams aren't kcal,
// so each macro's gram total is converted via the standard Atwater factors (4 kcal/g for
// protein and carbs, 9 kcal/g for fat) before being expressed as a share of totals.kcal.
export function computeMacroDistribution(totals: NutrientProfile): MacroDistributionEntry[] {
  const entries: ReadonlyArray<[string, number]> = [
    ['Protéines', totals.protein_g * KCAL_PER_G_PROTEIN],
    ['Glucides', totals.carbs_g * KCAL_PER_G_CARBS],
    ['Lipides', totals.fat_g * KCAL_PER_G_FAT],
  ];

  if (totals.kcal <= 0) {
    return entries.map(([label]) => ({ label, percentOfKcal: 0 }));
  }

  return entries.map(([label, kcalFromMacro]) => ({
    label,
    percentOfKcal: (kcalFromMacro / totals.kcal) * 100,
  }));
}
