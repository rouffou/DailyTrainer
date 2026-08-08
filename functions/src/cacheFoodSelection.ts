import { FieldValue, getFirestore } from 'firebase-admin/firestore';
import { HttpsError, onCall } from 'firebase-functions/v2/https';

import type { FoodSearchResult } from './resolveFoodSearch';

const REQUIRED_MACRO_KEYS = ['kcal', 'protein_g', 'carbs_g', 'fat_g'] as const;

// Validates just enough of the shape to write a well-formed users/{uid}/foods document —
// this is user-supplied callable input, not a value we produced ourselves, so it can't be
// trusted the way an internal function's return value can.
export function extractSelection(data: unknown): FoodSearchResult {
  const candidate = data as Partial<FoodSearchResult> | null;

  if (
    !candidate ||
    typeof candidate.name !== 'string' ||
    typeof candidate.sourceId !== 'string' ||
    (candidate.source !== 'openfoodfacts' && candidate.source !== 'usda') ||
    typeof candidate.per100g !== 'object' ||
    candidate.per100g === null
  ) {
    throw new HttpsError('invalid-argument', 'Malformed food selection.');
  }

  const per100g = candidate.per100g as Record<string, unknown>;
  const hasAllRequiredMacros = REQUIRED_MACRO_KEYS.every((key) => typeof per100g[key] === 'number');
  if (!hasAllRequiredMacros) {
    throw new HttpsError('invalid-argument', 'Malformed food selection: missing required macro.');
  }

  return candidate as FoodSearchResult;
}

// DailyTrainer_SPEC.md section 5.1 step 5: once the user picks a candidate, cache it in
// users/{uid}/foods so the same product never needs an external API call again. Keyed by
// sourceId (not an auto-generated ID) so re-resolving the same product upserts in place
// instead of creating duplicates.
export const cacheFoodSelection = onCall(async (request) => {
  if (!request.auth) {
    throw new HttpsError('unauthenticated', 'Sign in required.');
  }
  const selection = extractSelection(request.data);
  const uid = request.auth.uid;

  await getFirestore()
    .doc(`users/${uid}/foods/${selection.sourceId}`)
    .set(
      {
        name: selection.name,
        source: selection.source,
        sourceId: selection.sourceId,
        per100g: selection.per100g,
        ownerUid: uid,
        createdAt: FieldValue.serverTimestamp()
      },
      { merge: true }
    );

  return { id: selection.sourceId };
});
