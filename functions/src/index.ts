import { initializeApp } from 'firebase-admin/app';

// Cloud Functions entry point.
initializeApp();

export { cacheFoodSelection } from './cacheFoodSelection';
export { recalculateTotals } from './recalculateTotals';
export { searchFood } from './searchFood';
