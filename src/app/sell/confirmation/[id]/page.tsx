'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Card, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { VERIFICATION_LIFETIME } from '@/lib/constants';
import { CountdownTimer } from '@/components/CountdownTimer';
import { CheckCircle2, Loader2, XCircle } from 'lucide-react';
import { useDoc, useFirestore, useMemoFirebase } from '@/firebase';
import { doc, updateDoc } from 'firebase/firestore';

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
  
  const [verificationStatus, setVerificationStatus] = useState<VerificationStatus>('processing');
  const [verificationExpiry] = useState(Date.now() + VERIFICATION_LIFETIME);

  const firestore = useFirestore();

  const transactionRef = useMemoFirebase(() => {
    if (!firestore || typeof id !== 'string') return null;
    return doc(firestore, 'sellOrders', id as string);
  }, [firestore, id]);

  const { data: transaction, isLoading: transactionLoading } = useDoc<Transaction>(transactionRef);
  const [loadTime] = useState(Date.now());


  useEffect(() => {
    if (transactionLoading) {
      return; // Wait until loading is finished
    }

    if (transaction) {
      // We found the transaction, proceed as normal
      if (transaction.status !== 'payment_processing') {
        router.replace('/');
      }
    } else {
      // Transaction not found
      // Only redirect if it's been a few seconds since the page loaded.
      if (Date.now() - loadTime > 3000) {
        router.replace('/');
      }
    }
  }, [id, transaction, transactionLoading, router, loadTime]);

  const handleExpire = async () => {
    if (verificationStatus === 'processing' && transactionRef) {
      setVerificationStatus('failed');
      await updateDoc(transactionRef, { status: 'expired' });
    }
  };

  const renderStatus = () => {
    switch (verificationStatus) {
      case 'processing':
        return (
          <>
            <Loader2 className="h-16 w-16 text-primary animate-spin" />
            <CardTitle className="mt-6">Processing Payment</CardTitle>
            <CardDescription className="mt-2">
              Your transaction is being verified. Please wait.
            </CardDescription>
            <div className='mt-4 text-center'>
              <p className='text-sm text-muted-foreground'>Time remaining for verification</p>
              <CountdownTimer expiryTimestamp={verificationExpiry} onExpire={handleExpire} className="font-bold text-lg text-foreground" />
            </div>
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
            <CardTitle className="mt-6">Verification Expired</CardTitle>
            <CardDescription className="mt-2">
              The verification window has closed. The order has been cancelled.
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
