'use client';

import Image from 'next/image';
import { Skeleton } from '@/components/ui/skeleton';
import { TetherIcon } from '@/components/icons/TetherIcon';
import { useFirestore, useDoc, useMemoFirebase } from '@/firebase';
import { doc } from 'firebase/firestore';

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
  
  if (settings?.appLogoUrl) {
      return <Image src={settings.appLogoUrl} alt="App Logo" width={24} height={24} className="h-6 w-6" />;
  }

  return <TetherIcon className="h-6 w-6" />;
}
