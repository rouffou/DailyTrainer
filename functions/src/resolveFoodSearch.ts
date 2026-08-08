import { searchOpenFoodFacts } from './clients/openFoodFactsClient';
import { searchUsda, UsdaResult } from './clients/usdaClient';

export interface FoodSearchResult {
  name: string;
  source: 'openfoodfacts' | 'usda';
  sourceId: string;
  per100g: UsdaResult['per100g'];
}

// DailyTrainer_SPEC.md section 5.1 step 3 names Aldi/Lidl as examples of branded queries that
// should hit Open Food Facts first. Extend this list as real usage surfaces more brands.
const KNOWN_BRANDS = [
  'aldi',
  'lidl',
  'carrefour',
  'leclerc',
  'auchan',
  'monoprix',
  'casino',
  'intermarché',
  'cora',
  'système u',
  'picard'
];

function hasBrand(query: string): boolean {
  const normalized = query.toLowerCase();
  return KNOWN_BRANDS.some((brand) => normalized.includes(brand));
}

async function searchOffTagged(query: string): Promise<FoodSearchResult[]> {
  const results = await searchOpenFoodFacts(query);
  return results.map((result) => ({ ...result, source: 'openfoodfacts' as const }));
}

async function searchUsdaTagged(query: string, apiKey: string): Promise<FoodSearchResult[]> {
  const results = await searchUsda(query, apiKey);
  return results.map((result) => ({ ...result, source: 'usda' as const }));
}

// Branded queries ("bacon aldi") try Open Food Facts first, generic ones ("carotte") try USDA
// first, falling back to the other source only when the first genuinely returns zero results —
// a thrown error (network failure, bad API key) is left to propagate rather than silently
// falling back, per STANDARDS.md section 4.1's explicit error handling rule.
export async function resolveFoodSearch(
  query: string,
  usdaApiKey: string
): Promise<FoodSearchResult[]> {
  const brandFirst = hasBrand(query);
  const primary = brandFirst
    ? () => searchOffTagged(query)
    : () => searchUsdaTagged(query, usdaApiKey);
  const secondary = brandFirst
    ? () => searchUsdaTagged(query, usdaApiKey)
    : () => searchOffTagged(query);

  const primaryResults = await primary();
  if (primaryResults.length > 0) {
    return primaryResults;
  }
  return secondary();
}
