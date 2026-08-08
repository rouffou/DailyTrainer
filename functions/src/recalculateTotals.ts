import { getFirestore } from 'firebase-admin/firestore';
import { onDocumentWritten } from 'firebase-functions/v2/firestore';

interface NutrientTotals {
  kcal: number;
  protein_g: number;
  carbs_g: number;
  fat_g: number;
  fiber_g: number;
  [key: string]: number;
}

const REQUIRED_KEYS = ['kcal', 'protein_g', 'carbs_g', 'fat_g', 'fiber_g'] as const;

// Same summing rule as core/domain/nutrition-calc.service.ts's aggregateTotals() (#14) —
// required fields always present (0 for an empty list), optional micronutrients summed when
// present on at least one profile. Reimplemented here rather than imported: functions/ is a
// separate deployable with its own tsconfig/bundle, not part of the Angular app's module graph
// (same reasoning as the client per100g types in #17/#18).
function sumProfiles(profiles: Record<string, unknown>[]): NutrientTotals {
  const totals: Record<string, number> = {};
  for (const key of REQUIRED_KEYS) {
    totals[key] = 0;
  }
  for (const profile of profiles) {
    for (const [key, value] of Object.entries(profile)) {
      if (typeof value === 'number') {
        totals[key] = (totals[key] ?? 0) + value;
      }
    }
  }
  return totals as NutrientTotals;
}

// DailyTrainer_SPEC.md section 5.2: recalculate Meal.totals from its items, then
// DailyLog.totals from its meals, on every item write (create/update/delete) — the server-side
// backstop for consistency the spec calls for, on top of whatever the client computes
// optimistically. Triggered on items/{itemId} specifically, so writing the recomputed meal/
// dailyLog totals here never re-triggers this same function (different document paths).
export const recalculateTotals = onDocumentWritten(
  'users/{uid}/dailyLogs/{date}/meals/{mealId}/items/{itemId}',
  async (event) => {
    const { uid, date, mealId } = event.params;
    const db = getFirestore();

    const itemsSnapshot = await db
      .collection(`users/${uid}/dailyLogs/${date}/meals/${mealId}/items`)
      .get();
    const mealTotals = sumProfiles(itemsSnapshot.docs.map((item) => item.data()['computed'] ?? {}));
    await db
      .doc(`users/${uid}/dailyLogs/${date}/meals/${mealId}`)
      .set({ totals: mealTotals }, { merge: true });

    const mealsSnapshot = await db.collection(`users/${uid}/dailyLogs/${date}/meals`).get();
    const dailyLogTotals = sumProfiles(mealsSnapshot.docs.map((meal) => meal.data()['totals'] ?? {}));
    await db
      .doc(`users/${uid}/dailyLogs/${date}`)
      .set({ date, totals: dailyLogTotals }, { merge: true });
  }
);
