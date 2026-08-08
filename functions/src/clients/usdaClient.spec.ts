import { searchUsda } from './usdaClient';

describe('searchUsda', () => {
  const fetchMock = jest.fn();

  beforeEach(() => {
    fetchMock.mockReset();
    (globalThis as { fetch: typeof fetch }).fetch = fetchMock;
  });

  it('maps a well-formed food to a result', async () => {
    fetchMock.mockResolvedValue(
      jsonResponse({
        foods: [
          {
            description: 'Carrots, raw',
            fdcId: 170393,
            foodNutrients: [
              { nutrientName: 'Energy', value: 41 },
              { nutrientName: 'Protein', value: 0.93 },
              { nutrientName: 'Carbohydrate, by difference', value: 9.58 },
              { nutrientName: 'Total lipid (fat)', value: 0.24 },
              { nutrientName: 'Fiber, total dietary', value: 2.8 },
              { nutrientName: 'Vitamin A, RAE', value: 835 },
              { nutrientName: 'Potassium, K', value: 320 }
            ]
          }
        ]
      })
    );

    const results = await searchUsda('carrot', 'test-key');

    expect(results).toEqual([
      {
        name: 'Carrots, raw',
        sourceId: '170393',
        per100g: {
          kcal: 41,
          protein_g: 0.93,
          carbs_g: 9.58,
          fat_g: 0.24,
          fiber_g: 2.8,
          sugar_g: undefined,
          sodium_mg: undefined,
          vitaminA_mcg: 835,
          vitaminC_mg: undefined,
          vitaminD_mcg: undefined,
          vitaminB12_mcg: undefined,
          calcium_mg: undefined,
          iron_mg: undefined,
          magnesium_mg: undefined,
          potassium_mg: 320,
          zinc_mg: undefined
        }
      }
    ]);
  });

  it('skips foods missing a required macro (kcal, protein, carbs, or fat)', async () => {
    fetchMock.mockResolvedValue(
      jsonResponse({
        foods: [
          {
            description: 'Missing fat',
            fdcId: 1,
            foodNutrients: [
              { nutrientName: 'Energy', value: 100 },
              { nutrientName: 'Protein', value: 5 },
              { nutrientName: 'Carbohydrate, by difference', value: 10 }
            ]
          },
          { description: 'No nutrients at all', fdcId: 2 }
        ]
      })
    );

    expect(await searchUsda('incomplete', 'test-key')).toEqual([]);
  });

  it('returns an empty array when the response has no foods field', async () => {
    fetchMock.mockResolvedValue(jsonResponse({}));

    expect(await searchUsda('nothing', 'test-key')).toEqual([]);
  });

  it('throws when the HTTP response is not ok', async () => {
    fetchMock.mockResolvedValue({ ok: false, status: 403, json: () => Promise.resolve({}) });

    await expect(searchUsda('carrot', 'bad-key')).rejects.toThrow(
      'USDA FoodData Central search failed with status 403'
    );
  });

  it('sends the query and api_key as request parameters', async () => {
    fetchMock.mockResolvedValue(jsonResponse({ foods: [] }));

    await searchUsda('carrot', 'secret-key');

    const requestedUrl = fetchMock.mock.calls[0]?.[0] as URL;
    expect(requestedUrl.origin + requestedUrl.pathname).toBe(
      'https://api.nal.usda.gov/fdc/v1/foods/search'
    );
    expect(requestedUrl.searchParams.get('query')).toBe('carrot');
    expect(requestedUrl.searchParams.get('api_key')).toBe('secret-key');
  });
});

function jsonResponse(body: unknown): Pick<Response, 'ok' | 'status' | 'json'> {
  return { ok: true, status: 200, json: () => Promise.resolve(body) };
}
