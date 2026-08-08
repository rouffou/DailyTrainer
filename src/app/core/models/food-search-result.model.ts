import type { NutrientProfile } from './nutrient-profile.model';

export interface FoodSearchResult {
  name: string;
  source: 'openfoodfacts' | 'usda';
  sourceId: string;
  per100g: NutrientProfile;
}
