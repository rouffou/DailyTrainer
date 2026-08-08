import { Injectable, inject } from '@angular/core';
import { Functions, httpsCallable } from '@angular/fire/functions';

import type { FoodSearchResult } from '../models/food-search-result.model';
import type { Result } from '../models/result.model';

// Thin client wrapper around the searchFood callable (functions/src/searchFood.ts, #19) — kept
// in core/data-access alongside the Firestore repositories since it's the same kind of concern
// (fetching Food-shaped data from a backend), just over Functions instead of Firestore.
@Injectable({ providedIn: 'root' })
export class SearchFoodService {
  private readonly functions = inject(Functions);

  async search(query: string): Promise<Result<FoodSearchResult[]>> {
    try {
      const callable = httpsCallable<{ query: string }, FoodSearchResult[]>(
        this.functions,
        'searchFood',
      );
      const response = await callable({ query });
      return { ok: true, value: response.data };
    } catch (error) {
      return { ok: false, error: error instanceof Error ? error : new Error(String(error)) };
    }
  }
}
