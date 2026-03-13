'use client';

import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { firebaseConfig } from '@/firebase/config';

/**
 * Standardized Firebase Library Entry Point.
 * Optimized for production deployment on Vercel.
 * Includes defensive SSR guards.
 */
const getClientFirebase = () => {
  if (typeof window === 'undefined' || !firebaseConfig.apiKey) {
    return { app: null, auth: null, db: null };
  }
  const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
  const auth = getAuth(app);
  const db = getFirestore(app);
  return { app, auth, db };
};

export const { app, auth, db } = getClientFirebase();
