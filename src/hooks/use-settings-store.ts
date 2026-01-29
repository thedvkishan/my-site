'use client';

import { useState, useEffect, useCallback } from 'react';
import { 
    MOCK_BANK_DETAILS, 
    MOCK_UPI_ID, 
    MOCK_BUY_BANNER_URL, 
    MOCK_SELL_BANNER_URL, 
    MOCK_DEPOSIT_DETAILS,
    MOCK_QR_CODE_URL 
} from '@/lib/constants';

const isServer = typeof window === 'undefined';

const SETTINGS_KEY = 'tether-swap-settings';

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
  const [settings, setSettingsState] = useState<Settings>(getInitialSettings());
  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    if (isServer) {
        setIsInitialized(true); // Don't run on server
        return;
    };
    try {
      const item = window.localStorage.getItem(SETTINGS_KEY);
      const initialSettings = getInitialSettings();
      if (item) {
        // Deep merge to avoid issues if settings shape changes in future updates
        const stored = JSON.parse(item);
        const depositDetails = {
            ...initialSettings.depositDetails,
            ...stored.depositDetails,
            BEP20: { ...initialSettings.depositDetails.BEP20, ...stored.depositDetails?.BEP20 },
            TRC20: { ...initialSettings.depositDetails.TRC20, ...stored.depositDetails?.TRC20 },
            ERC20: { ...initialSettings.depositDetails.ERC20, ...stored.depositDetails?.ERC20 },
        };
        const bankDetails = { ...initialSettings.bankDetails, ...stored.bankDetails };

        setSettingsState({
            ...initialSettings,
            ...stored,
            depositDetails,
            bankDetails,
        });

      } else {
        window.localStorage.setItem(SETTINGS_KEY, JSON.stringify(initialSettings));
        setSettingsState(initialSettings);
      }
    } catch (error) {
      console.error('Error reading settings from localStorage', error);
      setSettingsState(getInitialSettings());
    }
    setIsInitialized(true);
  }, []);

  const setSettings = useCallback((newSettings: Partial<Settings>) => {
    if (isServer) return;
    try {
      setSettingsState(prevSettings => {
        const mergedSettings = { ...prevSettings, ...newSettings };
        window.localStorage.setItem(SETTINGS_KEY, JSON.stringify(mergedSettings));
        return mergedSettings;
      });
    } catch (error) {
      console.error('Error writing settings to localStorage', error);
    }
  }, []);

  return { settings, setSettings, isInitialized };
}
