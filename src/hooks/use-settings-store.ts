'use client';

import { useEffect, useCallback } from 'react';
import { doc } from 'firebase/firestore';
import { useFirestore, useDoc, useMemoFirebase } from '@/firebase';
import { setDocumentNonBlocking } from '@/firebase/non-blocking-updates';
import { 
    MOCK_BANK_DETAILS, 
    MOCK_UPI_ID, 
    MOCK_BUY_BANNER_URL, 
    MOCK_SELL_BANNER_URL, 
    MOCK_DEPOSIT_DETAILS,
    MOCK_QR_CODE_URL 
} from '@/lib/constants';

export type Settings = {
    bankDetails: typeof MOCK_BANK_DETAILS;
    upiId: string;
    qrCodeUrl: string;
    buyBannerUrl: string;
    sellBannerUrl: string;
    depositDetails: typeof MOCK_DEPOSIT_DETAILS;
}

const getInitialSettings = (): Settings => ({
  bankDetails: MOCK_BANK_DETAILS,
  upiId: MOCK_UPI_ID,
  qrCodeUrl: MOCK_QR_CODE_URL,
  buyBannerUrl: MOCK_BUY_BANNER_URL,
  sellBannerUrl: MOCK_SELL_BANNER_URL,
  depositDetails: MOCK_DEPOSIT_DETAILS,
});

export function useSettingsStore() {
  const firestore = useFirestore();
  
  const settingsRef = useMemoFirebase(() => {
    if (!firestore) return null;
    return doc(firestore, 'settings', 'appSettings');
  }, [firestore]);

  const { data: settings, isLoading, error } = useDoc<Settings>(settingsRef);

  // If the settings document doesn't exist, create it with initial values.
  useEffect(() => {
    if (!isLoading && !settings && !error && settingsRef) {
      const initialSettings = getInitialSettings();
      setDocumentNonBlocking(settingsRef, initialSettings, { merge: false });
    }
  }, [isLoading, settings, error, settingsRef]);

  const setSettings = useCallback((newSettings: Partial<Settings>) => {
    if (settingsRef) {
      setDocumentNonBlocking(settingsRef, newSettings, { merge: true });
    }
  }, [settingsRef]);
  
  const isInitialized = !isLoading && !!settings;

  return { settings: settings ?? getInitialSettings(), setSettings, isInitialized, isLoading };
}
