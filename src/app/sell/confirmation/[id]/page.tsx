'use client';

import { useRouter } from 'next/navigation';
import { Card, CardHeader, CardFooter, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Clock } from 'lucide-react';

export default function SellConfirmationPage() {
  const router = useRouter();

  return (
    <div className="container mx-auto max-w-lg py-12 px-4">
      <Card className="border-2 shadow-xl overflow-hidden">
        <div className="h-2 bg-destructive animate-pulse" />
        <CardHeader className="items-center text-center py-12 space-y-4">
          <div className="p-4 bg-destructive/10 rounded-full">
            <Clock className="h-16 w-16 text-destructive animate-spin-slow" />
          </div>
          <div className="space-y-2">
            <h2 className="text-2xl font-black uppercase tracking-tight">Awaiting for settlement confirmation</h2>
          </div>
        </CardHeader>
        <CardContent className="bg-muted/30 p-6 text-center text-[10px] font-bold uppercase tracking-widest text-muted-foreground border-y">
          Institutional Liquidation Logged
        </CardContent>
        <CardFooter className="p-6">
            <Button variant="outline" className="w-full h-12 font-black uppercase tracking-widest" onClick={() => router.push('/')}>
              Back to Hub
            </Button>
        </CardFooter>
      </Card>
      <style jsx global>{`
        @keyframes spin-slow {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        .animate-spin-slow {
          animation: spin-slow 8s linear infinite;
        }
      `}</style>
    </div>
  );
}
