export interface OpenFoodFactsResult {
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
  };
}

interface OpenFoodFactsNutriments {
  'energy-kcal_100g'?: number;
  proteins_100g?: number;
  carbohydrates_100g?: number;
  fat_100g?: number;
  fiber_100g?: number;
  sugars_100g?: number;
  // OFF reports sodium in grams per 100g; NutrientProfile.sodium_mg is in milligrams.
  sodium_100g?: number;
}

interface OpenFoodFactsProduct {
  product_name?: string;
  code?: string;
  nutriments?: OpenFoodFactsNutriments;
}

interface OpenFoodFactsSearchResponse {
  products?: OpenFoodFactsProduct[];
}

const SEARCH_URL = 'https://world.openfoodfacts.org/cgi/search.pl';
const PAGE_SIZE = 5;

export async function searchOpenFoodFacts(query: string): Promise<OpenFoodFactsResult[]> {
  const url = new URL(SEARCH_URL);
  url.searchParams.set('search_terms', query);
  url.searchParams.set('json', '1');
  url.searchParams.set('page_size', String(PAGE_SIZE));

  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Open Food Facts search failed with status ${response.status}`);
  }

  const body = (await response.json()) as OpenFoodFactsSearchResponse;
  return (body.products ?? []).map(toResult).filter((result) => result !== null);
}

// A product missing kcal, protein, carbs, or fat can't populate a valid NutrientProfile
// (those are its only required fields) — skip it rather than return a half-formed result.
function toResult(product: OpenFoodFactsProduct): OpenFoodFactsResult | null {
  const nutriments = product.nutriments;
  const kcal = nutriments?.['energy-kcal_100g'];
  const proteinG = nutriments?.proteins_100g;
  const carbsG = nutriments?.carbohydrates_100g;
  const fatG = nutriments?.fat_100g;

  if (
    !nutriments ||
    !product.product_name ||
    !product.code ||
    kcal === undefined ||
    proteinG === undefined ||
    carbsG === undefined ||
    fatG === undefined
  ) {
    return null;
  }

  return {
    name: product.product_name,
    sourceId: product.code,
    per100g: {
      kcal,
      protein_g: proteinG,
      carbs_g: carbsG,
      fat_g: fatG,
      fiber_g: nutriments.fiber_100g,
      sugar_g: nutriments.sugars_100g,
      sodium_mg: nutriments.sodium_100g === undefined ? undefined : nutriments.sodium_100g * 1000,
    },
  };
}
