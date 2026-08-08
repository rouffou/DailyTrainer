import type { Environment } from './environment.model';

// Config publique du projet Firebase "dailytrainer-prod" (voir issue #35).
export const environment: Environment = {
  production: true,
  firebase: {
    apiKey: 'REPLACE_WITH_PROD_API_KEY',
    authDomain: 'dailytrainer-prod.firebaseapp.com',
    projectId: 'dailytrainer-prod',
    storageBucket: 'dailytrainer-prod.appspot.com',
    messagingSenderId: 'REPLACE_WITH_PROD_SENDER_ID',
    appId: 'REPLACE_WITH_PROD_APP_ID'
  }
};
