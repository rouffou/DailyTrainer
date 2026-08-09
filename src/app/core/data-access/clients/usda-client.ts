export interface UsdaResult {
  name: string;
  sourceId: string;
  per100g: {
    kcal: number;
    protein_g: number;
    carbs_g: number;
    fat_g: number;
    fiber_g?: number;
    sugar_g?: number;
    sodium_mg?: number;
    vitaminA_mcg?: number;
    vitaminC_mg?: number;
    vitaminD_mcg?: number;
    vitaminB12_mcg?: number;
    calcium_mg?: number;
    iron_mg?: number;
    magnesium_mg?: number;
    potassium_mg?: number;
    zinc_mg?: number;
  };
}

interface UsdaFoodNutrient {
  nutrientName?: string;
  value?: number;
}

interface UsdaFood {
  description?: string;
  fdcId?: number;
  foodNutrients?: UsdaFoodNutrient[];
}

interface UsdaSearchResponse {
  foods?: UsdaFood[];
}

const SEARCH_URL = 'https://api.nal.usda.gov/fdc/v1/foods/search';
const PAGE_SIZE = 5;

// USDA's own nutrientName strings, as returned by the /foods/search endpoint.
const NUTRIENT_NAMES = {
  kcal: 'Energy',
  protein_g: 'Protein',
  carbs_g: 'Carbohydrate, by difference',
  fat_g: 'Total lipid (fat)',
  fiber_g: 'Fiber, total dietary',
  sugar_g: 'Sugars, total including NLEA',
  sodium_mg: 'Sodium, Na',
  vitaminA_mcg: 'Vitamin A, RAE',
  vitaminC_mg: 'Vitamin C, total ascorbic acid',
  vitaminD_mcg: 'Vitamin D (D2 + D3)',
  vitaminB12_mcg: 'Vitamin B-12',
  calcium_mg: 'Calcium, Ca',
  iron_mg: 'Iron, Fe',
  magnesium_mg: 'Magnesium, Mg',
  potassium_mg: 'Potassium, K',
  zinc_mg: 'Zinc, Zn',
} as const;

// Called directly from the browser (core/data-access/search-food.service.ts) rather than via a
// Cloud Function — see DailyTrainer_SPEC.md section 2 (Authentification/API nutrition row) and
// issue #36: Cloud Functions require the Blaze plan, so the USDA key is temporarily read from
// client config instead. Revisit once Blaze is enabled.
export async function searchUsda(query: string, apiKey: string): Promise<UsdaResult[]> {
  const url = new URL(SEARCH_URL);
  url.searchParams.set('query', query);
  url.searchParams.set('pageSize', String(PAGE_SIZE));
  url.searchParams.set('api_key', apiKey);

  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`USDA FoodData Central search failed with status ${response.status}`);
  }

  const body = (await response.json()) as UsdaSearchResponse;
  return (body.foods ?? []).map(toResult).filter((result) => result !== null);
}

function findNutrientValue(foodNutrients: UsdaFoodNutrient[], name: string): number | undefined {
  return foodNutrients.find((nutrient) => nutrient.nutrientName === name)?.value;
}

// A food missing kcal, protein, carbs, or fat can't populate a valid NutrientProfile
// (those are its only required fields) — skip it rather than return a half-formed result.
function toResult(food: UsdaFood): UsdaResult | null {
  const foodNutrients = food.foodNutrients ?? [];
  const kcal = findNutrientValue(foodNutrients, NUTRIENT_NAMES.kcal);
  const proteinG = findNutrientValue(foodNutrients, NUTRIENT_NAMES.protein_g);
  const carbsG = findNutrientValue(foodNutrients, NUTRIENT_NAMES.carbs_g);
  const fatG = findNutrientValue(foodNutrients, NUTRIENT_NAMES.fat_g);

  if (
    !food.description ||
    food.fdcId === undefined ||
    kcal === undefined ||
    proteinG === undefined ||
    carbsG === undefined ||
    fatG === undefined
  ) {
    return null;
  }

  return {
    name: food.description,
    sourceId: String(food.fdcId),
    per100g: {
      kcal,
      protein_g: proteinG,
      carbs_g: carbsG,
      fat_g: fatG,
      fiber_g: findNutrientValue(foodNutrients, NUTRIENT_NAMES.fiber_g),
      sugar_g: findNutrientValue(foodNutrients, NUTRIENT_NAMES.sugar_g),
      sodium_mg: findNutrientValue(foodNutrients, NUTRIENT_NAMES.sodium_mg),
      vitaminA_mcg: findNutrientValue(foodNutrients, NUTRIENT_NAMES.vitaminA_mcg),
      vitaminC_mg: findNutrientValue(foodNutrients, NUTRIENT_NAMES.vitaminC_mg),
      vitaminD_mcg: findNutrientValue(foodNutrients, NUTRIENT_NAMES.vitaminD_mcg),
      vitaminB12_mcg: findNutrientValue(foodNutrients, NUTRIENT_NAMES.vitaminB12_mcg),
      calcium_mg: findNutrientValue(foodNutrients, NUTRIENT_NAMES.calcium_mg),
      iron_mg: findNutrientValue(foodNutrients, NUTRIENT_NAMES.iron_mg),
      magnesium_mg: findNutrientValue(foodNutrients, NUTRIENT_NAMES.magnesium_mg),
      potassium_mg: findNutrientValue(foodNutrients, NUTRIENT_NAMES.potassium_mg),
      zinc_mg: findNutrientValue(foodNutrients, NUTRIENT_NAMES.zinc_mg),
    },
  };
}
