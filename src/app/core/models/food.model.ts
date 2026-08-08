import type { Timestamp } from 'firebase/firestore';

import type { NutrientProfile } from './nutrient-profile.model';

export interface Food {
  id: string;
  name: string;
  source: 'local' | 'openfoodfacts' | 'usda';
  sourceId?: string;
  per100g: NutrientProfile;
  createdAt: Timestamp;
  ownerUid?: string;
}
