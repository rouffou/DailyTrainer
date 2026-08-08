import type { NutrientProfile } from '../models/nutrient-profile.model';
import {
  aggregateTotals,
  computeMacroDistribution,
  computeNutrients,
} from './nutrition-calc.service';

describe('computeNutrients', () => {
  it('scales required fields by quantity_g / 100', () => {
    const per100g = { kcal: 200, protein_g: 20, carbs_g: 10, fat_g: 5, fiber_g: 2 };

    const result = computeNutrients(per100g, 150);

    expect(result).toEqual({ kcal: 300, protein_g: 30, carbs_g: 15, fat_g: 7.5, fiber_g: 3 });
  });

  it('returns the same values as per100g when quantity_g is 100', () => {
    const per100g = { kcal: 200, protein_g: 20, carbs_g: 10, fat_g: 5, fiber_g: 2 };

    expect(computeNutrients(per100g, 100)).toEqual(per100g);
  });

  it('returns all zeros when quantity_g is 0', () => {
    const per100g = { kcal: 200, protein_g: 20, carbs_g: 10, fat_g: 5, fiber_g: 2 };

    expect(computeNutrients(per100g, 0)).toEqual({
      kcal: 0,
      protein_g: 0,
      carbs_g: 0,
      fat_g: 0,
      fiber_g: 0,
    });
  });

  it('scales optional micronutrients when present, and omits them when absent', () => {
    const per100g = {
      kcal: 100,
      protein_g: 10,
      carbs_g: 10,
      fat_g: 10,
      fiber_g: 1,
      vitaminC_mg: 80,
      iron_mg: 2,
    };

    const result = computeNutrients(per100g, 50);

    expect(result.vitaminC_mg).toBe(40);
    expect(result.iron_mg).toBe(1);
    expect(result.sodium_mg).toBeUndefined();
    expect(result.calcium_mg).toBeUndefined();
  });
});

describe('aggregateTotals', () => {
  it('returns all-zero required fields for an empty list', () => {
    expect(aggregateTotals([])).toEqual({
      kcal: 0,
      protein_g: 0,
      carbs_g: 0,
      fat_g: 0,
      fiber_g: 0,
    });
  });

  it('sums required fields across profiles', () => {
    const a: NutrientProfile = { kcal: 100, protein_g: 10, carbs_g: 5, fat_g: 2, fiber_g: 1 };
    const b: NutrientProfile = { kcal: 50, protein_g: 5, carbs_g: 2, fat_g: 1, fiber_g: 0.5 };

    expect(aggregateTotals([a, b])).toEqual({
      kcal: 150,
      protein_g: 15,
      carbs_g: 7,
      fat_g: 3,
      fiber_g: 1.5,
    });
  });

  it('returns a single profile unchanged', () => {
    const profile: NutrientProfile = {
      kcal: 100,
      protein_g: 10,
      carbs_g: 5,
      fat_g: 2,
      fiber_g: 1,
      vitaminC_mg: 80,
    };

    expect(aggregateTotals([profile])).toEqual(profile);
  });

  it('sums an optional micronutrient only present on some profiles, and omits ones present on none', () => {
    const a: NutrientProfile = {
      kcal: 100,
      protein_g: 10,
      carbs_g: 5,
      fat_g: 2,
      fiber_g: 1,
      vitaminC_mg: 30,
    };
    const b: NutrientProfile = { kcal: 50, protein_g: 5, carbs_g: 2, fat_g: 1, fiber_g: 0.5 };
    const c: NutrientProfile = {
      kcal: 20,
      protein_g: 2,
      carbs_g: 1,
      fat_g: 0,
      fiber_g: 0,
      vitaminC_mg: 10,
    };

    const result = aggregateTotals([a, b, c]);

    expect(result.vitaminC_mg).toBe(40);
    expect(result.calcium_mg).toBeUndefined();
  });
});

describe('computeMacroDistribution', () => {
  it('expresses each macro as a % of totals.kcal using Atwater factors (4/4/9)', () => {
    // protein: 25g * 4 = 100 kcal, carbs: 150g * 4 = 600 kcal, fat: 33.33g * 9 = 300 kcal
    const totals: NutrientProfile = {
      kcal: 1000,
      protein_g: 25,
      carbs_g: 150,
      fat_g: 100 / 3,
      fiber_g: 10,
    };

    const distribution = computeMacroDistribution(totals);

    expect(distribution).toEqual([
      { label: 'Protéines', percentOfKcal: 10 },
      { label: 'Glucides', percentOfKcal: 60 },
      { label: 'Lipides', percentOfKcal: 30 },
    ]);
  });

  it('returns all zeros when totals.kcal is zero, avoiding a division by zero', () => {
    const totals: NutrientProfile = { kcal: 0, protein_g: 0, carbs_g: 0, fat_g: 0, fiber_g: 0 };

    const distribution = computeMacroDistribution(totals);

    expect(distribution).toEqual([
      { label: 'Protéines', percentOfKcal: 0 },
      { label: 'Glucides', percentOfKcal: 0 },
      { label: 'Lipides', percentOfKcal: 0 },
    ]);
  });
});
