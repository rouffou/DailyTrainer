import type { Meal } from './meal.model';
import type { NutrientProfile } from './nutrient-profile.model';

export interface DailyLog {
  id: string;
  date: string;
  meals: Meal[];
  totals: NutrientProfile;
  targets?: NutrientProfile;
}
