import { Injectable } from '@angular/core';

import { environment } from '../../../environments/environment';
import type { FoodSearchResult } from '../models/food-search-result.model';
import type { Result } from '../models/result.model';
import { resolveFoodSearch } from './resolve-food-search';

// Calls USDA/Open Food Facts directly from the browser instead of via the searchFood Cloud
// Function (functions/src/searchFood.ts, #19) — Cloud Functions require the Blaze plan, which
// isn't enabled yet (issue #36). This exposes the USDA key client-side; revisit once Blaze is
// enabled and functions/src/searchFood.ts can be deployed again.
@Injectable({ providedIn: 'root' })
export class SearchFoodService {
  async search(query: string): Promise<Result<FoodSearchResult[]>> {
    try {
      const results = await resolveFoodSearch(query, environment.usdaApiKey);
      // USDA/OFF don't always report fiber, so per100g.fiber_g can genuinely be missing here —
      // same looseness the old httpsCallable<_, FoodSearchResult[]> return type already had,
      // just no longer silently accepted by an unchecked generic.
      return { ok: true, value: results as FoodSearchResult[] };
    } catch (error) {
      return { ok: false, error: error instanceof Error ? error : new Error(String(error)) };
    }
  }
}
