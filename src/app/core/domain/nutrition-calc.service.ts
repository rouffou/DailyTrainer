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
