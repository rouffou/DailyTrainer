import type { NutrientProfile } from './nutrient-profile.model';

export interface MealItem {
  id: string;
  foodId: string;
  foodName: string;
  quantity_g: number;
  computed: NutrientProfile;
}
