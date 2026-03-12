'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Card, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CheckCircle2, Loader2, XCircle } from 'lucide-react';
import { useDoc, useFirestore, useMemoFirebase } from '@/firebase';
import { doc } from 'firebase/firestore';

type Transaction = {
  id: string;
  status: 'payment_processing' | 'completed' | 'failed' | 'expired';
  type: 'buy' | 'sell';
};

type VerificationStatus = 'processing' | 'verified' | 'failed';

export default function SellConfirmationPage() {
  const router = useRouter();
  const params = useParams();
  const { id } = params;
  
  const [verificationStatus] = useState<VerificationStatus>('processing');

  const firestore = useFirestore();

  const transactionRef = useMemoFirebase(() => {
    if (!firestore || typeof id !== 'string') return null;
    return doc(firestore, 'sellOrders', id as string);
  }, [firestore, id]);

  const { data: transaction, isLoading: transactionLoading } = useDoc<Transaction>(transactionRef);
  const [loadTime] = useState(Date.now());


  useEffect(() => {
    if (transactionLoading) {
      return;
    }

    if (transaction) {
      if (transaction.status !== 'payment_processing') {
        router.replace('/');
      }
    } else {
      if (Date.now() - loadTime > 3000) {
        router.replace('/');
      }
    }
  }, [id, transaction, transactionLoading, router, loadTime]);

  const renderStatus = () => {
    switch (verificationStatus) {
      case 'processing':
        return (
          <>
            <Loader2 className="h-16 w-16 text-primary animate-spin" />
            <CardTitle className="mt-6">Settlement Initiated</CardTitle>
            <CardDescription className="mt-2">
              Your liquidation request is being processed by our internal protocol.
            </CardDescription>
          </>
        );
      case 'verified':
        return (
          <>
            <CheckCircle2 className="h-16 w-16 text-green-500" />
            <CardTitle className="mt-6">Transaction Verified!</CardTitle>
            <CardDescription className="mt-2">
              Your payment is being sent to your account.
            </CardDescription>
          </>
        );
      case 'failed':
        return (
          <>
            <XCircle className="h-16 w-16 text-destructive" />
            <CardTitle className="mt-6">Verification Failed</CardTitle>
            <CardDescription className="mt-2">
              The verification could not be completed. Please contact support.
            </CardDescription>
          </>
        );
    }
  };

  if (transactionLoading && (Date.now() - loadTime < 3000)) {
    return (
        <div className="container mx-auto flex min-h-[50vh] items-center justify-center">
             <Loader2 className="h-12 w-12 animate-spin text-primary" />
        </div>
    );
  }

  return (
    <div className="container mx-auto max-w-lg py-12">
      <Card>
        <CardHeader className="items-center text-center">
          {renderStatus()}
        </CardHeader>
        <CardFooter>
            <Button className="w-full" onClick={() => router.push('/')}>
              {verificationStatus === 'processing' ? 'Back to Home' : 'Start a New Transaction'}
            </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
