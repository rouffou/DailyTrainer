import { HttpsError, onCall } from 'firebase-functions/v2/https';

import { resolveFoodSearch } from './resolveFoodSearch';

export function extractQuery(data: unknown): string {
  const query = (data as { query?: unknown } | null)?.query;
  if (typeof query !== 'string' || query.trim().length === 0) {
    throw new HttpsError('invalid-argument', 'query must be a non-empty string');
  }
  return query;
}

export const searchFood = onCall({ secrets: ['USDA_API_KEY'] }, async (request) => {
  const query = extractQuery(request.data);

  const apiKey = process.env.USDA_API_KEY;
  if (!apiKey) {
    throw new HttpsError('failed-precondition', 'USDA_API_KEY is not configured');
  }

  return resolveFoodSearch(query, apiKey);
});
