import { FirebaseOptions } from '@angular/fire/app';

export interface Environment {
  production: boolean;
  firebase: FirebaseOptions;
  // Exposed client-side while searchFood runs in the browser instead of a Cloud Function
  // (issue #36 — Blaze plan not enabled yet). USDA's free-tier key: low-stakes if scraped
  // (rate-limit risk, not a security breach), unlike the Firebase config above.
  usdaApiKey: string;
}
