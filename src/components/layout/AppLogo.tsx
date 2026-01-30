'use client';

import Image from 'next/image';
import { useSettingsStore } from '@/hooks/use-settings-store';
import { TetherIcon } from '@/components/icons/TetherIcon';
import { Skeleton } from '@/components/ui/skeleton';

export function AppLogo() {
  const { settings, isInitialized } = useSettingsStore();

  if (!isInitialized) {
    return <Skeleton className="h-6 w-6 rounded-full" />;
  }
  
  if (settings.appLogoUrl) {
      return <Image src={settings.appLogoUrl} alt="App Logo" width={24} height={24} className="h-6 w-6" />;
  }

  return <TetherIcon className="h-6 w-6" />;
}
