import type { Environment } from './environment.model';
import { usdaApiKey } from './environment.secrets';

// Config publique du projet Firebase "dailytrainer-prod" (voir issue #35).
export const environment: Environment = {
  production: true,
  firebase: {
    apiKey: 'AIzaSyAozVaVtSK2REKJfw50VAt1GhBU8gvRgvA',
    authDomain: 'dailytrainer-prod.firebaseapp.com',
    projectId: 'dailytrainer-prod',
    storageBucket: 'dailytrainer-prod.firebasestorage.app',
    messagingSenderId: '733035227887',
    appId: '1:733035227887:web:20e980f7b70b3c8101091a',
  },
  usdaApiKey,
};
