
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
import { useUser, useFirestore, useMemoFirebase, useDoc, useCollection } from '@/firebase';
import { collection, addDoc, doc, updateDoc, query, where } from 'firebase/firestore';
import { Loader2, Copy, TimerIcon, AlertCircle, History, Lock } from 'lucide-react';
import { CountdownTimer } from '@/components/CountdownTimer';
import { TetherIcon } from '@/components/icons/TetherIcon';
import { NETWORKS } from '@/lib/constants';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

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
  createdAt: string;
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

  const profileRef = useMemoFirebase(() => {
    if (!firestore || !user?.uid) return null;
    return doc(firestore, 'users', user.uid);
  }, [firestore, user]);

  const settingsRef = useMemoFirebase(() => {
    if (!firestore) return null;
    return doc(firestore, 'settings', 'appSettings');
  }, [firestore]);

  const activeDepositRef = useMemoFirebase(() => {
    if (!firestore || !activeDepositId) return null;
    return doc(firestore, 'deposits', activeDepositId);
  }, [firestore, activeDepositId]);

  const depositsQuery = useMemoFirebase(() => {
    if (!firestore || !user?.uid) return null;
    return query(collection(firestore, 'deposits'), where('userId', '==', user.uid));
  }, [firestore, user]);

  const { data: profile, isLoading: profileLoading } = useDoc(profileRef);
  const { data: settings } = useDoc<Settings>(settingsRef);
  const { data: activeDeposit } = useDoc<Deposit>(activeDepositRef);
  const { data: depositHistory } = useCollection<Deposit>(depositsQuery);

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

    if (profile?.status === 'on_hold') {
        toast({ variant: 'destructive', title: 'Action Disabled', description: 'Your account is on hold.' });
        return;
    }

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

  if (isUserLoading || profileLoading || !user) {
    return (
        <div className="container mx-auto flex min-h-[50vh] items-center justify-center">
             <Loader2 className="h-12 w-12 animate-spin text-primary" />
        </div>
    );
  }

  const sortedHistory = depositHistory?.slice().sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()) || [];
  const isOnHold = profile?.status === 'on_hold';

  const getStatusBadge = (status: string) => {
    switch (status) {
        case 'completed': return <Badge className="bg-green-500">Completed</Badge>;
        case 'waiting_confirmation': return <Badge variant="secondary" className="bg-yellow-500/10 text-yellow-600 border-yellow-200">Processing</Badge>;
        case 'pending_hash': return <Badge variant="outline">Unpaid</Badge>;
        case 'expired': return <Badge variant="destructive">Expired</Badge>;
        default: return <Badge variant="outline">{status}</Badge>;
    }
  };

  return (
    <div className="container mx-auto max-w-4xl px-4 py-8 md:py-12 space-y-8">
      <div className="max-w-xl mx-auto w-full">
        {isOnHold && step === 'input' && (
          <Alert variant="destructive" className="border-2 border-destructive animate-pulse mb-6">
              <Lock className="h-5 w-5" />
              <AlertTitle className="font-bold">Deposits Disabled</AlertTitle>
              <AlertDescription>Your account is currently on hold. You cannot perform new deposits at this time. Please contact support.</AlertDescription>
          </Alert>
        )}
        {step === 'input' && (
          <Card className={isOnHold ? 'opacity-60 pointer-events-none' : ''}>
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
              <Button className="w-full" onClick={startDeposit} disabled={isLoading || isOnHold}>
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
                          <span className="font-mono text-xs truncate max-w-[200px]">{activeDeposit?.txHash || txHash}</span>
                      </div>
                  </div>
                  <Button className="w-full" onClick={() => { setActiveDepositId(null); setStep('input'); }}>
                      Make New Deposit
                  </Button>
              </CardContent>
          </Card>
        )}
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center gap-3">
          <History className="h-5 w-5 text-muted-foreground" />
          <div>
            <CardTitle className="text-lg">Recent Deposits</CardTitle>
            <CardDescription>Your transaction history for direct USDT deposits.</CardDescription>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <ScrollArea className="h-[400px]">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Network</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sortedHistory.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center py-12 text-muted-foreground">
                      No deposit history found.
                    </TableCell>
                  </TableRow>
                ) : (
                  sortedHistory.map(dep => (
                    <TableRow key={dep.id} className="cursor-pointer hover:bg-muted/50" onClick={() => dep.status === 'pending_hash' && (setActiveDepositId(dep.id), setStep('pay'))}>
                      <TableCell className="text-xs">
                        {format(new Date(dep.createdAt), 'PPp')}
                      </TableCell>
                      <TableCell className="font-semibold text-green-600">
                        +{dep.amount} USDT
                      </TableCell>
                      <TableCell>{dep.network}</TableCell>
                      <TableCell>{getStatusBadge(dep.status)}</TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  );
}
