
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
import { collection, addDoc, doc, query, where } from 'firebase/firestore';
import { Loader2, Wallet, CheckCircle2, History } from 'lucide-react';
import { NETWORKS } from '@/lib/constants';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import { ScrollArea } from '@/components/ui/scroll-area';

type UserProfile = {
  balance?: number;
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
  const [submitted, setSubmitted] = useState(false);
  const [amount, setAmount] = useState('');
  const [network, setNetwork] = useState('BEP20');
  const [address, setAddress] = useState('');

  const firestore = useFirestore();

  const userProfileRef = useMemoFirebase(() => {
    if (!firestore || !user?.uid) return null;
    return doc(firestore, 'users', user.uid);
  }, [firestore, user]);

  const withdrawalsQuery = useMemoFirebase(() => {
    if (!firestore || !user?.uid) return null;
    return query(collection(firestore, 'withdrawals'), where('userId', '==', user.uid));
  }, [firestore, user]);

  const { data: profile } = useDoc<UserProfile>(userProfileRef);
  const { data: withdrawalHistory } = useCollection<Withdrawal>(withdrawalsQuery);

  useEffect(() => {
    if (!isUserLoading && !user) {
      router.push('/login?redirect=/wallet/withdrawal');
    }
  }, [user, isUserLoading, router]);

  const handleWithdraw = async () => {
    const numAmount = parseFloat(amount);
    const balance = profile?.balance || 0;

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
      await addDoc(collection(firestore, 'withdrawals'), {
        userId: user!.uid,
        amount: numAmount,
        network,
        address,
        status: 'pending',
        createdAt: new Date().toISOString(),
      });
      setSubmitted(true);
      toast({ title: 'Success', description: 'Withdrawal request submitted.' });
    } catch (error) {
      console.error(error);
      toast({ variant: 'destructive', title: 'Error', description: 'Failed to submit withdrawal request.' });
    } finally {
      setIsLoading(false);
    }
  };

  if (isUserLoading || !user) {
    return (
        <div className="container mx-auto flex min-h-[50vh] items-center justify-center">
             <Loader2 className="h-12 w-12 animate-spin text-primary" />
        </div>
    );
  }

  const sortedHistory = withdrawalHistory?.slice().sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()) || [];

  const getStatusBadge = (status: string) => {
    switch (status) {
        case 'completed': return <Badge className="bg-green-500">Completed</Badge>;
        case 'pending': return <Badge variant="secondary">Pending</Badge>;
        case 'failed': return <Badge variant="destructive">Failed</Badge>;
        default: return <Badge variant="outline">{status}</Badge>;
    }
  };

  return (
    <div className="container mx-auto max-w-4xl px-4 py-8 md:py-12 space-y-8">
      <div className="max-w-xl mx-auto w-full">
        {submitted ? (
          <Card className="text-center py-8">
              <CardContent className="space-y-6">
                  <div className="flex justify-center">
                      <CheckCircle2 className="h-20 w-20 text-green-500" />
                  </div>
                  <div className="space-y-2">
                      <CardTitle>Withdrawal Requested</CardTitle>
                      <CardDescription>
                          Your withdrawal of {amount} USDT is being processed. 
                          It will be sent to your {network} address shortly.
                      </CardDescription>
                  </div>
                  <Button className="w-full" onClick={() => setSubmitted(false)}>
                      Request Another Withdrawal
                  </Button>
              </CardContent>
          </Card>
        ) : (
          <Card>
            <CardHeader className="text-center">
              <div className="flex justify-center mb-4">
                   <div className="p-3 bg-accent/10 rounded-full border-4 border-accent/20">
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
              <Button className="w-full" size="lg" onClick={handleWithdraw} disabled={isLoading}>
                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Request Withdrawal
              </Button>
            </CardFooter>
          </Card>
        )}
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
                    <TableRow key={wd.id}>
                      <TableCell className="text-xs">
                        {format(new Date(wd.createdAt), 'PPp')}
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
    </div>
  );
}
