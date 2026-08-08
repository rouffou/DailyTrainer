import type { Food } from './food.model';
import type { FoodSearchResult } from './food-search-result.model';
import type { ParsedFoodInput } from './parsed-food-input.model';

// The food is a Food (already cached in users/{uid}/foods, has an id) when it came from
// FoodRepository, or a FoodSearchResult (not cached yet) when it came from the searchFood
// callable — callers can tell them apart with `'id' in food`.
export interface FoodSearchSelection {
  parsed: ParsedFoodInput;
  food: Food | FoodSearchResult;
}
