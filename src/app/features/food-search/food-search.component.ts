import { Component, inject, output, signal } from '@angular/core';
import { toObservable, toSignal } from '@angular/core/rxjs-interop';
import {
  MatAutocompleteModule,
  MatAutocompleteSelectedEvent,
} from '@angular/material/autocomplete';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { from, map, Observable, of, switchMap, take } from 'rxjs';

import { FoodRepository } from '../../core/data-access/food.repository';
import { SearchFoodService } from '../../core/data-access/search-food.service';
import { parseFoodInput } from '../../core/domain/food-input-parser';
import type { Food } from '../../core/models/food.model';
import type { FoodSearchResult } from '../../core/models/food-search-result.model';
import type { FoodSearchSelection } from '../../core/models/food-search-selection.model';

type Candidate = Food | FoodSearchResult;

// Angular Material's autocomplete already implements the accessible combobox/listbox pattern
// (STANDARDS.md section 3's "Angular Aria... pour tout composant interactif custom" is about
// hand-built widgets — mat-autocomplete isn't one) so it's used directly rather than
// hand-rolled on top of @angular/cdk/listbox.
@Component({
  selector: 'dt-food-search',
  imports: [MatFormFieldModule, MatInputModule, MatAutocompleteModule],
  templateUrl: './food-search.component.html',
  styleUrl: './food-search.component.css',
})
export class FoodSearchComponent {
  private readonly foodRepository = inject(FoodRepository);
  private readonly searchFoodService = inject(SearchFoodService);

  protected readonly query = signal('');
  readonly foodSelected = output<FoodSearchSelection>();

  protected readonly candidates = toSignal(
    toObservable(this.query).pipe(switchMap((query) => this.searchCandidates(query))),
    { initialValue: [] as Candidate[] },
  );

  protected onQueryInput(event: Event): void {
    this.query.set((event.target as HTMLInputElement).value);
  }

  protected onOptionSelected(event: MatAutocompleteSelectedEvent): void {
    const parsed = parseFoodInput(this.query());
    if (!parsed) {
      return;
    }
    this.foodSelected.emit({ parsed, food: event.option.value as Candidate });
  }

  protected displayFood(food: Candidate | null): string {
    return food?.name ?? '';
  }

  // Local cache first (FoodRepository), external APIs (searchFood) only when nothing local
  // matches — DailyTrainer_SPEC.md section 5.1 step 2.
  private searchCandidates(query: string): Observable<Candidate[]> {
    const parsed = parseFoodInput(query);
    if (!parsed) {
      return of([]);
    }

    return this.foodRepository.searchByNamePrefix(parsed.name).pipe(
      take(1),
      switchMap((localResults) =>
        localResults.length > 0 ? of(localResults) : this.searchExternally(parsed.name),
      ),
    );
  }

  private searchExternally(name: string): Observable<Candidate[]> {
    return from(this.searchFoodService.search(name)).pipe(
      map((result) => (result.ok ? result.value : [])),
    );
  }
}
