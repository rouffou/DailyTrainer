import type { UserProfile } from '../models/user-profile.model';
import type { NutrientProfile } from '../models/nutrient-profile.model';
import {
  computeAjrPercentages,
  computeBmr,
  computePersonalizedTargets,
  computeTdee,
  DEFAULT_TARGETS,
} from './targets';

describe('DEFAULT_TARGETS', () => {
  it('matches the values from DailyTrainer_SPEC.md section 5.3', () => {
    expect(DEFAULT_TARGETS).toEqual({
      kcal: 2000,
      protein_g: 70,
      carbs_g: 260,
      fat_g: 70,
      fiber_g: 30,
      vitaminC_mg: 80,
      vitaminA_mcg: 800,
      calcium_mg: 800,
      iron_mg: 14,
      sodium_mg: 2000,
    });
  });
});

describe('computeBmr', () => {
  it('applies the male offset (+5)', () => {
    const profile: UserProfile = {
      sex: 'male',
      weightKg: 70,
      heightCm: 175,
      age: 30,
      activityLevel: 'sedentary',
    };

    expect(computeBmr(profile)).toBeCloseTo(1648.75);
  });

  it('applies the female offset (-161)', () => {
    const profile: UserProfile = {
      sex: 'female',
      weightKg: 60,
      heightCm: 165,
      age: 25,
      activityLevel: 'sedentary',
    };

    expect(computeBmr(profile)).toBeCloseTo(1345.25);
  });
});

describe('computeTdee', () => {
  it('multiplies BMR by the sedentary factor (1.2)', () => {
    const profile: UserProfile = {
      sex: 'male',
      weightKg: 70,
      heightCm: 175,
      age: 30,
      activityLevel: 'sedentary',
    };

    expect(computeTdee(profile)).toBeCloseTo(1978.5);
  });

  it('multiplies BMR by the light factor (1.375)', () => {
    const profile: UserProfile = {
      sex: 'male',
      weightKg: 70,
      heightCm: 175,
      age: 30,
      activityLevel: 'light',
    };

    expect(computeTdee(profile)).toBeCloseTo(1648.75 * 1.375);
  });

  it('multiplies BMR by the moderate factor (1.55)', () => {
    const profile: UserProfile = {
      sex: 'female',
      weightKg: 60,
      heightCm: 165,
      age: 25,
      activityLevel: 'moderate',
    };

    expect(computeTdee(profile)).toBeCloseTo(1345.25 * 1.55);
  });

  it('multiplies BMR by the active factor (1.725)', () => {
    const profile: UserProfile = {
      sex: 'male',
      weightKg: 70,
      heightCm: 175,
      age: 30,
      activityLevel: 'active',
    };

    expect(computeTdee(profile)).toBeCloseTo(1648.75 * 1.725);
  });

  it('multiplies BMR by the veryActive factor (1.9)', () => {
    const profile: UserProfile = {
      sex: 'male',
      weightKg: 70,
      heightCm: 175,
      age: 30,
      activityLevel: 'veryActive',
    };

    expect(computeTdee(profile)).toBeCloseTo(1648.75 * 1.9);
  });
});

describe('computeAjrPercentages', () => {
  it('computes (totals.X / targets.X) * 100 for each nutrient present in totals', () => {
    const totals: NutrientProfile = {
      kcal: 1000,
      protein_g: 35,
      carbs_g: 130,
      fat_g: 35,
      fiber_g: 15,
    };

    const percentages = computeAjrPercentages(totals, DEFAULT_TARGETS);

    expect(percentages.kcal).toBeCloseTo(50);
    expect(percentages.protein_g).toBeCloseTo(50);
    expect(percentages.fiber_g).toBeCloseTo(50);
  });

  it('skips a nutrient when the matching target is missing', () => {
    const totals: NutrientProfile = {
      kcal: 1000,
      protein_g: 35,
      carbs_g: 130,
      fat_g: 35,
      fiber_g: 15,
      zinc_mg: 5,
    };

    const percentages = computeAjrPercentages(totals, DEFAULT_TARGETS);

    expect(percentages.zinc_mg).toBeUndefined();
  });

  it('skips a nutrient when the matching target is zero, to avoid dividing by zero', () => {
    const totals: NutrientProfile = {
      kcal: 1000,
      protein_g: 35,
      carbs_g: 130,
      fat_g: 35,
      fiber_g: 15,
    };
    const targets: NutrientProfile = { ...DEFAULT_TARGETS, kcal: 0 };

    const percentages = computeAjrPercentages(totals, targets);

    expect(percentages.kcal).toBeUndefined();
  });

  it('ignores a target for a nutrient absent from totals', () => {
    const totals: NutrientProfile = {
      kcal: 1000,
      protein_g: 35,
      carbs_g: 130,
      fat_g: 35,
      fiber_g: 15,
    };

    const percentages = computeAjrPercentages(totals, DEFAULT_TARGETS);

    expect(percentages.calcium_mg).toBeUndefined();
  });
});

describe('computePersonalizedTargets', () => {
  it('sets kcal to the profile TDEE and scales the other macro fields by the same ratio', () => {
    // sedentary male, 70kg/175cm/30y: BMR = 700+1093.75-150+5 = 1648.75, TDEE = *1.2 = 1978.5
    const profile: UserProfile = {
      sex: 'male',
      weightKg: 70,
      heightCm: 175,
      age: 30,
      activityLevel: 'sedentary',
    };
    const tdee = computeTdee(profile);
    const scale = tdee / DEFAULT_TARGETS.kcal;

    const targets = computePersonalizedTargets(profile);

    expect(targets.kcal).toBeCloseTo(tdee);
    expect(targets.protein_g).toBeCloseTo(DEFAULT_TARGETS.protein_g * scale);
    expect(targets.carbs_g).toBeCloseTo(DEFAULT_TARGETS.carbs_g * scale);
    expect(targets.fat_g).toBeCloseTo(DEFAULT_TARGETS.fat_g * scale);
    expect(targets.fiber_g).toBeCloseTo(DEFAULT_TARGETS.fiber_g * scale);
  });

  it('leaves micronutrient RDAs unchanged, since they do not scale with energy needs', () => {
    const profile: UserProfile = {
      sex: 'female',
      weightKg: 60,
      heightCm: 165,
      age: 25,
      activityLevel: 'active',
    };

    const targets = computePersonalizedTargets(profile);

    expect(targets.vitaminC_mg).toBe(DEFAULT_TARGETS.vitaminC_mg);
    expect(targets.vitaminA_mcg).toBe(DEFAULT_TARGETS.vitaminA_mcg);
    expect(targets.calcium_mg).toBe(DEFAULT_TARGETS.calcium_mg);
    expect(targets.iron_mg).toBe(DEFAULT_TARGETS.iron_mg);
    expect(targets.sodium_mg).toBe(DEFAULT_TARGETS.sodium_mg);
  });

  it('scales against a custom base profile when one is given', () => {
    const profile: UserProfile = {
      sex: 'male',
      weightKg: 70,
      heightCm: 175,
      age: 30,
      activityLevel: 'sedentary',
    };
    const base: NutrientProfile = {
      kcal: 1000,
      protein_g: 50,
      carbs_g: 100,
      fat_g: 30,
      fiber_g: 20,
    };

    const targets = computePersonalizedTargets(profile, base);

    const tdee = computeTdee(profile);
    expect(targets.kcal).toBeCloseTo(tdee);
    expect(targets.protein_g).toBeCloseTo(50 * (tdee / 1000));
  });
});
