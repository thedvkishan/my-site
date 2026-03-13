import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { firebaseConfig } from './config';

/**
 * Robust Firebase initialization for Next.js and Vercel.
 * Ensures the app is only initialized once and handles SSR/Client boundaries safely.
 * This file does not include 'use client' to allow flexible imports,
 * but Firebase services should only be called within Client Components.
 */

const firebaseApp = !getApps().length ? initializeApp(firebaseConfig) : getApp();
const auth = getAuth(firebaseApp);
const firestore = getFirestore(firebaseApp);

export { firebaseApp, auth, firestore };

/**
 * Helper function used by the Client Provider to get SDK instances.
 */
export function initializeFirebase() {
  return {
    firebaseApp,
    auth,
    firestore
  };
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
