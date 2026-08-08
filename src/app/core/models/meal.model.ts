import type { MealItem } from './meal-item.model';
import type { NutrientProfile } from './nutrient-profile.model';

export interface Meal {
  id: string;
  label: string;
  items: MealItem[];
  totals: NutrientProfile;
}
