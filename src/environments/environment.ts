import type { Environment } from './environment.model';
import { usdaApiKey } from './environment.secrets';

// Config publique du projet Firebase "dailytrainer-dev" (voir issue #35).
// Publique par design (SDK Web) : la sécurité réelle vit dans firestore.rules,
// pas dans ces valeurs — DailyTrainer_SPEC.md section 10.
export const environment: Environment = {
  production: false,
  firebase: {
    apiKey: 'AIzaSyAu29kMH1W7N0L-LPW-7529dXRslDg2T4w',
    authDomain: 'dailytrainer-dev.firebaseapp.com',
    projectId: 'dailytrainer-dev',
    storageBucket: 'dailytrainer-dev.firebasestorage.app',
    messagingSenderId: '677303181599',
    appId: '1:677303181599:web:62fb8b4f093782f05ad02a',
  },
  usdaApiKey,
};
