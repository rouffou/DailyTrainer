import { Injectable, inject } from '@angular/core';
import {
  addDoc,
  collection,
  collectionData,
  deleteDoc,
  doc,
  Firestore,
  FirestoreDataConverter,
  WithFieldValue,
} from '@angular/fire/firestore';
import { combineLatest, map, Observable, of, switchMap } from 'rxjs';

import { AuthService } from '../auth/auth.service';
import { aggregateTotals } from '../domain/nutrition-calc.service';
import type { Meal } from '../models/meal.model';
import type { MealItem } from '../models/meal-item.model';
import type { Result } from '../models/result.model';

type MealDocument = Omit<Meal, 'items'>;

function makeConverter<T extends object>(): FirestoreDataConverter<T> {
  return {
    toFirestore(value: WithFieldValue<T>): WithFieldValue<T> {
      return value;
    },
    fromFirestore(snapshot, options): T {
      return { ...snapshot.data(options), id: snapshot.id } as T;
    },
  };
}

const mealDocConverter = makeConverter<MealDocument>();
const mealItemConverter = makeConverter<MealItem>();

// Single entry point for the meals/items subcollections nested under a dailyLogs/{date}
// document (DailyTrainer_SPEC.md section 4.2). Rooted at dailyLogs since that's the
// meaningful collection for STANDARDS.md section 2.4's "one repository per root collection" —
// meals and items don't exist independently of the day they belong to.
@Injectable({ providedIn: 'root' })
export class MealRepository {
  private readonly firestore = inject(Firestore);
  private readonly authService = inject(AuthService);

  getMeals(date: string): Observable<Meal[]> {
    const mealDocs = collectionData<MealDocument, 'id'>(
      collection(this.firestore, this.mealsPath(date)).withConverter(mealDocConverter),
      { idField: 'id' },
    );

    return mealDocs.pipe(
      switchMap((meals) =>
        meals.length === 0
          ? of([])
          : combineLatest(
              meals.map((meal) =>
                this.getItems(date, meal.id).pipe(map((items): Meal => ({ ...meal, items }))),
              ),
            ),
      ),
    );
  }

  async createMeal(date: string, label: string): Promise<Result<string>> {
    try {
      const ref = await addDoc(collection(this.firestore, this.mealsPath(date)), {
        label,
        totals: aggregateTotals([]),
      });
      return { ok: true, value: ref.id };
    } catch (error) {
      return { ok: false, error: error instanceof Error ? error : new Error(String(error)) };
    }
  }

  async addItem(date: string, mealId: string, item: Omit<MealItem, 'id'>): Promise<Result<void>> {
    try {
      await addDoc(collection(this.firestore, this.itemsPath(date, mealId)), item);
      return { ok: true, value: undefined };
    } catch (error) {
      return { ok: false, error: error instanceof Error ? error : new Error(String(error)) };
    }
  }

  async deleteItem(date: string, mealId: string, itemId: string): Promise<Result<void>> {
    try {
      await deleteDoc(doc(this.firestore, `${this.itemsPath(date, mealId)}/${itemId}`));
      return { ok: true, value: undefined };
    } catch (error) {
      return { ok: false, error: error instanceof Error ? error : new Error(String(error)) };
    }
  }

  private getItems(date: string, mealId: string): Observable<MealItem[]> {
    return collectionData<MealItem, 'id'>(
      collection(this.firestore, this.itemsPath(date, mealId)).withConverter(mealItemConverter),
      { idField: 'id' },
    );
  }

  private mealsPath(date: string): string {
    return `users/${this.requireUid()}/dailyLogs/${date}/meals`;
  }

  private itemsPath(date: string, mealId: string): string {
    return `${this.mealsPath(date)}/${mealId}/items`;
  }

  private requireUid(): string {
    const uid = this.authService.currentUser()?.uid;
    if (!uid) {
      throw new Error('MealRepository requires an authenticated user.');
    }
    return uid;
  }
}
