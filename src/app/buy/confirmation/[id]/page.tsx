'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useTransactionStore } from '@/hooks/use-transaction-store';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { VERIFICATION_LIFETIME } from '@/lib/constants';
import { CountdownTimer } from '@/components/CountdownTimer';
import { CheckCircle2, Loader2, XCircle } from 'lucide-react';

type Transaction = {
  id: string;
  status: string;
};

type VerificationStatus = 'processing' | 'verified' | 'failed';

export default function BuyConfirmationPage() {
  const router = useRouter();
  const params = useParams();
  const { id } = params;
  const { getTransaction, updateTransactionStatus } = useTransactionStore();
  
  const [transaction, setTransaction] = useState<Transaction | null>(null);
  const [verificationStatus, setVerificationStatus] = useState<VerificationStatus>('processing');
  const [verificationExpiry] = useState(Date.now() + VERIFICATION_LIFETIME);

  useEffect(() => {
    if (typeof id === 'string') {
      const data = getTransaction(id);
      if (data) {
        if (data.status !== 'payment_processing') {
          router.replace('/');
        } else {
          setTransaction(data);
        }
      } else {
        router.replace('/');
      }
    }
  }, [id, getTransaction, router]);

  const handleExpire = () => {
    if (verificationStatus === 'processing') {
      setVerificationStatus('failed');
      if(typeof id === 'string') updateTransactionStatus(id, 'failed');
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
              Your payment is being verified. Please wait.
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
            <CardTitle className="mt-6">Payment Verified!</CardTitle>
            <CardDescription className="mt-2">
              Your USDT has been sent to your address.
            </CardDescription>
          </>
        );
      case 'failed':
        return (
          <>
            <XCircle className="h-16 w-16 text-destructive" />
            <CardTitle className="mt-6">No Deposit Found</CardTitle>
            <CardDescription className="mt-2">
              We could not verify your payment. The order has been cancelled.
            </CardDescription>
          </>
        );
    }
  };

  // Simulate verification result after some time
  useEffect(() => {
    if (verificationStatus === 'processing') {
      const timeout = setTimeout(() => {
        // Randomly succeed or fail for demonstration
        const isSuccess = Math.random() > 0.3; // 70% success rate
        if (isSuccess) {
          setVerificationStatus('verified');
          if(typeof id === 'string') updateTransactionStatus(id, 'completed');
        } else {
          setVerificationStatus('failed');
          if(typeof id === 'string') updateTransactionStatus(id, 'failed');
        }
      }, 10000); // Simulate after 10 seconds
      return () => clearTimeout(timeout);
    }
  }, [verificationStatus, id, updateTransactionStatus]);

  if (!transaction) {
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
