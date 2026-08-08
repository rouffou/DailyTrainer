import type { ActivityLevel, UserProfile } from '../models/user-profile.model';
import type { NutrientProfile } from '../models/nutrient-profile.model';

// DailyTrainer_SPEC.md section 5.3 — AJR adulte par défaut. sodium_mg est un plafond à ne
// pas dépasser, pas un objectif à atteindre (cf. commentaire d'origine dans la spec).
export const DEFAULT_TARGETS: NutrientProfile = {
  kcal: 2000,
  protein_g: 70,
  carbs_g: 260,
  fat_g: 70,
  fiber_g: 30,
  vitaminC_mg: 80,
  vitaminA_mcg: 800,
  calcium_mg: 800,
  iron_mg: 14,
  sodium_mg: 2000,
};

const MALE_BMR_OFFSET = 5;
const FEMALE_BMR_OFFSET = -161;

// Mifflin-St Jeor: BMR = 10*weight(kg) + 6.25*height(cm) - 5*age(years) + sex offset.
export function computeBmr(profile: UserProfile): number {
  const base = 10 * profile.weightKg + 6.25 * profile.heightCm - 5 * profile.age;
  return base + (profile.sex === 'male' ? MALE_BMR_OFFSET : FEMALE_BMR_OFFSET);
}

const ACTIVITY_MULTIPLIERS: Record<ActivityLevel, number> = {
  sedentary: 1.2,
  light: 1.375,
  moderate: 1.55,
  active: 1.725,
  veryActive: 1.9,
};

export function computeTdee(profile: UserProfile): number {
  return computeBmr(profile) * ACTIVITY_MULTIPLIERS[profile.activityLevel];
}
