'use client';

import app from '@/firebase/config';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import type { FirebaseApp } from 'firebase/app';

/**
 * Defensive Firebase initialization for the platform.
 * Returns core SDK instances using the centralized config.
 */
export function initializeFirebase() {
  return {
    firebaseApp: app,
    auth: getAuth(app),
    firestore: getFirestore(app)
  };
}

export { getSdks } from './init-sdks';
export * from './provider';
export * from './firestore/use-collection';
export * from './firestore/use-doc';
export * from './non-blocking-updates';
export * from './non-blocking-login';
export * from './errors';
export * from './error-emitter';
