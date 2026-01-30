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
import { useDoc, useFirestore, useMemoFirebase } from '@/firebase';
import { doc, updateDoc } from 'firebase/firestore';
import { MOCK_SETTINGS } from '@/lib/constants';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';

type Transaction = {
  id: string;
  usdtAmount: number;
  inrAmount: number;
  paymentMode: string;
  status: string;
  expiresAt: number;
};

type Settings = typeof MOCK_SETTINGS;

export default function BuyPaymentPage() {
  const router = useRouter();
  const params = useParams();
  const { id } = params;
  const { toast } = useToast();
  const [isExpired, setIsExpired] = useState(false);
  const [receipt, setReceipt] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  const firestore = useFirestore();

  const transactionRef = useMemoFirebase(() => {
    if (!firestore || typeof id !== 'string') return null;
    return doc(firestore, 'buyOrders', id);
  }, [firestore, id]);
  
  const settingsRef = useMemoFirebase(() => {
    if (!firestore) return null;
    return doc(firestore, 'settings', 'appSettings');
  }, [firestore]);

  const { data: transaction, isLoading: transactionLoading } = useDoc<Transaction>(transactionRef);
  const { data: settings, isLoading: settingsLoading } = useDoc<Settings>(settingsRef);
  
  useEffect(() => {
    if (transaction) {
      if (transaction.status !== 'pending_payment') {
        router.replace('/');
      } else if (Date.now() > transaction.expiresAt) {
        handleExpire();
      }
    }
  }, [transaction, router]);

  const handleCopy = (text: string, fieldName: string) => {
    navigator.clipboard.writeText(text);
    toast({ title: 'Copied!', description: `${fieldName} copied to clipboard.` });
  };
  
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setIsUploading(true);
      const reader = new FileReader();
      reader.onload = (loadEvent) => {
        setReceipt(loadEvent.target?.result as string);
        setIsUploading(false);
        toast({ title: 'Receipt Uploaded', description: 'Your receipt has been attached.' });
      };
      reader.onerror = () => {
        setIsUploading(false);
        toast({ variant: 'destructive', title: 'Upload Failed', description: 'Could not read the file.' });
      };
      reader.readAsDataURL(file);
    }
  };

  const handlePaid = async () => {
    if (transactionRef) {
      const dataToUpdate: { status: string; paymentReceiptUrl?: string } = { status: 'payment_processing' };
      if (receipt) {
        dataToUpdate.paymentReceiptUrl = receipt;
      }
      await updateDoc(transactionRef, dataToUpdate);
      router.push(`/buy/confirmation/${id}`);
    }
  };
  
  const handleExpire = async () => {
     if (transactionRef && !isExpired) {
        setIsExpired(true);
        await updateDoc(transactionRef, { status: 'expired' });
     }
  };

  if (settingsLoading || !settings || transactionLoading) {
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
    // This state can happen briefly while the new transaction is being created.
    // Instead of showing "Not Found" immediately, we show a loader.
    // If the transaction is still not found after a reasonable time, it might be a real issue.
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

          <Separator />
          <div className="space-y-2 pt-4">
              <Label htmlFor="receipt-upload">Upload Payment Receipt (Optional)</Label>
              <Input
                  id="receipt-upload"
                  type="file"
                  accept=".pdf,.png,.jpg,.jpeg"
                  onChange={handleFileChange}
                  className="text-sm file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-primary/10 file:text-primary hover:file:bg-primary/20"
              />
              {isUploading && (
                  <div className="flex items-center text-sm text-muted-foreground">
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      <span>Uploading...</span>
                  </div>
              )}
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
          <Button className="w-full" onClick={handlePaid} disabled={isUploading}>
            {isUploading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
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
