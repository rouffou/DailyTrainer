import { searchOpenFoodFacts } from './clients/openFoodFactsClient';
import { searchUsda } from './clients/usdaClient';
import { resolveFoodSearch } from './resolveFoodSearch';

jest.mock('./clients/openFoodFactsClient');
jest.mock('./clients/usdaClient');

const searchOpenFoodFactsMock = jest.mocked(searchOpenFoodFacts);
const searchUsdaMock = jest.mocked(searchUsda);

const OFF_RESULT = {
  name: 'Bacon Aldi',
  sourceId: 'off-1',
  per100g: { kcal: 350, protein_g: 25, carbs_g: 1, fat_g: 28 }
};

const USDA_RESULT = {
  name: 'Carrots, raw',
  sourceId: 'usda-1',
  per100g: { kcal: 41, protein_g: 0.93, carbs_g: 9.58, fat_g: 0.24 }
};

describe('resolveFoodSearch', () => {
  beforeEach(() => {
    searchOpenFoodFactsMock.mockReset();
    searchUsdaMock.mockReset();
  });

  it('tries Open Food Facts first for a branded query and tags results accordingly', async () => {
    searchOpenFoodFactsMock.mockResolvedValue([OFF_RESULT]);

    const results = await resolveFoodSearch('bacon aldi', 'api-key');

    expect(results).toEqual([{ ...OFF_RESULT, source: 'openfoodfacts' }]);
    expect(searchOpenFoodFactsMock).toHaveBeenCalledWith('bacon aldi');
    expect(searchUsdaMock).not.toHaveBeenCalled();
  });

  it('tries USDA first for a generic query and tags results accordingly', async () => {
    searchUsdaMock.mockResolvedValue([USDA_RESULT]);

    const results = await resolveFoodSearch('carotte', 'api-key');

    expect(results).toEqual([{ ...USDA_RESULT, source: 'usda' }]);
    expect(searchUsdaMock).toHaveBeenCalledWith('carotte', 'api-key');
    expect(searchOpenFoodFactsMock).not.toHaveBeenCalled();
  });

  it('falls back to USDA when the branded-first Open Food Facts search finds nothing', async () => {
    searchOpenFoodFactsMock.mockResolvedValue([]);
    searchUsdaMock.mockResolvedValue([USDA_RESULT]);

    const results = await resolveFoodSearch('bacon aldi', 'api-key');

    expect(results).toEqual([{ ...USDA_RESULT, source: 'usda' }]);
  });

  it('falls back to Open Food Facts when the generic-first USDA search finds nothing', async () => {
    searchUsdaMock.mockResolvedValue([]);
    searchOpenFoodFactsMock.mockResolvedValue([OFF_RESULT]);

    const results = await resolveFoodSearch('carotte', 'api-key');

    expect(results).toEqual([{ ...OFF_RESULT, source: 'openfoodfacts' }]);
  });

  it('returns an empty array when both sources find nothing', async () => {
    searchOpenFoodFactsMock.mockResolvedValue([]);
    searchUsdaMock.mockResolvedValue([]);

    expect(await resolveFoodSearch('carotte', 'api-key')).toEqual([]);
  });

  it('lets an error from the primary source propagate instead of falling back silently', async () => {
    searchUsdaMock.mockRejectedValue(new Error('USDA is down'));

    await expect(resolveFoodSearch('carotte', 'api-key')).rejects.toThrow('USDA is down');
    expect(searchOpenFoodFactsMock).not.toHaveBeenCalled();
  });

  it('is case-insensitive when detecting a brand in the query', async () => {
    searchOpenFoodFactsMock.mockResolvedValue([OFF_RESULT]);

    await resolveFoodSearch('Bacon ALDI', 'api-key');

    expect(searchOpenFoodFactsMock).toHaveBeenCalled();
    expect(searchUsdaMock).not.toHaveBeenCalled();
  });
});
