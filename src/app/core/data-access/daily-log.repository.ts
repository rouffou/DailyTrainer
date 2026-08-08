import { Injectable, inject } from '@angular/core';
import {
  doc,
  docData,
  Firestore,
  FirestoreDataConverter,
  setDoc,
  WithFieldValue,
} from '@angular/fire/firestore';
import { combineLatest, map, Observable } from 'rxjs';

import { AuthService } from '../auth/auth.service';
import type { DailyLog } from '../models/daily-log.model';
import type { NutrientProfile } from '../models/nutrient-profile.model';
import type { Result } from '../models/result.model';
import { MealRepository } from './meal.repository';

type DailyLogDocument = Omit<DailyLog, 'meals'>;

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

  async upsert(
    date: string,
    fields: { totals: NutrientProfile; targets?: NutrientProfile },
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
