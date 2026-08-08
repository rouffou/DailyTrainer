import { parseFoodInput, parseMultipleFoodInputs } from './food-input-parser';

describe('parseFoodInput', () => {
  it('parses "quantity unit de name"', () => {
    expect(parseFoodInput('100gr de bacon aldi')).toEqual({
      quantity: 100,
      unit: 'gr',
      name: 'bacon aldi',
    });
  });

  it('parses with a space between quantity and unit', () => {
    expect(parseFoodInput('500 g de crudités')).toEqual({
      quantity: 500,
      unit: 'g',
      name: 'crudités',
    });
  });

  it('parses without "de"', () => {
    expect(parseFoodInput('100 g pdt cuite')).toEqual({
      quantity: 100,
      unit: 'g',
      name: 'pdt cuite',
    });
  });

  it('parses with the "d\'" contraction', () => {
    expect(parseFoodInput("6 unité d'oeufs")).toEqual({
      quantity: 6,
      unit: 'unité',
      name: 'oeufs',
    });
  });

  it('defaults to "unité" when no unit token is present', () => {
    expect(parseFoodInput('2 œufs')).toEqual({ quantity: 2, unit: 'unité', name: 'œufs' });
  });

  it('does not swallow the first letter of a name that starts like a unit token', () => {
    expect(parseFoodInput('1 gâteau au chocolat')).toEqual({
      quantity: 1,
      unit: 'unité',
      name: 'gâteau au chocolat',
    });
  });

  it('accepts a decimal quantity with a comma', () => {
    expect(parseFoodInput('0,5kg de riz')).toEqual({ quantity: 0.5, unit: 'kg', name: 'riz' });
  });

  it('accepts a decimal quantity with a dot', () => {
    expect(parseFoodInput('1.5 cas de sucre')).toEqual({
      quantity: 1.5,
      unit: 'cas',
      name: 'sucre',
    });
  });

  it('is case-insensitive on the unit token', () => {
    expect(parseFoodInput('100Gr de Bacon')).toEqual({
      quantity: 100,
      unit: 'gr',
      name: 'Bacon',
    });
  });

  it('trims surrounding whitespace', () => {
    expect(parseFoodInput('  100g de bacon  ')).toEqual({
      quantity: 100,
      unit: 'g',
      name: 'bacon',
    });
  });

  it('returns null when there is no leading quantity', () => {
    expect(parseFoodInput('bacon aldi')).toBeNull();
  });

  it('treats a bare "quantity+unit" with nothing after it as the unit being the name', () => {
    // (.+) for the name is mandatory, so with nothing left to match, backtracking gives up the
    // optional unit match rather than fail outright — "100g" alone isn't a valid entry anyway.
    expect(parseFoodInput('100g')).toEqual({ quantity: 100, unit: 'unité', name: 'g' });
  });

  it('returns null for an empty string', () => {
    expect(parseFoodInput('')).toBeNull();
  });
});

describe('parseMultipleFoodInputs', () => {
  it('parses a comma-separated sentence into multiple entries', () => {
    expect(parseMultipleFoodInputs('100gr de bacon aldi, 500gr de crudités')).toEqual([
      { quantity: 100, unit: 'gr', name: 'bacon aldi' },
      { quantity: 500, unit: 'gr', name: 'crudités' },
    ]);
  });

  it('parses newline-separated entries from a multi-line textarea', () => {
    expect(parseMultipleFoodInputs('100g de bacon\n2 œufs\n0,5kg de riz')).toEqual([
      { quantity: 100, unit: 'g', name: 'bacon' },
      { quantity: 2, unit: 'unité', name: 'œufs' },
      { quantity: 0.5, unit: 'kg', name: 'riz' },
    ]);
  });

  it('drops a segment that fails to parse instead of failing the whole batch', () => {
    expect(parseMultipleFoodInputs('100g de bacon, pas une quantité valide, 2 œufs')).toEqual([
      { quantity: 100, unit: 'g', name: 'bacon' },
      { quantity: 2, unit: 'unité', name: 'œufs' },
    ]);
  });

  it('ignores blank segments from trailing/consecutive separators', () => {
    expect(parseMultipleFoodInputs('100g de bacon,,  \n, 2 œufs')).toEqual([
      { quantity: 100, unit: 'g', name: 'bacon' },
      { quantity: 2, unit: 'unité', name: 'œufs' },
    ]);
  });

  it('returns an empty array for an empty string', () => {
    expect(parseMultipleFoodInputs('')).toEqual([]);
  });

  it('returns a single-element array for a single valid entry', () => {
    expect(parseMultipleFoodInputs('100g de bacon')).toEqual([
      { quantity: 100, unit: 'g', name: 'bacon' },
    ]);
  });
});
