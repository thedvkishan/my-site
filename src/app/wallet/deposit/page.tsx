
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { useUser, useFirestore, useMemoFirebase, useDoc } from '@/firebase';
import { collection, addDoc, doc, updateDoc } from 'firebase/firestore';
import { Loader2, CircleDollarSign, Copy, TimerIcon, AlertCircle, CheckCircle2 } from 'lucide-react';
import { CountdownTimer } from '@/components/CountdownTimer';
import { TetherIcon } from '@/components/icons/TetherIcon';
import { NETWORKS } from '@/lib/constants';

type Settings = {
  minDepositAmount?: number;
  depositDetails: {
    [key: string]: {
      address: string;
      qrCodeUrl: string;
    }
  }
}

type Deposit = {
  id: string;
  amount: number;
  network: string;
  status: string;
  expiresAt: number;
  txHash?: string;
}

export default function DepositPage() {
  const { user, isUserLoading } = useUser();
  const router = useRouter();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [step, setStep] = useState<'input' | 'pay' | 'confirm'>('input');
  const [amount, setAmount] = useState('');
  const [network, setNetwork] = useState('BEP20');
  const [activeDepositId, setActiveDepositId] = useState<string | null>(null);
  const [txHash, setTxHash] = useState('');

  const firestore = useFirestore();

  const settingsRef = useMemoFirebase(() => {
    if (!firestore) return null;
    return doc(firestore, 'settings', 'appSettings');
  }, [firestore]);

  const activeDepositRef = useMemoFirebase(() => {
    if (!firestore || !activeDepositId) return null;
    return doc(firestore, 'deposits', activeDepositId);
  }, [firestore, activeDepositId]);

  const { data: settings } = useDoc<Settings>(settingsRef);
  const { data: activeDeposit } = useDoc<Deposit>(activeDepositRef);

  useEffect(() => {
    if (!isUserLoading && !user) {
      router.push('/login?redirect=/wallet/deposit');
    }
  }, [user, isUserLoading, router]);

  useEffect(() => {
      if (activeDeposit) {
          if (activeDeposit.status === 'waiting_confirmation') {
              setStep('confirm');
          } else if (activeDeposit.status === 'expired' || activeDeposit.status === 'failed' || activeDeposit.status === 'completed') {
              setActiveDepositId(null);
              setStep('input');
          }
      }
  }, [activeDeposit]);

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({ title: 'Copied!', description: 'Address copied to clipboard.' });
  };

  const startDeposit = async () => {
    const numAmount = parseFloat(amount);
    const minDeposit = settings?.minDepositAmount ?? 100;

    if (!numAmount || numAmount <= 0) {
      toast({ variant: 'destructive', title: 'Invalid Amount', description: 'Please enter a valid amount to deposit.' });
      return;
    }

    if (numAmount < minDeposit) {
        toast({ variant: 'destructive', title: 'Minimum Deposit', description: `Minimum deposit amount is ${minDeposit} USDT.` });
        return;
    }

    setIsLoading(true);
    try {
      const depositData = {
        userId: user!.uid,
        amount: numAmount,
        network,
        status: 'pending_hash',
        createdAt: new Date().toISOString(),
        expiresAt: Date.now() + 180 * 60 * 1000, // 3 hours
      };
      
      const docRef = await addDoc(collection(firestore, 'deposits'), depositData);
      setActiveDepositId(docRef.id);
      setStep('pay');
    } catch (error) {
      console.error(error);
      toast({ variant: 'destructive', title: 'Error', description: 'Failed to initiate deposit.' });
    } finally {
      setIsLoading(false);
    }
  };

  const submitHash = async () => {
    if (!txHash.trim()) {
      toast({ variant: 'destructive', title: 'Hash Required', description: 'Please enter your transaction hash.' });
      return;
    }

    setIsLoading(true);
    try {
      if (activeDepositRef) {
        await updateDoc(activeDepositRef, {
          txHash,
          status: 'waiting_confirmation'
        });
        setStep('confirm');
      }
    } catch (error) {
      console.error(error);
      toast({ variant: 'destructive', title: 'Error', description: 'Failed to submit hash.' });
    } finally {
      setIsLoading(false);
    }
  };

  const handleExpire = async () => {
    if (activeDepositRef && activeDeposit?.status === 'pending_hash') {
        await updateDoc(activeDepositRef, { status: 'expired' });
        setActiveDepositId(null);
        setStep('input');
        toast({ variant: 'destructive', title: 'Expired', description: 'Deposit session has expired.' });
    }
  };

  if (isUserLoading || !user) {
    return (
        <div className="container mx-auto flex min-h-[50vh] items-center justify-center">
             <Loader2 className="h-12 w-12 animate-spin text-primary" />
        </div>
    );
  }

  return (
    <div className="container mx-auto max-w-xl px-4 py-12">
      {step === 'input' && (
        <Card>
          <CardHeader className="text-center">
            <div className="flex justify-center mb-4">
               <div className="p-3 bg-primary/10 rounded-full border-4 border-primary/20">
                    <TetherIcon className="h-8 w-8 text-primary" />
               </div>
            </div>
            <CardTitle>Deposit USDT</CardTitle>
            <CardDescription>Enter the amount and network you wish to deposit.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="amount">Amount (USDT)</Label>
              <Input
                id="amount"
                type="number"
                placeholder={`Min ${settings?.minDepositAmount ?? 100}`}
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
              />
              <p className="text-xs text-muted-foreground">Minimum deposit: {settings?.minDepositAmount ?? 100} USDT</p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="network">Network</Label>
              <Select value={network} onValueChange={setNetwork}>
                <SelectTrigger>
                  <SelectValue placeholder="Select network" />
                </SelectTrigger>
                <SelectContent>
                  {NETWORKS.map(net => (
                    <SelectItem key={net} value={net}>{net}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
          <CardFooter>
            <Button className="w-full" onClick={startDeposit} disabled={isLoading}>
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Continue to Pay
            </Button>
          </CardFooter>
        </Card>
      )}

      {step === 'pay' && activeDeposit && settings && (
        <Card>
          <CardHeader className="text-center">
            <div className="flex justify-center mb-4">
               <TetherIcon className="h-12 w-12 text-primary" />
            </div>
            <CardTitle>{activeDeposit.amount} USDT</CardTitle>
            <CardDescription>Scan QR or copy address to pay on {activeDeposit.network}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex flex-col items-center gap-4">
                <div className="p-2 border rounded-xl bg-white">
                    {settings.depositDetails[activeDeposit.network]?.qrCodeUrl && (
                        <Image src={settings.depositDetails[activeDeposit.network].qrCodeUrl} alt="QR Code" width={200} height={200} data-ai-hint="qr code" />
                    )}
                </div>
                <div className="w-full space-y-2">
                    <Label>Deposit Address</Label>
                    <div className="flex items-center gap-2 p-3 bg-secondary rounded-md font-mono text-sm break-all">
                        <span className="flex-1">{settings.depositDetails[activeDeposit.network]?.address}</span>
                        <Button variant="ghost" size="icon" onClick={() => handleCopy(settings.depositDetails[activeDeposit.network].address)}>
                            <Copy className="h-4 w-4" />
                        </Button>
                    </div>
                </div>
            </div>

            <div className="flex items-center justify-between p-4 bg-destructive/10 text-destructive rounded-lg">
                <div className="flex items-center gap-2">
                    <TimerIcon className="h-5 w-5" />
                    <span className="font-semibold">Remaining Time</span>
                </div>
                <CountdownTimer expiryTimestamp={activeDeposit.expiresAt} onExpire={handleExpire} className="font-bold text-xl" />
            </div>

            <div className="space-y-2">
                <Label htmlFor="txHash">Transaction Hash (TXID)</Label>
                <Input
                    id="txHash"
                    placeholder="Enter the transaction hash from your wallet"
                    value={txHash}
                    onChange={(e) => setTxHash(e.target.value)}
                />
            </div>
          </CardContent>
          <CardFooter className="flex flex-col gap-3">
            <Button className="w-full" size="lg" onClick={submitHash} disabled={isLoading}>
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              I Have Deposited
            </Button>
            <Button variant="ghost" className="w-full" onClick={() => { setActiveDepositId(null); setStep('input'); }}>
                Cancel Deposit
            </Button>
          </CardFooter>
        </Card>
      )}

      {step === 'confirm' && (
        <Card className="text-center py-12">
            <CardContent className="space-y-6">
                <div className="flex justify-center">
                    <div className="p-6 bg-yellow-500/10 rounded-full animate-pulse">
                        <AlertCircle className="h-16 w-16 text-yellow-500" />
                    </div>
                </div>
                <div className="space-y-2">
                    <CardTitle className="text-2xl">Waiting for Confirmation</CardTitle>
                    <CardDescription>
                        We have received your transaction hash. Our team is verifying your deposit. 
                        This usually takes 15-30 minutes.
                    </CardDescription>
                </div>
                <div className="p-4 bg-secondary rounded-lg text-left space-y-2">
                    <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Status:</span>
                        <span className="font-semibold text-yellow-600 uppercase">Processing</span>
                    </div>
                    <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Hash:</span>
                        <span className="font-mono text-xs truncate max-w-[200px]">{txHash}</span>
                    </div>
                </div>
                <Button className="w-full" onClick={() => router.push('/wallet/history')}>
                    View Deposit History
                </Button>
            </CardContent>
        </Card>
      )}
    </div>
  );
}
