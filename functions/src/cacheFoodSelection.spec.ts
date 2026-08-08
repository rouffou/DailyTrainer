import { HttpsError } from 'firebase-functions/v2/https';
import type { CallableRequest } from 'firebase-functions/v2/https';

import { cacheFoodSelection, extractSelection } from './cacheFoodSelection';
import type { FoodSearchResult } from './resolveFoodSearch';

const setMock = jest.fn();
const docMock = jest.fn(() => ({ set: setMock }));
const serverTimestampMock = jest.fn(() => 'SERVER_TIMESTAMP');

jest.mock('firebase-admin/firestore', () => ({
  getFirestore: () => ({ doc: docMock }),
  FieldValue: { serverTimestamp: () => serverTimestampMock() }
}));

const VALID_SELECTION: FoodSearchResult = {
  name: 'Bacon Aldi',
  source: 'openfoodfacts',
  sourceId: '1234567890123',
  per100g: { kcal: 350, protein_g: 25, carbs_g: 1, fat_g: 28 }
};

describe('extractSelection', () => {
  it('returns the selection unchanged when it is well-formed', () => {
    expect(extractSelection(VALID_SELECTION)).toEqual(VALID_SELECTION);
  });

  it('throws HttpsError when data is null', () => {
    expect(() => extractSelection(null)).toThrow(HttpsError);
  });

  it('throws HttpsError when source is not a known value', () => {
    expect(() => extractSelection({ ...VALID_SELECTION, source: 'wikipedia' })).toThrow(
      HttpsError
    );
  });

  it('throws HttpsError when per100g is missing a required macro', () => {
    const incompletePer100g = { kcal: 350, protein_g: 25, carbs_g: 1 };
    expect(() => extractSelection({ ...VALID_SELECTION, per100g: incompletePer100g })).toThrow(
      HttpsError
    );
  });
});

describe('cacheFoodSelection', () => {
  beforeEach(() => {
    setMock.mockReset();
    docMock.mockClear();
  });

  it('rejects unauthenticated requests', async () => {
    const request = { data: VALID_SELECTION, auth: undefined } as CallableRequest<unknown>;

    await expect(cacheFoodSelection.run(request)).rejects.toThrow(HttpsError);
    expect(docMock).not.toHaveBeenCalled();
  });

  it('writes the selection to users/{uid}/foods/{sourceId} and returns its id', async () => {
    const request = {
      data: VALID_SELECTION,
      auth: { uid: 'alice' }
    } as CallableRequest<unknown>;

    const result = await cacheFoodSelection.run(request);

    expect(docMock).toHaveBeenCalledWith('users/alice/foods/1234567890123');
    expect(setMock).toHaveBeenCalledWith(
      {
        name: 'Bacon Aldi',
        source: 'openfoodfacts',
        sourceId: '1234567890123',
        per100g: VALID_SELECTION.per100g,
        ownerUid: 'alice',
        createdAt: 'SERVER_TIMESTAMP'
      },
      { merge: true }
    );
    expect(result).toEqual({ id: '1234567890123' });
  });
});
