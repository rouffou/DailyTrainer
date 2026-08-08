import { initializeApp } from 'firebase-admin/app';

// Cloud Functions entry point. Triggers (recalcul des totals) are added in issue #23.
initializeApp();

export { cacheFoodSelection } from './cacheFoodSelection';
export { searchFood } from './searchFood';
