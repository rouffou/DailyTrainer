import { Injectable, inject } from '@angular/core';
import {
  collection,
  collectionData,
  doc,
  docData,
  Firestore,
  FirestoreDataConverter,
  orderBy,
  query,
  setDoc,
  where,
  WithFieldValue,
} from '@angular/fire/firestore';
import { combineLatest, map, Observable } from 'rxjs';

import { AuthService } from '../auth/auth.service';
import type { DailyLog } from '../models/daily-log.model';
import type { NutrientProfile } from '../models/nutrient-profile.model';
import type { Result } from '../models/result.model';
import { MealRepository } from './meal.repository';

// meals (and their items) live in subcollections MealRepository owns — a range query returns
// this lighter shape rather than a full DailyLog, so features/history isn't forced to fan out
// a getMeals() call per day in the range just to show a totals-over-time curve (#34).
export type DailyLogDocument = Omit<DailyLog, 'meals'>;

const dailyLogDocConverter: FirestoreDataConverter<DailyLogDocument> = {
  toFirestore(dailyLog: WithFieldValue<DailyLogDocument>): WithFieldValue<DailyLogDocument> {
    return dailyLog;
  },
  fromFirestore(snapshot, options): DailyLogDocument {
    return { ...snapshot.data(options), id: snapshot.id } as DailyLogDocument;
  },
};

// Single entry point for users/{uid}/dailyLogs (DailyTrainer_SPEC.md section 4.2). The
// document itself only holds date/totals/targets — meals (and their items) live in
// MealRepository's subcollections and are folded in here so callers get a fully-formed
// DailyLog matching the shape in core/models, instead of having to compose the two
// repositories themselves on every read.
@Injectable({ providedIn: 'root' })
export class DailyLogRepository {
  private readonly firestore = inject(Firestore);
  private readonly authService = inject(AuthService);
  private readonly mealRepository = inject(MealRepository);

  get(date: string): Observable<DailyLog | undefined> {
    const uid = this.requireUid();
    const dailyLogDoc$ = docData<DailyLogDocument>(
      doc(this.firestore, `users/${uid}/dailyLogs/${date}`).withConverter(dailyLogDocConverter),
      { idField: 'id' },
    );

    return combineLatest([dailyLogDoc$, this.mealRepository.getMeals(date)]).pipe(
      map(([dailyLogDoc, meals]) => (dailyLogDoc ? { ...dailyLogDoc, meals } : undefined)),
    );
  }

  // DailyTrainer_SPEC.md section 6 — where('date', '>=', from).where('date', '<=', to), for
  // features/history's evolution chart (#33/#34). Both bounds are on `date`, and orderBy is on
  // that same field, so this only needs Firestore's automatic single-field index — no entry in
  // firestore.indexes.json required.
  getRange(fromDate: string, toDate: string): Observable<DailyLogDocument[]> {
    const uid = this.requireUid();
    const rangeQuery = query(
      collection(this.firestore, `users/${uid}/dailyLogs`).withConverter(dailyLogDocConverter),
      where('date', '>=', fromDate),
      where('date', '<=', toDate),
      orderBy('date'),
    );
    return collectionData<DailyLogDocument, 'id'>(rangeQuery, { idField: 'id' });
  }

  async upsert(
    date: string,
    fields: { totals?: NutrientProfile; targets?: NutrientProfile },
  ): Promise<Result<void>> {
    const uid = this.requireUid();
    try {
      await setDoc(
        doc(this.firestore, `users/${uid}/dailyLogs/${date}`),
        { date, ...fields },
        { merge: true },
      );
      return { ok: true, value: undefined };
    } catch (error) {
      return { ok: false, error: error instanceof Error ? error : new Error(String(error)) };
    }
  }

  private requireUid(): string {
    const uid = this.authService.currentUser()?.uid;
    if (!uid) {
      throw new Error('DailyLogRepository requires an authenticated user.');
    }
    return uid;
  }
}
