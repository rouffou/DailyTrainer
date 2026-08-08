export type BiologicalSex = 'male' | 'female';

export type ActivityLevel = 'sedentary' | 'light' | 'moderate' | 'active' | 'veryActive';

export interface UserProfile {
  sex: BiologicalSex;
  weightKg: number;
  heightCm: number;
  age: number;
  activityLevel: ActivityLevel;
}
