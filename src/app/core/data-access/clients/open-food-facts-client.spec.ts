import { searchOpenFoodFacts } from './open-food-facts-client';

describe('searchOpenFoodFacts', () => {
  const fetchMock = jest.fn();

  beforeEach(() => {
    fetchMock.mockReset();
    (globalThis as { fetch: typeof fetch }).fetch = fetchMock;
  });

  it('maps a well-formed product to a result, converting sodium from g to mg', async () => {
    fetchMock.mockResolvedValue(
      jsonResponse({
        products: [
          {
            product_name: 'Bacon Aldi',
            code: '1234567890123',
            nutriments: {
              'energy-kcal_100g': 350,
              proteins_100g: 25,
              carbohydrates_100g: 1,
              fat_100g: 28,
              fiber_100g: 0,
              sugars_100g: 0.5,
              sodium_100g: 1.8,
            },
          },
        ],
      }),
    );

    const results = await searchOpenFoodFacts('bacon aldi');

    expect(results).toEqual([
      {
        name: 'Bacon Aldi',
        sourceId: '1234567890123',
        per100g: {
          kcal: 350,
          protein_g: 25,
          carbs_g: 1,
          fat_g: 28,
          fiber_g: 0,
          sugar_g: 0.5,
          sodium_mg: 1800,
        },
      },
    ]);
  });

  it('omits optional nutrients that are absent from the response', async () => {
    fetchMock.mockResolvedValue(
      jsonResponse({
        products: [
          {
            product_name: 'Generic product',
            code: '999',
            nutriments: {
              'energy-kcal_100g': 100,
              proteins_100g: 5,
              carbohydrates_100g: 10,
              fat_100g: 2,
            },
          },
        ],
      }),
    );

    const [result] = await searchOpenFoodFacts('generic');

    expect(result?.per100g.fiber_g).toBeUndefined();
    expect(result?.per100g.sugar_g).toBeUndefined();
    expect(result?.per100g.sodium_mg).toBeUndefined();
  });

  it('skips products missing a required macro (kcal, protein, carbs, or fat)', async () => {
    fetchMock.mockResolvedValue(
      jsonResponse({
        products: [
          {
            product_name: 'Missing fat',
            code: '1',
            nutriments: { 'energy-kcal_100g': 100, proteins_100g: 5, carbohydrates_100g: 10 },
          },
          { product_name: 'No nutriments at all', code: '2' },
        ],
      }),
    );

    const results = await searchOpenFoodFacts('incomplete');

    expect(results).toEqual([]);
  });

  it('returns an empty array when the response has no products field', async () => {
    fetchMock.mockResolvedValue(jsonResponse({}));

    expect(await searchOpenFoodFacts('nothing')).toEqual([]);
  });

  it('throws when the HTTP response is not ok', async () => {
    fetchMock.mockResolvedValue({ ok: false, status: 503, json: () => Promise.resolve({}) });

    await expect(searchOpenFoodFacts('bacon')).rejects.toThrow(
      'Open Food Facts search failed with status 503',
    );
  });

  it('builds the request URL with the expected query parameters', async () => {
    fetchMock.mockResolvedValue(jsonResponse({ products: [] }));

    await searchOpenFoodFacts('bacon aldi');

    const requestedUrl = fetchMock.mock.calls[0]?.[0] as URL;
    expect(requestedUrl.origin + requestedUrl.pathname).toBe(
      'https://world.openfoodfacts.org/cgi/search.pl',
    );
    expect(requestedUrl.searchParams.get('search_terms')).toBe('bacon aldi');
    expect(requestedUrl.searchParams.get('json')).toBe('1');
  });
});

function jsonResponse(body: unknown): Pick<Response, 'ok' | 'status' | 'json'> {
  return { ok: true, status: 200, json: () => Promise.resolve(body) };
}
