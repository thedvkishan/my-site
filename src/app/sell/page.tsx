
'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useUser } from '@/firebase';
import { SellForm } from '@/components/trade/SellForm';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { TetherIcon } from '@/components/icons/TetherIcon';
import { Loader2 } from 'lucide-react';

export default function SellPage() {
  const { user, isUserLoading } = useUser();
  const router = useRouter();

  useEffect(() => {
    if (!isUserLoading && !user) {
      router.push('/login?redirect=/sell');
    }
  }, [user, isUserLoading, router]);

  if (isUserLoading) {
    return (
        <div className="container mx-auto flex min-h-[50vh] items-center justify-center">
             <Loader2 className="h-12 w-12 animate-spin text-primary" />
        </div>
    );
  }

  if (!user) return null;

  return (
    <div className="container mx-auto max-w-2xl px-4 py-8 md:py-12">
      <Card className="shadow-lg border-2">
        <CardHeader className="text-center">
             <div className='flex justify-center mb-4'>
                <div className='p-3 bg-primary/10 rounded-full border-4 border-primary/20'>
                    <TetherIcon className='h-8 w-8 text-primary' />
                </div>
            </div>
          <CardTitle className="text-2xl font-bold">Sell Tether (USDT)</CardTitle>
          <CardDescription>Fill in your details to sell USDT and receive INR.</CardDescription>
        </CardHeader>
        <CardContent>
          <SellForm />
        </CardContent>
      </Card>
    </div>
  );
}
