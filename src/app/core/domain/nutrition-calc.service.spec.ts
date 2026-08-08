import type { Food } from '../models/food.model';
import { computeNutrients } from './nutrition-calc.service';

function makeFood(per100g: Food['per100g']): Food {
  return {
    id: 'food1',
    name: 'Test food',
    source: 'local',
    per100g,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any -- Timestamp isn't relevant to computeNutrients, and importing firebase/firestore's real type just for this test double isn't worth the coupling.
    createdAt: {} as any,
  };
}

describe('computeNutrients', () => {
  it('scales required fields by quantity_g / 100', () => {
    const food = makeFood({ kcal: 200, protein_g: 20, carbs_g: 10, fat_g: 5, fiber_g: 2 });

    const result = computeNutrients(food, 150);

    expect(result).toEqual({ kcal: 300, protein_g: 30, carbs_g: 15, fat_g: 7.5, fiber_g: 3 });
  });

  it('returns the same values as per100g when quantity_g is 100', () => {
    const per100g = { kcal: 200, protein_g: 20, carbs_g: 10, fat_g: 5, fiber_g: 2 };

    expect(computeNutrients(makeFood(per100g), 100)).toEqual(per100g);
  });

  it('returns all zeros when quantity_g is 0', () => {
    const food = makeFood({ kcal: 200, protein_g: 20, carbs_g: 10, fat_g: 5, fiber_g: 2 });

    expect(computeNutrients(food, 0)).toEqual({
      kcal: 0,
      protein_g: 0,
      carbs_g: 0,
      fat_g: 0,
      fiber_g: 0,
    });
  });

  it('scales optional micronutrients when present, and omits them when absent', () => {
    const food = makeFood({
      kcal: 100,
      protein_g: 10,
      carbs_g: 10,
      fat_g: 10,
      fiber_g: 1,
      vitaminC_mg: 80,
      iron_mg: 2,
    });

    const result = computeNutrients(food, 50);

    expect(result.vitaminC_mg).toBe(40);
    expect(result.iron_mg).toBe(1);
    expect(result.sodium_mg).toBeUndefined();
    expect(result.calcium_mg).toBeUndefined();
  });
});
