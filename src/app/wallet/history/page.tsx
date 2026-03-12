
'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useUser, useFirestore, useMemoFirebase, useCollection } from '@/firebase';
import { collection, query, where } from 'firebase/firestore';
import { Loader2, History, TrendingUp, TrendingDown, ArrowDownCircle, ArrowUpCircle } from 'lucide-react';
import { format } from 'date-fns';
import { ScrollArea } from '@/components/ui/scroll-area';

export default function WalletHistoryPage() {
  const { user, isUserLoading } = useUser();
  const router = useRouter();
  const firestore = useFirestore();

  useEffect(() => {
    if (!isUserLoading && !user) {
      router.push('/login?redirect=/wallet/history');
    }
  }, [user, isUserLoading, router]);

  const depositsQuery = useMemoFirebase(() => {
    if (!firestore || !user?.uid) return null;
    return query(collection(firestore, 'deposits'), where('userId', '==', user.uid));
  }, [firestore, user]);

  const withdrawalsQuery = useMemoFirebase(() => {
    if (!firestore || !user?.uid) return null;
    return query(collection(firestore, 'withdrawals'), where('userId', '==', user.uid));
  }, [firestore, user]);

  const buyOrdersQuery = useMemoFirebase(() => {
    if (!firestore || !user?.uid) return null;
    return query(collection(firestore, 'buyOrders'), where('userId', '==', user.uid));
  }, [firestore, user]);

  const sellOrdersQuery = useMemoFirebase(() => {
    if (!firestore || !user?.uid) return null;
    return query(collection(firestore, 'sellOrders'), where('userId', '==', user.uid));
  }, [firestore, user]);

  const { data: deposits, isLoading: depositsLoading } = useCollection(depositsQuery);
  const { data: withdrawals, isLoading: withdrawalsLoading } = useCollection(withdrawalsQuery);
  const { data: buyOrders, isLoading: buyOrdersLoading } = useCollection(buyOrdersQuery);
  const { data: sellOrders, isLoading: sellOrdersLoading } = useCollection(sellOrdersQuery);

  if (isUserLoading || depositsLoading || withdrawalsLoading || buyOrdersLoading || sellOrdersLoading) {
    return (
        <div className="container mx-auto flex min-h-[50vh] items-center justify-center">
             <Loader2 className="h-12 w-12 animate-spin text-primary" />
        </div>
    );
  }

  const sortedDeposits = deposits?.slice().sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()) || [];
  const sortedWithdrawals = withdrawals?.slice().sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()) || [];
  const sortedBuy = buyOrders?.slice().sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()) || [];
  const sortedSell = sellOrders?.slice().sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()) || [];

  const handleAction = (item: any, type: 'buy' | 'sell' | 'deposit' | 'withdrawal') => {
    switch (type) {
        case 'buy':
            if (item.status === 'pending_payment') router.push(`/buy/payment/${item.id}`);
            else if (item.status === 'payment_processing') router.push(`/buy/confirmation/${item.id}`);
            break;
        case 'sell':
            if (item.status === 'payment_processing') router.push(`/sell/confirmation/${item.id}`);
            break;
        case 'deposit':
            if (item.status === 'pending_hash' || item.status === 'waiting_confirmation') router.push('/wallet/deposit');
            break;
        case 'withdrawal':
            if (item.status === 'pending') router.push(`/wallet/withdrawal/confirmation/${item.id}`);
            break;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
        case 'completed': return <Badge className="bg-green-500">Completed</Badge>;
        case 'payment_processing': return <Badge variant="secondary" className="bg-yellow-500/10 text-yellow-600 border-yellow-200">Processing</Badge>;
        case 'pending_payment': 
        case 'pending_deposit':
        case 'pending_hash': return <Badge variant="outline">Pending</Badge>;
        case 'expired': return <Badge variant="destructive">Expired</Badge>;
        case 'failed': return <Badge variant="destructive">Rejected</Badge>;
        case 'pending': return <Badge variant="secondary">Awaiting</Badge>;
        default: return <Badge variant="outline">{status}</Badge>;
    }
  };

  return (
    <div className="container mx-auto max-w-5xl px-4 py-12">
      <div className="flex items-center gap-3 mb-8">
        <div className="p-3 bg-primary/10 rounded-xl">
            <History className="h-8 w-8 text-primary" />
        </div>
        <div>
            <h1 className="text-3xl font-black tracking-tight uppercase">Activity Audit</h1>
            <p className="text-muted-foreground text-sm font-medium">Historical record of all platform interactions.</p>
        </div>
      </div>

      <Tabs defaultValue="buy" className="space-y-6">
        <TabsList className="grid w-full grid-cols-2 md:grid-cols-4 h-auto p-1 bg-muted/50 border rounded-xl">
            <TabsTrigger value="buy" className="font-black text-[10px] uppercase tracking-widest py-3">Buy History</TabsTrigger>
            <TabsTrigger value="sell" className="font-black text-[10px] uppercase tracking-widest py-3">Sell History</TabsTrigger>
            <TabsTrigger value="deposits" className="font-black text-[10px] uppercase tracking-widest py-3">Deposits</TabsTrigger>
            <TabsTrigger value="withdrawals" className="font-black text-[10px] uppercase tracking-widest py-3">Withdrawals</TabsTrigger>
        </TabsList>

        <TabsContent value="buy">
            <Card className="border-2 shadow-sm">
                <CardHeader>
                    <div className="flex items-center gap-2">
                        <TrendingUp className="h-5 w-5 text-green-500" />
                        <CardTitle className="text-lg font-black uppercase">Buy Protocol History</CardTitle>
                    </div>
                </CardHeader>
                <CardContent className="p-0">
                    <ScrollArea className="h-[500px]">
                        <Table>
                            <TableHeader className="bg-muted/30">
                                <TableRow>
                                    <TableHead className="text-[10px] font-black uppercase tracking-wider">Date</TableHead>
                                    <TableHead className="text-[10px] font-black uppercase tracking-wider">Volume</TableHead>
                                    <TableHead className="text-[10px] font-black uppercase tracking-wider">Method</TableHead>
                                    <TableHead className="text-[10px] font-black uppercase tracking-wider">Status</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {sortedBuy.length === 0 ? (
                                    <TableRow><TableCell colSpan={4} className="text-center py-12 text-muted-foreground font-medium italic">No Buy records found.</TableCell></TableRow>
                                ) : (
                                    sortedBuy.map(order => (
                                        <TableRow key={order.id} className="hover:bg-muted/30 transition-colors cursor-pointer" onClick={() => handleAction(order, 'buy')}>
                                            <TableCell className="text-xs font-medium">{format(new Date(order.createdAt), 'dd MMM yyyy HH:mm')}</TableCell>
                                            <TableCell className="font-black text-primary">{order.usdtAmount} USDT</TableCell>
                                            <TableCell className="text-xs font-bold opacity-70">{order.paymentMode}</TableCell>
                                            <TableCell>{getStatusBadge(order.status)}</TableCell>
                                        </TableRow>
                                    ))
                                )}
                            </TableBody>
                        </Table>
                    </ScrollArea>
                </CardContent>
            </Card>
        </TabsContent>

        <TabsContent value="sell">
            <Card className="border-2 shadow-sm">
                <CardHeader>
                    <div className="flex items-center gap-2">
                        <TrendingDown className="h-5 w-5 text-destructive" />
                        <CardTitle className="text-lg font-black uppercase">Liquidation Audit</CardTitle>
                    </div>
                </CardHeader>
                <CardContent className="p-0">
                    <ScrollArea className="h-[500px]">
                        <Table>
                            <TableHeader className="bg-muted/30">
                                <TableRow>
                                    <TableHead className="text-[10px] font-black uppercase tracking-wider">Date</TableHead>
                                    <TableHead className="text-[10px] font-black uppercase tracking-wider">Volume</TableHead>
                                    <TableHead className="text-[10px] font-black uppercase tracking-wider">Settlement</TableHead>
                                    <TableHead className="text-[10px] font-black uppercase tracking-wider">Status</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {sortedSell.length === 0 ? (
                                    <TableRow><TableCell colSpan={4} className="text-center py-12 text-muted-foreground font-medium italic">No Liquidation records found.</TableCell></TableRow>
                                ) : (
                                    sortedSell.map(order => (
                                        <TableRow key={order.id} className="hover:bg-muted/30 transition-colors cursor-pointer" onClick={() => handleAction(order, 'sell')}>
                                            <TableCell className="text-xs font-medium">{format(new Date(order.createdAt), 'dd MMM yyyy HH:mm')}</TableCell>
                                            <TableCell className="font-black text-destructive">-{order.usdtAmount} USDT</TableCell>
                                            <TableCell className="text-xs font-bold">₹{order.inrAmount?.toLocaleString()}</TableCell>
                                            <TableCell>{getStatusBadge(order.status)}</TableCell>
                                        </TableRow>
                                    ))
                                )}
                            </TableBody>
                        </Table>
                    </ScrollArea>
                </CardContent>
            </Card>
        </TabsContent>

        <TabsContent value="deposits">
            <Card className="border-2 shadow-sm">
                <CardHeader>
                    <div className="flex items-center gap-2">
                        <ArrowDownCircle className="h-5 w-5 text-blue-500" />
                        <CardTitle className="text-lg font-black uppercase">Wallet Credit Log</CardTitle>
                    </div>
                </CardHeader>
                <CardContent className="p-0">
                    <ScrollArea className="h-[500px]">
                        <Table>
                            <TableHeader className="bg-muted/30">
                                <TableRow>
                                    <TableHead className="text-[10px] font-black uppercase tracking-wider">Date</TableHead>
                                    <TableHead className="text-[10px] font-black uppercase tracking-wider">Amount</TableHead>
                                    <TableHead className="text-[10px] font-black uppercase tracking-wider">Network</TableHead>
                                    <TableHead className="text-[10px] font-black uppercase tracking-wider">Status</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {sortedDeposits.length === 0 ? (
                                    <TableRow><TableCell colSpan={4} className="text-center py-12 text-muted-foreground font-medium italic">No Credit records found.</TableCell></TableRow>
                                ) : (
                                    sortedDeposits.map(dep => (
                                        <TableRow key={dep.id} className="hover:bg-muted/30 transition-colors cursor-pointer" onClick={() => handleAction(dep, 'deposit')}>
                                            <TableCell className="text-xs font-medium">{format(new Date(dep.createdAt), 'dd MMM yyyy HH:mm')}</TableCell>
                                            <TableCell className="font-black text-green-600">+{dep.amount} USDT</TableCell>
                                            <TableCell className="text-xs font-bold opacity-70">{dep.network}</TableCell>
                                            <TableCell>{getStatusBadge(dep.status)}</TableCell>
                                        </TableRow>
                                    ))
                                )}
                            </TableBody>
                        </Table>
                    </ScrollArea>
                </CardContent>
            </Card>
        </TabsContent>

        <TabsContent value="withdrawals">
             <Card className="border-2 shadow-sm">
                <CardHeader>
                    <div className="flex items-center gap-2">
                        <ArrowUpCircle className="h-5 w-5 text-orange-500" />
                        <CardTitle className="text-lg font-black uppercase">Wallet Debit Log</CardTitle>
                    </div>
                </CardHeader>
                <CardContent className="p-0">
                    <ScrollArea className="h-[500px]">
                        <Table>
                            <TableHeader className="bg-muted/30">
                                <TableRow>
                                    <TableHead className="text-[10px] font-black uppercase tracking-wider">Date</TableHead>
                                    <TableHead className="text-[10px] font-black uppercase tracking-wider">Amount</TableHead>
                                    <TableHead className="text-[10px] font-black uppercase tracking-wider">Network</TableHead>
                                    <TableHead className="text-[10px] font-black uppercase tracking-wider">Status</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {sortedWithdrawals.length === 0 ? (
                                    <TableRow><TableCell colSpan={4} className="text-center py-12 text-muted-foreground font-medium italic">No Debit records found.</TableCell></TableRow>
                                ) : (
                                    sortedWithdrawals.map(wd => (
                                        <TableRow key={wd.id} className="hover:bg-muted/30 transition-colors cursor-pointer" onClick={() => handleAction(wd, 'withdrawal')}>
                                            <TableCell className="text-xs font-medium">{format(new Date(wd.createdAt), 'dd MMM yyyy HH:mm')}</TableCell>
                                            <TableCell className="font-black text-red-600">-{wd.amount} USDT</TableCell>
                                            <TableCell className="text-xs font-bold opacity-70">{wd.network}</TableCell>
                                            <TableCell>{getStatusBadge(wd.status)}</TableCell>
                                        </TableRow>
                                    ))
                                )}
                            </TableBody>
                        </Table>
                    </ScrollArea>
                </CardContent>
            </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
