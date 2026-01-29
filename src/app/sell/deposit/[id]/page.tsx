'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Image from 'next/image';
import { useTransactionStore } from '@/hooks/use-transaction-store';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { MOCK_DEPOSIT_DETAILS, TRANSACTION_LIFETIME } from '@/lib/constants';
import { CountdownTimer } from '@/components/CountdownTimer';
import { Copy, Send, TimerIcon } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';

type Transaction = {
  id: string;
  usdtAmount: number;
  inrAmount: number;
  network: 'BEP20' | 'TRC20' | 'ERC20';
  status: string;
  expiresAt: number;
};

export default function SellDepositPage() {
  const router = useRouter();
  const params = useParams();
  const { id } = params;
  const { getTransaction, updateTransactionStatus } = useTransactionStore();
  const { toast } = useToast();
  const [transaction, setTransaction] = useState<Transaction | null>(null);
  const [isExpired, setIsExpired] = useState(false);

  useEffect(() => {
    if (typeof id === 'string') {
      const data = getTransaction(id);
      if (data) {
        if (data.status !== 'pending_deposit') {
          router.replace('/');
          toast({ title: 'Invalid Transaction State', variant: 'destructive' });
        } else if (Date.now() > data.expiresAt) {
          setIsExpired(true);
          updateTransactionStatus(id, 'expired');
        } else {
          setTransaction(data);
        }
      } else {
        router.replace('/');
        toast({ title: 'Transaction Not Found', variant: 'destructive' });
      }
    }
  }, [id, getTransaction, router, toast, updateTransactionStatus]);

  const depositInfo = transaction ? MOCK_DEPOSIT_DETAILS[transaction.network] : null;
  const depositAddress = depositInfo?.address || '';
  const qrCodeUrl = depositInfo?.qrCodeUrl || '';

  const handleCopy = () => {
    navigator.clipboard.writeText(depositAddress);
    toast({ title: 'Copied!', description: 'Deposit address copied to clipboard.' });
  };
  
  const handleNext = () => {
    if (typeof id === 'string') {
        // In a real app, you would wait for blockchain confirmation.
        // Here, we just move to the next step.
        updateTransactionStatus(id, 'payment_processing');
        router.push(`/buy/confirmation/${id}`); // Re-using buy confirmation page for simplicity
    }
  };

  const handleExpire = () => {
    if (typeof id === 'string' && !isExpired) {
        setIsExpired(true);
        updateTransactionStatus(id, 'expired');
     }
  };

  if (isExpired) {
    return (
      <div className="container mx-auto max-w-2xl py-12">
        <Card className="text-center">
          <CardHeader>
            <CardTitle className="text-destructive">Transaction Expired</CardTitle>
            <CardDescription>
              This deposit session has expired. Please create a new order.
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
    return <div className="container mx-auto max-w-2xl py-12 text-center">Loading...</div>;
  }
  
  return (
    <div className="container mx-auto max-w-2xl py-12">
      <Card>
        <CardHeader>
          <div className='flex justify-center mb-4'>
            <div className='p-3 bg-primary/10 rounded-full border-4 border-primary/20'>
              <Send className='h-8 w-8 text-primary' />
            </div>
          </div>
          <CardTitle className="text-center">Deposit USDT</CardTitle>
          <CardDescription className="text-center">
            To receive ₹{transaction.inrAmount.toLocaleString('en-IN')}, please deposit the USDT amount below.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="text-center">
            <p className="text-sm text-muted-foreground">Amount to Deposit</p>
            <p className="text-4xl font-bold tracking-tight">{transaction.usdtAmount.toLocaleString()} USDT</p>
            <p className="text-sm text-muted-foreground">Transaction ID: <span className='font-mono'>{transaction.id}</span></p>
          </div>
          
          <Separator />
          
          <div className="space-y-3">
            <h3 className="font-semibold text-center">Deposit Address</h3>
            <div className="p-4 bg-secondary rounded-lg text-center space-y-3">
                <Badge variant="outline">{transaction.network}</Badge>
                {qrCodeUrl && (
                    <div className="flex justify-center">
                        <Image data-ai-hint="qr code" src={qrCodeUrl} alt={`${transaction.network} Deposit QR Code`} width={200} height={200} className="rounded-lg border p-1 bg-white" />
                    </div>
                )}
                <p className="text-sm text-muted-foreground">Scan the QR code or use the address below.</p>
                <div className="flex items-center justify-center gap-2 mt-2 break-all">
                    <strong className="text-sm font-mono">{depositAddress}</strong>
                    <Button variant="ghost" size="icon" onClick={handleCopy}>
                        <Copy className="h-4 w-4" />
                    </Button>
                </div>
            </div>
          </div>

          <Alert>
            <TimerIcon className="h-4 w-4" />
            <AlertTitle>Deposit Window</AlertTitle>
            <AlertDescription className="flex items-center justify-between">
              <span>Please deposit USDT within the given time.</span>
              <CountdownTimer expiryTimestamp={transaction.expiresAt} onExpire={handleExpire} className="font-bold text-lg text-destructive" />
            </AlertDescription>
          </Alert>
        </CardContent>
        <CardFooter className="flex flex-col gap-4">
            <Button className="w-full" onClick={handleNext}>Proceed to Confirmation</Button>
            <p className="text-xs text-muted-foreground text-center">
                Payment will be processed after the deposit is confirmed on the blockchain.
            </p>
        </CardFooter>
      </Card>
    </div>
  );
}
