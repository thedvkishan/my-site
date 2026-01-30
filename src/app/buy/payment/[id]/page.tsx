'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Image from 'next/image';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { CountdownTimer } from '@/components/CountdownTimer';
import { Banknote, Copy, Loader2, TimerIcon } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Separator } from '@/components/ui/separator';
import { useSettingsStore } from '@/hooks/use-settings-store';
import { useDoc, useFirestore, useMemoFirebase } from '@/firebase';
import { doc, updateDoc } from 'firebase/firestore';

type Transaction = {
  id: string;
  usdtAmount: number;
  inrAmount: number;
  paymentMode: string;
  status: string;
  expiresAt: number;
};

export default function BuyPaymentPage() {
  const router = useRouter();
  const params = useParams();
  const { id } = params;
  const { toast } = useToast();
  const { settings, isInitialized: settingsInitialized } = useSettingsStore();
  const [isExpired, setIsExpired] = useState(false);

  const firestore = useFirestore();

  const transactionRef = useMemoFirebase(() => {
    if (!firestore || typeof id !== 'string') return null;
    return doc(firestore, 'buyOrders', id);
  }, [firestore, id]);
  
  const { data: transaction, isLoading: transactionLoading } = useDoc<Transaction>(transactionRef);
  const [loadTime] = useState(Date.now()); // Capture when component mounts

  useEffect(() => {
    if (transactionLoading) {
      return; // Wait until loading is finished
    }

    if (transaction) {
      // We found the transaction, proceed as normal
      if (transaction.status !== 'pending_payment') {
        router.replace('/');
        toast({ title: 'Invalid Transaction State', variant: 'destructive' });
      } else if (Date.now() > transaction.expiresAt) {
        handleExpire();
      }
    } else {
      // Transaction not found
      // Only redirect if it's been a few seconds since the page loaded.
      // This gives Firestore time to sync.
      if (Date.now() - loadTime > 3000) { 
        router.replace('/');
        toast({ title: 'Transaction Not Found', variant: 'destructive' });
      }
    }
  }, [transaction, transactionLoading, router, toast, loadTime, id]);

  const handleCopy = (text: string, fieldName: string) => {
    navigator.clipboard.writeText(text);
    toast({ title: 'Copied!', description: `${fieldName} copied to clipboard.` });
  };

  const handlePaid = async () => {
    if (transactionRef) {
      await updateDoc(transactionRef, { status: 'payment_processing' });
      router.push(`/buy/confirmation/${id}`);
    }
  };
  
  const handleExpire = async () => {
     if (transactionRef && !isExpired) {
        setIsExpired(true);
        await updateDoc(transactionRef, { status: 'expired' });
     }
  };

  if (!settingsInitialized || (transactionLoading && Date.now() - loadTime < 3000)) {
    return (
        <div className="container mx-auto flex min-h-[50vh] items-center justify-center">
             <Loader2 className="h-12 w-12 animate-spin text-primary" />
        </div>
    )
  }

  if (isExpired || (transaction && transaction.status === 'expired')) {
    return (
      <div className="container mx-auto max-w-2xl py-12">
        <Card className="text-center">
          <CardHeader>
            <CardTitle className="text-destructive">Transaction Expired</CardTitle>
            <CardDescription>
              This payment session has expired. Please create a new order.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={() => router.push('/')}>Go to Homepage</Button>
          </CardContent>
        </Card>
      </div>
    );
  }
  
  if (!transaction) {
    return (
      <div className="container mx-auto flex min-h-[50vh] items-center justify-center">
          <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }


  const renderPaymentDetails = () => {
    if (transaction.paymentMode === 'UPI') {
      return (
        <div className="space-y-4">
          <div className="flex justify-center">
            {settings.qrCodeUrl && <Image data-ai-hint="qr code" src={settings.qrCodeUrl} alt="UPI QR Code" width={200} height={200} className="rounded-lg border p-1" />}
          </div>
          <div className="text-center">
            <p className="text-sm text-muted-foreground">Scan the QR code or use the UPI ID below</p>
            <div className="flex items-center justify-center gap-2 mt-2">
              <strong className="text-lg font-mono">{settings.upiId}</strong>
              <Button variant="ghost" size="icon" onClick={() => handleCopy(settings.upiId, 'UPI ID')}>
                <Copy className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      );
    }
    if (['IMPS', 'NEFT', 'RTGS'].includes(transaction.paymentMode)) {
      return (
        <div className="space-y-3 text-sm">
          {Object.entries({
            "Account Holder Name": settings.bankDetails.holderName,
            "Bank Name": settings.bankDetails.bankName,
            "Account Number": settings.bankDetails.accountNumber,
            "IFSC Code": settings.bankDetails.ifsc,
          }).map(([key, value]) => (
            <div key={key} className="flex items-center justify-between">
              <span className="text-muted-foreground">{key}:</span>
              <div className="flex items-center gap-2">
                <strong className="font-mono">{value}</strong>
                <Button variant="ghost" size="icon" onClick={() => handleCopy(value, key)}>
                  <Copy className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      );
    }
    return <p className='text-center text-muted-foreground'>Payment instructions for {transaction.paymentMode} will be shown here.</p>;
  };

  return (
    <div className="container mx-auto max-w-2xl py-12">
      <Card>
        <CardHeader>
          <div className='flex justify-center mb-4'>
            <div className='p-3 bg-primary/10 rounded-full border-4 border-primary/20'>
              <Banknote className='h-8 w-8 text-primary' />
            </div>
          </div>
          <CardTitle className="text-center">Complete Your Payment</CardTitle>
          <CardDescription className="text-center">
            To buy {transaction.usdtAmount} USDT, please pay the amount below.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="text-center">
            <p className="text-sm text-muted-foreground">Amount to Pay</p>
            <p className="text-4xl font-bold tracking-tight">₹{transaction.inrAmount.toLocaleString('en-IN')}</p>
            <p className="text-sm text-muted-foreground">Transaction ID: <span className='font-mono'>{id}</span></p>
          </div>
          
          <Separator />
          
          <div className="space-y-2">
            <h3 className="font-semibold text-center">Payment Details for {transaction.paymentMode}</h3>
            <div className="p-4 bg-secondary rounded-lg">{renderPaymentDetails()}</div>
          </div>

          <Alert>
            <TimerIcon className="h-4 w-4" />
            <AlertTitle>Time Remaining</AlertTitle>
            <AlertDescription className="flex items-center justify-between">
              <span>Please complete the payment within the given time.</span>
              <CountdownTimer expiryTimestamp={transaction.expiresAt} onExpire={handleExpire} className="font-bold text-lg text-destructive" />
            </AlertDescription>
          </Alert>
        </CardContent>
        <CardFooter className="flex flex-col gap-4">
          <Button className="w-full" onClick={handlePaid}>
            I Have Paid
          </Button>
          <p className="text-xs text-muted-foreground text-center">
             Kindly mark as paid only after completing the transaction.
          </p>
        </CardFooter>
      </Card>
    </div>
  );
}
