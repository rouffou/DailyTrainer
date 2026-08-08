import type { Environment } from './environment.model';

// Config publique du projet Firebase "dailytrainer-dev" (voir issue #35).
// Publique par design (SDK Web) : la sécurité réelle vit dans firestore.rules,
// pas dans ces valeurs — DailyTrainer_SPEC.md section 10.
export const environment: Environment = {
  production: false,
  firebase: {
    apiKey: 'REPLACE_WITH_DEV_API_KEY',
    authDomain: 'dailytrainer-dev.firebaseapp.com',
    projectId: 'dailytrainer-dev',
    storageBucket: 'dailytrainer-dev.appspot.com',
    messagingSenderId: 'REPLACE_WITH_DEV_SENDER_ID',
    appId: 'REPLACE_WITH_DEV_APP_ID'
  }
};
