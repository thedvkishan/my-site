'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { useUser, useFirestore, useMemoFirebase, useDoc, useCollection } from '@/firebase';
import { collection, addDoc, doc, query, where, updateDoc, increment } from 'firebase/firestore';
import { Loader2, Wallet, History, Lock, Hash, Calendar, CreditCard, ExternalLink, ShieldCheck, ArrowUpCircle } from 'lucide-react';
import { NETWORKS } from '@/lib/constants';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { cn } from '@/lib/utils';

type UserProfile = {
  balance?: number;
  status?: string;
}

type Withdrawal = {
    id: string;
    amount: number;
    network: string;
    address: string;
    status: string;
    createdAt: string;
}

export default function WithdrawalPage() {
  const { user, isUserLoading } = useUser();
  const router = useRouter();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [amount, setAmount] = useState('');
  const [network, setNetwork] = useState('BEP20');
  const [address, setAddress] = useState('');
  const [selectedHistoryItem, setSelectedHistoryItem] = useState<Withdrawal | null>(null);

  const firestore = useFirestore();

  const userProfileRef = useMemoFirebase(() => {
    if (!firestore || !user?.uid) return null;
    return doc(firestore, 'users', user.uid);
  }, [firestore, user]);

  const withdrawalsQuery = useMemoFirebase(() => {
    if (!firestore || !user?.uid) return null;
    return query(collection(firestore, 'withdrawals'), where('userId', '==', user.uid));
  }, [firestore, user]);

  const { data: profile, isLoading: profileLoading } = useDoc<UserProfile>(userProfileRef);
  const { data: withdrawalHistory } = useCollection<Withdrawal>(withdrawalsQuery);

  useEffect(() => {
    if (!isUserLoading && !user) {
      router.push('/login?redirect=/wallet/withdrawal');
    }
  }, [user, isUserLoading, router]);

  const createInternalNotification = async (userId: string, title: string, message: string, type: 'info' | 'success' | 'warning' | 'error') => {
    if (!firestore) return;
    const notifRef = collection(firestore, 'users', userId, 'notifications');
    await addDoc(notifRef, {
        userId,
        title,
        message,
        type,
        read: false,
        createdAt: new Date().toISOString()
    });
  };

  const handleWithdraw = async () => {
    const numAmount = parseFloat(amount);
    const balance = profile?.balance || 0;

    if (profile?.status === 'on_hold') {
        toast({ variant: 'destructive', title: 'Action Disabled', description: 'Your account is on hold.' });
        return;
    }

    if (!numAmount || numAmount <= 0) {
      toast({ variant: 'destructive', title: 'Invalid Amount', description: 'Please enter a valid amount to withdraw.' });
      return;
    }

    if (numAmount > balance) {
      toast({ variant: 'destructive', title: 'Insufficient Balance', description: `You only have ${balance} USDT available.` });
      return;
    }

    if (!address.trim() || address.length < 10) {
        toast({ variant: 'destructive', title: 'Invalid Address', description: 'Please enter a valid USDT wallet address.' });
        return;
    }

    setIsLoading(true);
    try {
      const docRef = await addDoc(collection(firestore, 'withdrawals'), {
        userId: user!.uid,
        amount: numAmount,
        network,
        address,
        status: 'pending',
        createdAt: new Date().toISOString(),
      });

      if (userProfileRef) {
        await updateDoc(userProfileRef, { balance: increment(-numAmount) });
      }

      await createInternalNotification(
        user!.uid, 
        'Withdrawal Requested', 
        `${numAmount} USDT has been deducted and is awaiting internal settlement.`, 
        'info'
      );

      toast({ title: 'Success', description: 'Withdrawal requested. USDT deducted from balance.' });
      router.push(`/wallet/withdrawal/confirmation/${docRef.id}`);
    } catch (error) {
      console.error(error);
      toast({ variant: 'destructive', title: 'Error', description: 'Failed to submit withdrawal request.' });
    } finally {
      setIsLoading(false);
    }
  };

  if (isUserLoading || profileLoading || !user) {
    return (
        <div className="container mx-auto flex min-h-[50vh] items-center justify-center">
             <Loader2 className="h-12 w-12 animate-spin text-primary" />
        </div>
    );
  }

  const sortedHistory = withdrawalHistory?.slice().sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()) || [];
  const isOnHold = profile?.status === 'on_hold';

  const getStatusBadge = (status: string) => {
    switch (status) {
        case 'completed': return <Badge className="bg-green-500">Completed</Badge>;
        case 'pending': return <Badge variant="secondary">Pending</Badge>;
        case 'failed': return <Badge variant="destructive">Failed</Badge>;
        default: return <Badge variant="outline">{status}</Badge>;
    }
  };

  const handleRowClick = (wd: Withdrawal) => {
    setSelectedHistoryItem(wd);
  };

  const navigateToConfirmation = () => {
    if (!selectedHistoryItem) return;
    if (selectedHistoryItem.status === 'pending') {
        router.push(`/wallet/withdrawal/confirmation/${selectedHistoryItem.id}`);
    }
    setSelectedHistoryItem(null);
  };

  const DetailRow = ({ label, value, icon: Icon }: { label: string; value: React.ReactNode; icon: any }) => (
    <div className="flex items-center justify-between py-3 border-b last:border-0 border-dashed">
        <div className="flex items-center gap-2 text-muted-foreground">
            <Icon className="h-3.5 w-3.5" />
            <span className="text-[10px] font-bold uppercase tracking-wider">{label}</span>
        </div>
        <div className="text-sm font-black">{value}</div>
    </div>
  );

  return (
    <div className="container mx-auto max-w-4xl px-4 py-8 md:py-12 space-y-8">
      <div className="max-w-xl mx-auto w-full">
        {isOnHold && (
          <Alert variant="destructive" className="border-2 border-destructive animate-pulse mb-6">
              <Lock className="h-5 w-5" />
              <AlertTitle className="font-bold">Withdrawals Disabled</AlertTitle>
              <AlertDescription>Your account is currently on hold. You cannot perform new withdrawals at this time. Please contact support.</AlertDescription>
          </Alert>
        )}
        <Card className={isOnHold ? 'opacity-60 pointer-events-none' : ''}>
          <CardHeader className="text-center">
            <div className="flex justify-center mb-4">
                 <div className="p-3 bg-accent/10 rounded-full border-4 border-primary/20">
                      <Wallet className="h-8 w-8 text-accent" />
                 </div>
            </div>
            <CardTitle>Withdraw USDT</CardTitle>
            <CardDescription>Available Balance: {(profile?.balance || 0).toLocaleString()} USDT</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="amount">Amount (USDT)</Label>
                <div className="relative">
                  <Input
                      id="amount"
                      type="number"
                      placeholder="0.00"
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                  />
                  <Button 
                      variant="ghost" 
                      size="sm" 
                      className="absolute right-2 top-1/2 -translate-y-1/2 text-xs h-7"
                      onClick={() => setAmount((profile?.balance || 0).toString())}
                  >
                      MAX
                  </Button>
                </div>
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
              <div className="space-y-2">
                <Label htmlFor="address">Recipient Address</Label>
                <Input
                  id="address"
                  placeholder="Enter your receiving wallet address"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                />
              </div>
          </CardContent>
          <CardFooter>
            <Button className="w-full h-12 font-black uppercase tracking-widest" size="lg" onClick={handleWithdraw} disabled={isLoading || isOnHold}>
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Request Withdrawal
            </Button>
          </CardFooter>
        </Card>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center gap-3">
          <History className="h-5 w-5 text-muted-foreground" />
          <div>
            <CardTitle className="text-lg">Recent Withdrawals</CardTitle>
            <CardDescription>Your transaction history for USDT withdrawals.</CardDescription>
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
                      No withdrawal history found.
                    </TableCell>
                  </TableRow>
                ) : (
                  sortedHistory.map(wd => (
                    <TableRow key={wd.id} className="cursor-pointer hover:bg-muted/50" onClick={() => handleRowClick(wd)}>
                      <TableCell className="text-xs">
                        {format(new Date(wd.createdAt), 'dd MMM HH:mm')}
                      </TableCell>
                      <TableCell className="font-semibold text-red-600">
                        -{wd.amount} USDT
                      </TableCell>
                      <TableCell>{wd.network}</TableCell>
                      <TableCell>{getStatusBadge(wd.status)}</TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </ScrollArea>
        </CardContent>
      </Card>

      <Dialog open={!!selectedHistoryItem} onOpenChange={(open) => !open && setSelectedHistoryItem(null)}>
        <DialogContent className="max-w-md">
            <DialogHeader>
                <DialogTitle className="flex items-center gap-2 text-xl font-black uppercase text-orange-600">
                    <ArrowUpCircle className="h-5 w-5" /> Withdrawal Audit
                </DialogTitle>
                <DialogDescription className="text-[10px] font-bold uppercase tracking-widest opacity-60">Record Details for Withdrawal #{selectedHistoryItem?.id?.slice(-6)}</DialogDescription>
            </DialogHeader>
            
            {selectedHistoryItem && (
                <div className="space-y-6 py-4">
                    <div className="bg-orange-500/5 p-4 rounded-xl space-y-1 border border-orange-500/10">
                        <div className="flex items-center justify-between">
                            <span className="text-[10px] font-black text-muted-foreground uppercase">Protocol Status</span>
                            {getStatusBadge(selectedHistoryItem.status)}
                        </div>
                    </div>

                    <div className="space-y-0.5">
                        <DetailRow icon={Hash} label="Protocol ID" value={<span className="font-mono text-[10px]">{selectedHistoryItem.id}</span>} />
                        <DetailRow icon={Calendar} label="Requested At" value={format(new Date(selectedHistoryItem.createdAt), 'PPpp')} />
                        <DetailRow icon={Wallet} label="Debit Volume" value={<span className="text-destructive font-black">-{selectedHistoryItem.amount} USDT</span>} />
                        <DetailRow icon={ExternalLink} label="Settlement Network" value={selectedHistoryItem.network} />
                        
                        <div className="py-3 space-y-2 border-b border-dashed">
                            <div className="flex items-center gap-2 text-muted-foreground">
                                <CreditCard className="h-3.5 w-3.5" />
                                <span className="text-[10px] font-bold uppercase tracking-wider">Recipient Address</span>
                            </div>
                            <p className="text-[10px] font-mono break-all bg-secondary p-2 rounded border">{selectedHistoryItem.address}</p>
                        </div>
                    </div>

                    <div className="flex flex-col gap-3 pt-4">
                        {selectedHistoryItem.status === 'pending' && (
                            <Button className="w-full font-black uppercase tracking-widest h-12 shadow-xl shadow-orange-500/20" onClick={navigateToConfirmation}>
                                View Confirmation State
                            </Button>
                        )}
                        <Button variant="outline" className="w-full font-bold uppercase tracking-widest h-12" onClick={() => setSelectedHistoryItem(null)}>
                            Close Record
                        </Button>
                    </div>
                </div>
            )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
