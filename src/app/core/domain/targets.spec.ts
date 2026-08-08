import type { UserProfile } from '../models/user-profile.model';
import { computeBmr, computeTdee, DEFAULT_TARGETS } from './targets';

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
