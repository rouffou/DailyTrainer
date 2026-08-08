import { recalculateTotals } from './recalculateTotals';

type RecalculateTotalsEvent = Parameters<typeof recalculateTotals.run>[0];

function docSnapshot(data: Record<string, unknown>) {
  return { data: () => data };
}

const setMock = jest.fn();
const docMock = jest.fn(() => ({ set: setMock }));
const getMock = jest.fn();
const collectionMock = jest.fn(() => ({ get: getMock }));

jest.mock('firebase-admin/firestore', () => ({
  getFirestore: () => ({ collection: collectionMock, doc: docMock })
}));

function makeEvent(params: {
  uid: string;
  date: string;
  mealId: string;
  itemId: string;
}): RecalculateTotalsEvent {
  return { params } as unknown as RecalculateTotalsEvent;
}

describe('recalculateTotals', () => {
  beforeEach(() => {
    setMock.mockReset();
    docMock.mockClear();
    getMock.mockReset();
    collectionMock.mockClear();
  });

  it('sums the items of a meal into its totals, then the meals of a day into its totals', async () => {
    getMock
      .mockResolvedValueOnce({
        docs: [
          docSnapshot({ computed: { kcal: 100, protein_g: 10, carbs_g: 5, fat_g: 2, fiber_g: 1 } }),
          docSnapshot({
            computed: { kcal: 50, protein_g: 5, carbs_g: 2, fat_g: 1, fiber_g: 0.5, vitaminC_mg: 20 }
          })
        ]
      })
      .mockResolvedValueOnce({
        docs: [
          docSnapshot({ totals: { kcal: 150, protein_g: 15, carbs_g: 7, fat_g: 3, fiber_g: 1.5 } })
        ]
      });

    await recalculateTotals.run(
      makeEvent({ uid: 'alice', date: '2026-08-08', mealId: 'meal1', itemId: 'item1' })
    );

    expect(collectionMock).toHaveBeenNthCalledWith(
      1,
      'users/alice/dailyLogs/2026-08-08/meals/meal1/items'
    );
    expect(docMock).toHaveBeenNthCalledWith(1, 'users/alice/dailyLogs/2026-08-08/meals/meal1');
    expect(setMock).toHaveBeenNthCalledWith(
      1,
      { totals: { kcal: 150, protein_g: 15, carbs_g: 7, fat_g: 3, fiber_g: 1.5, vitaminC_mg: 20 } },
      { merge: true }
    );

    expect(collectionMock).toHaveBeenNthCalledWith(2, 'users/alice/dailyLogs/2026-08-08/meals');
    expect(docMock).toHaveBeenNthCalledWith(2, 'users/alice/dailyLogs/2026-08-08');
    expect(setMock).toHaveBeenNthCalledWith(
      2,
      {
        date: '2026-08-08',
        totals: { kcal: 150, protein_g: 15, carbs_g: 7, fat_g: 3, fiber_g: 1.5 }
      },
      { merge: true }
    );
  });

  it('zeroes the totals when the last item of a meal is deleted', async () => {
    getMock.mockResolvedValueOnce({ docs: [] }).mockResolvedValueOnce({ docs: [] });

    await recalculateTotals.run(
      makeEvent({ uid: 'alice', date: '2026-08-08', mealId: 'meal1', itemId: 'item1' })
    );

    expect(setMock).toHaveBeenNthCalledWith(
      1,
      { totals: { kcal: 0, protein_g: 0, carbs_g: 0, fat_g: 0, fiber_g: 0 } },
      { merge: true }
    );
  });
});
