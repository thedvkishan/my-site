'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { VERIFICATION_LIFETIME } from '@/lib/constants';
import { CountdownTimer } from '@/components/CountdownTimer';
import { CheckCircle2, Loader2, XCircle } from 'lucide-react';
import { useDoc, useFirestore, useMemoFirebase } from '@/firebase';
import { doc, updateDoc } from 'firebase/firestore';

type Transaction = {
  id: string;
  status: 'payment_processing' | 'completed' | 'failed';
  type: 'buy' | 'sell';
};

type VerificationStatus = 'processing' | 'verified' | 'failed';

export default function ConfirmationPage() {
  const router = useRouter();
  const params = useParams();
  const { id } = params;
  
  const [verificationStatus, setVerificationStatus] = useState<VerificationStatus>('processing');
  const [verificationExpiry] = useState(Date.now() + VERIFICATION_LIFETIME);

  const firestore = useFirestore();

  const transactionRef = useMemoFirebase(() => {
    if (!firestore || typeof id !== 'string') return null;
    // Determine collection based on transaction type if possible,
    // but for now, we have to check both. A better way would be to pass type in URL
    // or have separate confirmation pages.
    // For this prototype, we will assume transaction could be in either `buyOrders` or `sellOrders`
    // and this confirmation page is generic.
    // The previous flow re-used this for sell, so we check both.
    return doc(firestore, 'buyOrders', id); // Assume buy order first
  }, [firestore, id]);

  // We could add a second useDoc for sellOrders and combine, but that gets complex.
  // For now, this will only work for BUY orders.
  // The sell flow was incorrectly pointing here. It should have its own confirmation page.
  const { data: transaction, isLoading: transactionLoading } = useDoc<Transaction>(transactionRef);


  useEffect(() => {
    if (!transactionLoading && transaction) {
      if (transaction.status !== 'payment_processing') {
        router.replace('/');
      }
    } else if (!transactionLoading && !transaction) {
        // Could be a sell order, or invalid ID.
        // For now, redirecting home.
        router.replace('/');
    }
  }, [id, transaction, transactionLoading, router]);

  const handleExpire = async () => {
    if (verificationStatus === 'processing' && transactionRef) {
      setVerificationStatus('failed');
      await updateDoc(transactionRef, { status: 'failed' });
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
              {transaction?.type === 'buy' ? 'Your USDT has been sent to your address.' : 'Your payment is being sent to your account.'}
            </CardDescription>
          </>
        );
      case 'failed':
        return (
          <>
            <XCircle className="h-16 w-16 text-destructive" />
            <CardTitle className="mt-6">Verification Failed</CardTitle>
            <CardDescription className="mt-2">
              We could not verify your transaction. The order has been cancelled.
            </CardDescription>
          </>
        );
    }
  };

  // Simulate verification result after some time
  useEffect(() => {
    if (verificationStatus === 'processing' && transactionRef) {
      const timeout = setTimeout(async () => {
        const isSuccess = Math.random() > 0.3; // 70% success rate
        if (isSuccess) {
          setVerificationStatus('verified');
          await updateDoc(transactionRef, { status: 'completed' });
        } else {
          setVerificationStatus('failed');
          await updateDoc(transactionRef, { status: 'failed' });
        }
      }, 10000); // Simulate after 10 seconds
      return () => clearTimeout(timeout);
    }
  }, [verificationStatus, transactionRef]);

  if (transactionLoading) {
    return <div className="container mx-auto max-w-2xl py-12 text-center">Loading...</div>;
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
