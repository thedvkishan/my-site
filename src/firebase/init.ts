import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import { getAuth, Auth } from 'firebase/auth';
import { getFirestore, Firestore } from 'firebase/firestore';
import { firebaseConfig } from './config';

/**
 * Defensive Firebase initialization for Next.js.
 * Handles SSR/Client boundaries and ensures singleton pattern.
 */
function getFirebaseInstances() {
  // Defensive check for server-side execution
  if (typeof window === 'undefined') {
    return {
      firebaseApp: null,
      auth: null,
      firestore: null,
    };
  }

  // Check if we have a valid config to prevent initializeApp crashes
  if (!firebaseConfig.apiKey) {
    console.warn("Firebase configuration is missing. Ensure NEXT_PUBLIC_FIREBASE_API_KEY is set.");
    return {
      firebaseApp: null,
      auth: null,
      firestore: null,
    };
  }

  try {
    const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
    const auth = getAuth(app);
    const firestore = getFirestore(app);

    return {
      firebaseApp: app,
      auth,
      firestore,
    };
  } catch (error) {
    console.error("Firebase initialization failed:", error);
    return {
      firebaseApp: null,
      auth: null,
      firestore: null,
    };
  }
}

/**
 * Initialization function used by providers to get SDK instances.
 */
export function initializeFirebase() {
  return getFirebaseInstances();
}
