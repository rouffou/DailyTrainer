import { Injectable, inject } from '@angular/core';
import {
  collection,
  collectionData,
  doc,
  Firestore,
  FirestoreDataConverter,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  where,
  WithFieldValue,
} from '@angular/fire/firestore';
import { Observable } from 'rxjs';

import { AuthService } from '../auth/auth.service';
import type { Food } from '../models/food.model';
import type { Result } from '../models/result.model';

// Firestore has no native full-text search; this is the standard prefix-range trick
// (DailyTrainer_SPEC.md section 5.1 step 2) — U+F8FF sorts after any realistic name.
const PREFIX_UPPER_BOUND = '';

// collectionData<Food>(...) needs the query itself typed as Query<Food>, not just a type
// argument at the call site — otherwise it's still really returning raw DocumentData, which
// STANDARDS.md section 2.4 forbids. withConverter() is what actually does the conversion.
const foodConverter: FirestoreDataConverter<Food> = {
  toFirestore(food: WithFieldValue<Food>): WithFieldValue<Food> {
    return food;
  },
  fromFirestore(snapshot, options): Food {
    const data = snapshot.data(options);
    return { ...data, id: snapshot.id } as Food;
  },
};

@Injectable({ providedIn: 'root' })
export class FoodRepository {
  private readonly firestore = inject(Firestore);
  private readonly authService = inject(AuthService);

  searchByNamePrefix(prefix: string): Observable<Food[]> {
    const foodsQuery = query(
      collection(this.firestore, `users/${this.requireUid()}/foods`).withConverter(foodConverter),
      where('name', '>=', prefix),
      where('name', '<=', prefix + PREFIX_UPPER_BOUND),
      orderBy('name'),
    );
    return collectionData<Food, 'id'>(foodsQuery, { idField: 'id' });
  }

  async save(food: Omit<Food, 'createdAt'>): Promise<Result<void>> {
    const uid = this.requireUid();
    try {
      await setDoc(doc(this.firestore, `users/${uid}/foods/${food.id}`), {
        name: food.name,
        source: food.source,
        sourceId: food.sourceId ?? null,
        per100g: food.per100g,
        ownerUid: uid,
        createdAt: serverTimestamp(),
      });
      return { ok: true, value: undefined };
    } catch (error) {
      return { ok: false, error: error instanceof Error ? error : new Error(String(error)) };
    }
  }

  private requireUid(): string {
    const uid = this.authService.currentUser()?.uid;
    if (!uid) {
      throw new Error('FoodRepository requires an authenticated user.');
    }
    return uid;
  }
}
