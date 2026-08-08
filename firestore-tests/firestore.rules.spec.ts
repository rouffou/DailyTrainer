import { readFileSync } from 'node:fs';

import {
  assertFails,
  assertSucceeds,
  initializeTestEnvironment,
  RulesTestEnvironment
} from '@firebase/rules-unit-testing';
import { doc, getDoc, setDoc } from 'firebase/firestore';

describe('firestore.rules — users/{uid}/**', () => {
  let testEnv: RulesTestEnvironment;

  beforeAll(async () => {
    testEnv = await initializeTestEnvironment({
      projectId: 'demo-dailytrainer',
      firestore: {
        rules: readFileSync('firestore.rules', 'utf8'),
        host: 'localhost',
        port: 8080
      }
    });
  });

  afterEach(async () => {
    await testEnv.clearFirestore();
  });

  afterAll(async () => {
    await testEnv.cleanup();
  });

  it('lets a user read and write their own documents', async () => {
    const aliceDb = testEnv.authenticatedContext('alice').firestore();
    const foodRef = doc(aliceDb, 'users/alice/foods/food1');

    await assertSucceeds(setDoc(foodRef, { name: 'Bacon' }));
    await assertSucceeds(getDoc(foodRef));
  });

  it("denies a user reading another user's documents", async () => {
    await testEnv.withSecurityRulesDisabled(async (context) => {
      await setDoc(doc(context.firestore(), 'users/alice/foods/food1'), { name: 'Bacon' });
    });

    const bobDb = testEnv.authenticatedContext('bob').firestore();
    await assertFails(getDoc(doc(bobDb, 'users/alice/foods/food1')));
  });

  it("denies a user writing another user's documents", async () => {
    const bobDb = testEnv.authenticatedContext('bob').firestore();
    await assertFails(setDoc(doc(bobDb, 'users/alice/foods/food1'), { name: 'Bacon' }));
  });

  it('denies an unauthenticated user any access', async () => {
    const anonDb = testEnv.unauthenticatedContext().firestore();
    await assertFails(getDoc(doc(anonDb, 'users/alice/foods/food1')));
    await assertFails(setDoc(doc(anonDb, 'users/alice/foods/food1'), { name: 'Bacon' }));
  });

  it('lets a user read and write their own dailyLogs and meals/items subcollections', async () => {
    const aliceDb = testEnv.authenticatedContext('alice').firestore();
    const itemRef = doc(aliceDb, 'users/alice/dailyLogs/2026-08-08/meals/lunch/items/item1');

    await assertSucceeds(setDoc(itemRef, { foodId: 'food1', quantity_g: 100 }));
    await assertSucceeds(getDoc(itemRef));
  });
});
