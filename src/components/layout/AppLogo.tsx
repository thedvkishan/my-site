'use client';

import Image from 'next/image';
import { Skeleton } from '@/components/ui/skeleton';
import { TetherIcon } from '@/components/icons/TetherIcon';
import { useFirestore, useDoc, useMemoFirebase } from '@/firebase';
import { doc } from 'firebase/firestore';
import { MOCK_SETTINGS } from '@/lib/constants';

type Settings = {
  appLogoUrl?: string;
}

export function AppLogo() {
  const firestore = useFirestore();
  
  const settingsRef = useMemoFirebase(() => {
    if (!firestore) return null;
    return doc(firestore, 'settings', 'appSettings');
  }, [firestore]);

  const { data: settings, isLoading } = useDoc<Settings>(settingsRef);

  if (isLoading) {
    return <Skeleton className="h-6 w-6 rounded-full" />;
  }
  
  // Use custom logo from Firestore, fallback to mock constant, then to Tether icon
  const logoUrl = settings?.appLogoUrl || MOCK_SETTINGS.appLogoUrl;

  if (logoUrl) {
      return <Image src={logoUrl} alt="App Logo" width={24} height={24} className="h-6 w-6 object-contain" />;
  }

  return <TetherIcon className="h-6 w-6" />;
}