
'use client';

import Image from 'next/image';
import { Skeleton } from '@/components/ui/skeleton';
import { TetherIcon } from '@/components/icons/TetherIcon';
import { useFirestore, useDoc, useMemoFirebase } from '@/firebase';
import { doc } from 'firebase/firestore';
import { MOCK_SETTINGS } from '@/lib/constants';
import { useEffect, useState } from 'react';

type Settings = {
  appLogoUrl?: string;
}

export function AppLogo() {
  const firestore = useFirestore();
  const [isClient, setIsClient] = useState(false);
  const [imageError, setImageError] = useState(false);
  
  useEffect(() => {
    setIsClient(true);
  }, []);

  const settingsRef = useMemoFirebase(() => {
    if (!firestore) return null;
    return doc(firestore, 'settings', 'appSettings');
  }, [firestore]);

  const { data: settings, isLoading } = useDoc<Settings>(settingsRef);

  if (!isClient) {
    return <div className="h-6 w-6 rounded-full bg-primary/10" />;
  }

  if (isLoading) {
    return <Skeleton className="h-6 w-6 rounded-full" />;
  }
  
  // High-availability fallback logic: Central DB -> Mock Default
  const logoUrl = settings?.appLogoUrl || MOCK_SETTINGS.appLogoUrl;

  if (logoUrl && !imageError) {
      return (
        <div className="relative h-6 w-6">
          <Image 
            src={logoUrl} 
            alt="Institutional Logo" 
            width={24} 
            height={24} 
            className="h-6 w-6 object-contain"
            priority
            onError={() => setImageError(true)}
          />
        </div>
      );
  }

  return <TetherIcon className="h-6 w-6" />;
}
