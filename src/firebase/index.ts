
import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import { getAuth, Auth } from 'firebase/auth';
import { getFirestore, Firestore } from 'firebase/firestore';
import { firebaseConfig } from './config';

/**
 * Robust Firebase initialization for Next.js.
 * Ensures the app is only initialized once and handles SSR/Client boundaries safely.
 */

function getFirebaseInstances() {
  // Check if we have enough config to initialize. 
  // If not, we return nulls to avoid throwing during SSR if env vars are missing.
  if (!firebaseConfig.apiKey) {
    return {
      firebaseApp: null as unknown as FirebaseApp,
      auth: null as unknown as Auth,
      firestore: null as unknown as Firestore,
    };
  }

  const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
  const auth = getAuth(app);
  const firestore = getFirestore(app);

  return {
    firebaseApp: app,
    auth,
    firestore,
  };
}

const { firebaseApp, auth, firestore } = getFirebaseInstances();

export { firebaseApp, auth, firestore };

/**
 * Helper function used by the Client Provider to get SDK instances.
 */
export function initializeFirebase() {
  return getFirebaseInstances();
}

// Export providers and hooks
export * from './provider';
export * from './client-provider';
export * from './firestore/use-collection';
export * from './firestore/use-doc';
export * from './non-blocking-updates';
export * from './non-blocking-login';
export * from './errors';
export * from './error-emitter';
