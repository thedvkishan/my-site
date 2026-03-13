'use client';

import { useRouter } from 'next/navigation';
import { Card, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Clock } from 'lucide-react';

export default function WithdrawalConfirmationPage() {
  const router = useRouter();

  return (
    <div className="container mx-auto max-w-lg py-12 px-4">
      <Card className="border-2 shadow-xl overflow-hidden">
        <div className="h-2 bg-accent animate-pulse" />
        <CardHeader className="items-center text-center py-12 space-y-4">
          <div className="p-4 bg-accent/10 rounded-full">
            <Clock className="h-16 w-16 text-accent animate-[spin_8s_linear_infinite]" />
          </div>
          <div className="space-y-2">
            <h2 className="text-2xl font-black uppercase tracking-tight">Awaiting for settlement confirmation</h2>
          </div>
        </CardHeader>
        <div className="p-6">
            <Button variant="outline" className="w-full h-12 font-black uppercase tracking-widest" onClick={() => router.push('/')}>
              Back to Hub
            </Button>
        </div>
      </Card>
    </div>
  );
}
